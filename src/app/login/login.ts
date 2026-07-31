import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

type LoginField = 'associateId' | 'password';
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
  readonly maskedDevice = '•••• 88';

  credentials = {
    associateId: '',
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
  resendMessage = '';

  constructor(private readonly router: Router) {}

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
    if (form.invalid) {
      form.control.markAllAsTouched();
    }

    this.goToVerification();
  }

  goToVerification(): void {
    this.isAuthenticating = false;
    this.accessGranted = false;
    this.currentStep = 'verification';
    this.focusOtpInput(0);
  }

  verifyOtp(): void {
    this.otpTouched = true;

    if (!this.isOtpComplete || this.isVerifying || this.accessGranted) {
      this.focusFirstEmptyOtp();
      return;
    }

    this.isVerifying = true;

    window.setTimeout(() => {
      this.isVerifying = false;
      this.accessGranted = true;
      this.currentStep = 'complete';
      window.setTimeout(() => {
        void this.router.navigate(['/dashboard']);
      }, 500);
    }, 1200);
  }

  handleOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const digit = input.value.replace(/\D/g, '').slice(-1);

    this.otpDigits[index] = digit;
    input.value = digit;
    this.resendMessage = '';

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

  resendCode(): void {
    if (this.isVerifying) {
      return;
    }

    this.resetOtp();
    this.resendMessage = `A fresh code was sent to ${this.maskedDevice}.`;
    this.focusOtpInput(0);
  }

  useDifferentAccount(): void {
    this.credentials = {
      associateId: '',
      password: '',
      rememberTerminal: false
    };
    this.showPassword = false;
    this.isAuthenticating = false;
    this.accessGranted = false;
    this.currentStep = 'credentials';
    this.resetOtp();
  }

  trackByIndex(index: number): number {
    return index;
  }

  private resetOtp(): void {
    this.otpDigits = ['', '', '', '', '', ''];
    this.otpTouched = false;
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

