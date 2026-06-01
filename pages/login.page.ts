import type { Page } from '@playwright/test';

export class LoginPage {
  readonly emailInput;
  readonly passwordInput;
  readonly signInButton;
  readonly invalidCredentialsMessage;

  constructor(private readonly page: Page) {
    this.emailInput = page.getByRole('textbox', { name: 'Email' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
    this.invalidCredentialsMessage = page.getByText(/Invalid email or password/i);
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async signInWithCredentials(email: string, password: string): Promise<void> {
    await this.goto();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}
