import { ChangeDetectorRef, Component, ElementRef, OnInit, QueryList, ViewChildren, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../auth.service';

type SetupPhase = 'loading' | 'ready' | 'already-enabled' | 'load-error' | 'success';

// First-time 2FA enrollment page (/2fa-setup). Reachable by any signed-in
// user; not part of PageAccessService's role matrix because enabling 2FA is
// a personal account action, not a role-gated business page. The pending
// TOTP secret returned by /2fa/setup is held only in component fields for
// the lifetime of this page — never written to storage or logged.
@Component({
  selector: 'app-two-factor-setup',
  standalone: false,
  templateUrl: './two-factor-setup.html',
  styleUrl: './two-factor-setup.css',
})
export class TwoFactorSetup implements OnInit {
  @ViewChildren('otpInput') private otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  phase: SetupPhase = 'loading';

  secret = '';
  qrCodeDataUrl = '';

  otpDigits = ['', '', '', '', '', ''];
  otpTouched = false;
  isVerifying = false;

  loadError = signal('');
  otpError = signal('');

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchSetup();
  }

  get isOtpComplete(): boolean {
    return this.otpDigits.every((digit) => digit.length === 1);
  }

  get submitLabel(): string {
    return this.isVerifying ? 'Verifying' : 'Complete Setup';
  }

  fetchSetup(): void {
    this.phase = 'loading';
    this.loadError.set('');

    this.authService.setupTwoFactor().subscribe({
      next: (response) => {
        this.secret = response.secret;
        this.qrCodeDataUrl = response.qrCodeDataUrl;
        this.phase = 'ready';
        this.changeDetectorRef.markForCheck();
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 409) {
          this.phase = 'already-enabled';
          this.changeDetectorRef.markForCheck();
          return;
        }

        this.phase = 'load-error';
        this.loadError.set(this.describeSetupError(err));
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  submitEnable(): void {
    this.otpTouched = true;
    this.otpError.set('');

    if (!this.isOtpComplete || this.isVerifying) {
      this.focusFirstEmptyOtp();
      return;
    }

    this.isVerifying = true;
    const code = this.otpDigits.join('');

    this.authService.enableTwoFactor(code).subscribe({
      next: () => {
        this.isVerifying = false;
        this.phase = 'success';
        this.changeDetectorRef.markForCheck();
        window.setTimeout(() => {
          void this.router.navigate(['/dashboard']);
        }, 800);
      },
      error: (err: HttpErrorResponse) => {
        this.isVerifying = false;
        this.otpError.set(this.describeEnableError(err));
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  goToDashboard(): void {
    void this.router.navigate(['/dashboard']);
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

  trackByIndex(index: number): number {
    return index;
  }

  private describeSetupError(err: HttpErrorResponse): string {
    switch (err.status) {
      case 401:
      case 403:
        return 'Your session is no longer valid. Please sign in again.';
      case 500:
        return 'A server error occurred while starting setup. Please try again.';
      case 0:
        return 'Could not reach the server. Check your connection and try again.';
      default:
        return 'Unable to start two-factor setup right now. Please try again.';
    }
  }

  private describeEnableError(err: HttpErrorResponse): string {
    switch (err.status) {
      case 400:
        return 'Invalid verification code. Please try again.';
      case 401:
      case 403:
        return 'Your session is no longer valid. Please sign in again.';
      case 409:
        return 'Setup could not be completed. Please restart the setup process.';
      case 500:
        return 'A server error occurred. Please try again shortly.';
      case 0:
        return 'Could not reach the server. Check your connection and try again.';
      default:
        return 'Unable to verify the code right now. Please try again.';
    }
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
