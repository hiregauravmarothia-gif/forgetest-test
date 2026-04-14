import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('User Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('@ac-1 Successful login with valid credentials', async ({ page }) => {
    await loginPage.login('john.doe@example.com', 'P@ssw0rd123');
    // Wait for navigation to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    // Assert user name appears in header (role="heading" with the user name)
    const userHeader = page.getByRole('heading', { name: /john\.doe/i });
    await expect(userHeader).toBeVisible();
    // Assert HttpOnly cookie exists (cannot be accessed via JS, but we can check presence)
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === 'session-token');
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.httpOnly).toBeTruthy();
  });

  test('@ac-2 Login button disabled with empty fields and validation message', async () => {
    // No input, directly click login
    await loginPage.submitEmptyForm();
    await loginPage.assertLoginButtonDisabled();
    await loginPage.assertValidationMessage('Username and password are required');
  });
});
