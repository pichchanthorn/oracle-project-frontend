import { Component, ElementRef, QueryList, ViewChildren, signal } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../auth.service';

type LoginField = 'username' | 'password';
type LoginStep = 'credentials' | 'verification' | 'complete';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  @ViewChildren('otpInput') private otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  readonly terminalName = 'Terminal 01';

  credentials = {
    username: '',
    password: '',
    rememberTerminal: false
  };

  currentStep: LoginStep = 'credentials';
  focusedField: LoginField | null = null;
  showPassword = false;
  isAuthenticating = false;
  isVerifying = false;
  accessGranted = false;
  otpTouched = false;
  otpDigits = ['', '', '', '', '', ''];
  loginError = signal('');
  otpError = signal('');

  // The 2FA challenge token is intentionally kept as a plain in-memory field
  // and nothing else — it is never written to localStorage/sessionStorage,
  // never passed to AuthService for persistence, and is dropped as soon as
  // the user signs in with a different account or navigates away.
  private challengeToken: string | null = null;

  constructor(private readonly router: Router, private readonly authService: AuthService) {}

  get isVerificationStep(): boolean {
    return this.currentStep === 'verification' || this.currentStep === 'complete';
  }

  get isOtpComplete(): boolean {
    return this.otpDigits.every((digit) => digit.length === 1);
  }

  get passwordInputType(): 'text' | 'password' {
    return this.showPassword ? 'text' : 'password';
  }

  get passwordIcon(): string {
    return this.showPassword ? 'visibility_off' : 'visibility';
  }

  get submitLabel(): string {
    if (this.isAuthenticating) {
      return 'Authenticating';
    }

    return 'Sign In to POS';
  }

  get verificationLabel(): string {
    if (this.accessGranted) {
      return 'Success';
    }

    if (this.isVerifying) {
      return 'Verifying';
    }

    return 'Verify & Sign In';
  }

  setFocusedField(field: LoginField | null): void {
    this.focusedField = field;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  signIn(form: NgForm): void {
    this.loginError.set('');

    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    if (this.isAuthenticating) {
      return;
    }

    this.isAuthenticating = true;

    this.authService.login(this.credentials.username, this.credentials.password).subscribe({
      next: (response) => {
        this.isAuthenticating = false;

        if (response.requiresTwoFactor) {
          this.challengeToken = response.challengeToken;
          this.goToVerification();
        } else {
          void this.router.navigate(['/dashboard']);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isAuthenticating = false;
        this.loginError.set(this.describeLoginError(err));
      }
    });
  }

  goToVerification(): void {
    this.isAuthenticating = false;
    this.accessGranted = false;
    this.currentStep = 'verification';
    this.focusOtpInput(0);
  }

  verifyOtp(): void {
    this.otpTouched = true;
    this.otpError.set('');

    if (!this.isOtpComplete || this.isVerifying || this.accessGranted) {
      this.focusFirstEmptyOtp();
      return;
    }

    if (!this.challengeToken) {
      this.otpError.set('Your session has expired. Please sign in again.');
      return;
    }

    this.isVerifying = true;

    const code = this.otpDigits.join('');

    this.authService.verifyLogin(this.challengeToken, code).subscribe({
      next: () => {
        this.isVerifying = false;
        this.accessGranted = true;
        this.currentStep = 'complete';
        window.setTimeout(() => {
          void this.router.navigate(['/dashboard']);
        }, 500);
      },
      error: (err: HttpErrorResponse) => {
        this.isVerifying = false;
        this.otpError.set(this.describeVerifyError(err));
      }
    });
  }

  handleOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const digit = input.value.replace(/\D/g, '').slice(-1);

    this.otpDigits[index] = digit;
    input.value = digit;
    this.otpError.set('');

    if (digit && index < this.otpDigits.length - 1) {
      this.focusOtpInput(index + 1);
    }
  }

  handleOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      this.focusOtpInput(index - 1);
      return;
    }

    if (event.key.length === 1 && !/[0-9]/.test(event.key)) {
      event.preventDefault();
    }
  }

  handleOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();

    const pastedText = event.clipboardData?.getData('text') ?? '';
    const digits = pastedText.replace(/\D/g, '').slice(0, this.otpDigits.length);

    if (!digits) {
      return;
    }

    this.otpDigits = this.otpDigits.map((_, index) => digits[index] ?? '');
    this.otpTouched = true;
    this.focusOtpInput(Math.min(digits.length, this.otpDigits.length) - 1);
  }

  useDifferentAccount(): void {
    this.credentials = {
      username: '',
      password: '',
      rememberTerminal: false
    };
    this.showPassword = false;
    this.isAuthenticating = false;
    this.accessGranted = false;
    this.loginError.set('');
    this.challengeToken = null;
    this.currentStep = 'credentials';
    this.resetOtp();
  }

  trackByIndex(index: number): number {
    return index;
  }

  private describeLoginError(err: HttpErrorResponse): string {
    switch (err.status) {
      case 400:
        return 'Please enter your username and password.';
      case 401:
        return 'Invalid username or password.';
      case 423:
        return 'This account is locked. Please try again later.';
      case 500:
        return 'A server error occurred. Please try again shortly.';
      case 0:
        return 'Could not reach the server. Check your connection and try again.';
      default:
        return 'Unable to sign in right now. Please try again.';
    }
  }

  private describeVerifyError(err: HttpErrorResponse): string {
    switch (err.status) {
      case 400:
        return 'Invalid verification code. Please try again.';
      case 401:
        return 'Your session has expired. Please sign in again.';
      case 500:
        return 'A server error occurred. Please try again shortly.';
      case 0:
        return 'Could not reach the server. Check your connection and try again.';
      default:
        return 'Unable to verify the code right now. Please try again.';
    }
  }

  private resetOtp(): void {
    this.otpDigits = ['', '', '', '', '', ''];
    this.otpTouched = false;
    this.otpError.set('');
    this.isVerifying = false;
  }

  private focusFirstEmptyOtp(): void {
    const emptyIndex = this.otpDigits.findIndex((digit) => !digit);
    this.focusOtpInput(emptyIndex === -1 ? this.otpDigits.length - 1 : emptyIndex);
  }

  private focusOtpInput(index: number): void {
    window.setTimeout(() => {
      this.otpInputs.get(index)?.nativeElement.focus();
    });
  }
}
