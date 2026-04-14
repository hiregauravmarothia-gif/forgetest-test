import { expect, Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly validationMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByRole('textbox', { name: /username/i });
    this.passwordInput = page.getByRole('textbox', { name: /password/i });
    this.loginButton = page.getByTestId('login-btn');
    this.validationMessage = page.locator('[data-testid="login-validation"]').filter({ hasText: /required/i });
  }

  async goto() {
    await this.page.goto('/login');
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async submitEmptyForm() {
    await this.loginButton.click();
  }

  async assertLoginButtonDisabled() {
    await expect(this.loginButton).toBeDisabled();
  }

  async assertValidationMessage(expected: string) {
    await expect(this.validationMessage).toHaveText(expected);
  }
}
