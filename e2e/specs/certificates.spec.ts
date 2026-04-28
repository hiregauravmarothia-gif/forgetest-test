import { test, expect } from '@playwright/test';
import { CertificatesPage } from '../pages/CertificatesPage';
import path from 'path';
import fs from 'fs';

/**
 * Helper to check downloaded file name pattern
 */
function isValidFileName(fileName: string, planName: string): boolean {
  const regex = new RegExp(`^${planName.replace(/\s+/g, '\\s')}-\\d{2}-\\d{2}-\\d{4}\\.pdf$`);
  return regex.test(fileName);
}

test.describe('Certificates Tab - Acceptance Criteria', () => {
  let certificatesPage: CertificatesPage;

  test.beforeEach(async ({ page }) => {
    certificatesPage = new CertificatesPage(page);
    await certificatesPage.goToYouPage();
    await certificatesPage.openCertificatesTab();
  });

  // @ac-1
  test.describe('@ac-1 Happy path - view and download single certificate', () => {
    test('User can view and download certificate for a learning plan', async ({ page }) => {
      const planName = 'Intro to Project Management';
      await certificatesPage.clickCertificateButton(planName);
      // Assuming a PDF preview opens in a new tab
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        // The click already triggered download
      ]);
      const path = await download.path();
      expect(path).not.toBeNull();
      const fileName = path ? path.split(path.sep).pop() : '';
      expect(isValidFileName(fileName || '', planName)).toBeTruthy();
    });
  });

  // @ac-2
  test.describe('@ac-2 Happy path - multiple recent certificates', () => {
    test('User can select and download any of the three most recent certificates', async ({ page }) => {
      const planName = 'Advanced Data Analytics';
      await certificatesPage.clickCertificateButton(planName);
      // Select each of the three recent versions (index 0,1,2)
      for (let i = 0; i < 3; i++) {
        await certificatesPage.selectCertificateVersion(i);
        const [download] = await Promise.all([
          page.waitForEvent('download'),
        ]);
        const filePath = await download.path();
        expect(filePath).not.toBeNull();
        const fileName = filePath ? filePath.split(path.sep).pop() : '';
        expect(isValidFileName(fileName || '', planName)).toBeTruthy();
      }
    });
  });

  // @ac-3
  test.describe('@ac-3 Happy path - navigate via VIEW button', () => {
    test('Clicking VIEW navigates to the learning plan page', async ({ page }) => {
      const planName = 'Leadership Essentials';
      await certificatesPage.clickViewButton(planName);
      await expect(page).toHaveURL(new RegExp(`/learning-plans/.*${encodeURIComponent(planName)}`));
    });
  });

  // @ac-4
  test.describe('@ac-4 Happy path - filter results', () => {
    test('Filtering shows only learning plan certificates', async () => {
      await certificatesPage.applyFilter('Learning plans');
      // Verify at least one tile is visible and contains the word "certificate"
      const tiles = certificatesPage.page.getByTestId('certificate-tile');
      await expect(tiles.first()).toBeVisible();
      await expect(tiles.first()).toContainText('certificate', { ignoreCase: true });
    });
  });

  // @ac-5
  test.describe('@ac-5 Happy path - pagination and sorting', () => {
    test('Shows up to 20 most recent certificates and loads more on View more', async () => {
      const tiles = certificatesPage.page.getByTestId('certificate-tile');
      await expect(tiles).toHaveCountLessThanOrEqual(20);
      // Verify sorting: first tile date is newer than second (assuming data-testid='completion-date')
      const firstDate = await tiles.nth(0).getByTestId('completion-date').textContent();
      const secondDate = await tiles.nth(1).getByTestId('completion-date').textContent();
      // Simple lexical compare assuming ISO format
      expect(firstDate && secondDate && firstDate >= secondDate).toBeTruthy();

      // Load next page
      await certificatesPage.clickViewMore();
      await expect(tiles).toHaveCountGreaterThan(20);
    });
  });

  // @ac-6
  test.describe('@ac-6 Happy path - completed label', () => {
    test('Each learning plan tile shows a COMPLETED label', async () => {
      const planName = 'Agile Fundamentals';
      await certificatesPage.verifyCompletedLabel(planName);
      const label = certificatesPage.completedLabel(planName);
      await expect(label).toHaveText(/completed/i);
    });
  });

  // @ac-7
  test.describe('@ac-7 Happy path - certificate design after download', () => {
    test('Downloaded certificate matches new design (visual regression placeholder)', async ({ page }) => {
      const planName = 'Design Thinking';
      await certificatesPage.clickCertificateButton(planName);
      const [download] = await Promise.all([page.waitForEvent('download')]);
      const filePath = await download.path();
      expect(filePath).not.toBeNull();
      // Placeholder for visual diff – in real suite compare PDF rendering
      // For now just assert file exists
      expect(fs.existsSync(filePath!)).toBeTruthy();
    });
  });

  // @ac-8
  test.describe('@ac-8 Happy path - file naming convention', () => {
    test('Certificate PDF file name follows [COURSE_NAME]-[dd-mm-YYYY].pdf', async ({ page }) => {
      const planName = 'Customer Success Basics';
      await certificatesPage.clickCertificateButton(planName);
      const [download] = await Promise.all([page.waitForEvent('download')]);
      const filePath = await download.path();
      const fileName = filePath ? filePath.split(path.sep).pop() : '';
      expect(isValidFileName(fileName || '', planName)).toBeTruthy();
    });
  });

  // @ac-9
  test.describe('@ac-9 Sad path - no certificates available', () => {
    test('Displays clear error message when no certificates exist', async () => {
      // Assume user with no certificates; navigate directly
      const message = await certificatesPage.getErrorMessageText();
      await expect(message).toContain('No certificates available');
      const tiles = certificatesPage.page.getByTestId('certificate-tile');
      await expect(tiles).toHaveCount(0);
    });
  });

  // @ac-10
  test.describe('@ac-10 Sad path - download failure', () => {
    test('Shows error notification on download failure', async ({ page }) => {
      // Intercept network to force failure
      await page.route('**/download-certificate**', route => route.abort('failed'));
      const planName = 'Risk Management';
      await certificatesPage.clickCertificateButton(planName);
      // Wait for notification
      const notif = await certificatesPage.getNotificationText();
      await expect(notif).toContain('Certificate download failed. Please try again.');
    });
  });

  // @ac-11
  test.describe('@ac-11 Security - unauthorized access', () => {
    test('Permission error shown and action blocked for unauthorized user', async ({ page }) => {
      // Simulate unauthorized user by setting a cookie or header – placeholder
      await page.addInitScript(() => {
        // @ts-ignore
        window.__mockUserPermissions = { canViewCertificates: false };
      });
      await certificatesPage.openCertificatesTab();
      const planName = 'Compliance Training';
      // Attempt to view
      await certificatesPage.clickViewButton(planName);
      const error = await certificatesPage.getErrorMessageText();
      await expect(error).toContain('You do not have permission to view this certificate');
      // Attempt to download
      await certificatesPage.clickCertificateButton(planName);
      const notif = await certificatesPage.getNotificationText();
      await expect(notif).toContain('You do not have permission to view this certificate');
    });
  });
});
