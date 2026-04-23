import { test, expect } from '@playwright/test';
import { YouPage } from '../pages/YouPage';

// @ac-1
test.describe('View completion certificates', () => {
  let youPage: YouPage;

  test.beforeEach(async ({ page }) => {
    // Assume a helper that logs in and sets up the required state via API
    await page.addInitScript(() => {
      // Placeholder for authentication token injection
    });
    youPage = new YouPage(page);
    await youPage.goto();
    await youPage.selectCertificatesTab();
  });

  test('Certificate appears after completing a learning plan (HAPPY)', async ({ }) => {
    // Preconditions are set via API in beforeEach (user has completed plan and certificate generated)
    const expectedTitle = 'Learning Plan – Advanced Topics';
    const expectedDate = '2023-12-01'; // example date format
    await youPage.expectCertificatePresent(expectedTitle, expectedDate);
  });

  test('No certificates message when user has none', async ({ }) => {
    // Preconditions: user has no completed plans (set via API before test)
    await youPage.expectNoCertificatesMessage();
  });
});
