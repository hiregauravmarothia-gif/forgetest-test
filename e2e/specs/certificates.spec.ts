import { test, expect } from '@playwright/test';
import { CertificatesPage } from '../pages/CertificatesPage';

/**
 * Helper to set user role via API or fixture – implementation depends on test environment.
 */
async function setUserRole(page, role: string) {
  // Placeholder – assume a request can set role for the session
  await page.addInitScript(`window.__USER_ROLE__ = '${role}';`);
}

test.describe('Certificates Tab - AC-1', () => {
  test('AC-1: User can view and download a certificate for a single completion', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.goToYouPage();
    await certPage.openCertificatesTab();
    await certPage.clickCertificateButton('Learning Plan A');
    // Expect a download to start
    const fileName = await certPage.getDownloadedFileName();
    await expect(fileName).toMatch(/Learning Plan A-\d{2}-\d{2}-\d{4}\.pdf/);
  });
});

test.describe('Certificates Tab - AC-2', () => {
  test('AC-2: User can select and download any of the three most recent completions', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.goToYouPage();
    await certPage.openCertificatesTab();
    await certPage.clickCertificateButton('Learning Plan B');
    // Modal appears with up to three options
    await certPage.selectCompletionDate('01-09-2023');
    await certPage.downloadFromModal();
    const file1 = await certPage.getDownloadedFileName();
    await expect(file1).toContain('01-09-2023');

    // Repeat for another date
    await certPage.clickCertificateButton('Learning Plan B');
    await certPage.selectCompletionDate('15-08-2023');
    await certPage.downloadFromModal();
    const file2 = await certPage.getDownloadedFileName();
    await expect(file2).toContain('15-08-2023');
  });
});

test.describe('Certificates Tab - AC-3', () => {
  test('AC-3: VIEW button navigates to the learning plan page', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.goToYouPage();
    await certPage.openCertificatesTab();
    await certPage.clickViewButton('Learning Plan C');
    await expect(page).toHaveURL(/\/learning-plan\/.*C/);
  });
});

test.describe('Certificates Tab - AC-4', () => {
  test('AC-4: Filter by object type and search shows learning plan certificates', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.goToYouPage();
    await certPage.openCertificatesTab();
    await certPage.selectObjectType('Learning plans');
    await certPage.applySearchFilter('Plan D');
    const tile = certPage.planTile('Learning Plan D');
    await expect(tile).toBeVisible();
  });
});

test.describe('Certificates Tab - AC-5', () => {
  test('AC-5: Pagination shows up to 20 items and loads more on View more', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.goToYouPage();
    await certPage.openCertificatesTab();
    const tiles = page.getByTestId('certificate-plan-tile');
    await expect(tiles).toHaveCount(20);
    await certPage.clickViewMore();
    await expect(tiles).toHaveCountGreaterThan(20);
  });
});

test.describe('Certificates Tab - AC-6', () => {
  test('AC-6: Completed label appears on each tile', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.goToYouPage();
    await certPage.openCertificatesTab();
    const completedLabel = page.getByText('COMPLETED', { exact: true });
    await expect(completedLabel).toBeVisible();
  });
});

test.describe('Certificates Tab - AC-7', () => {
  test('AC-7: Downloaded certificate matches new design (visual regression placeholder)', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.goToYouPage();
    await certPage.openCertificatesTab();
    await certPage.clickCertificateButton('Learning Plan E');
    const download = await page.waitForEvent('download');
    const path = await download.path();
    // Placeholder for visual diff – in real suite compare PDF rendering
    await expect(path).toBeTruthy();
  });
});

test.describe('Certificates Tab - AC-8', () => {
  test('AC-8: File name follows [COURSE_NAME]-[dd-mm-YYYY].pdf format', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.goToYouPage();
    await certPage.openCertificatesTab();
    await certPage.clickCertificateButton('Learning Plan F');
    const fileName = await certPage.getDownloadedFileName();
    await expect(fileName).toMatch(/^Learning Plan F-\d{2}-\d{2}-\d{4}\.pdf$/);
  });
});

test.describe('Certificates Tab - AC-9', () => {
  test('AC-9: No certificates available shows appropriate message', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.goToYouPage();
    await certPage.openCertificatesTab();
    const message = await certPage.getEmptyStateMessage();
    await expect(message).toContain('No certificates available');
    const downloadButtons = page.getByRole('button', { name: /certificate/i });
    await expect(downloadButtons).toHaveCount(0);
  });
});

test.describe('Certificates Tab - AC-10', () => {
  test('AC-10: Unauthorized user sees permission error', async ({ page }) => {
    await setUserRole(page, 'guest');
    const certPage = new CertificatesPage(page);
    await certPage.goToYouPage();
    await certPage.openCertificatesTab();
    const error = await certPage.getAuthErrorMessage();
    await expect(error).toContain('You do not have permission to view certificates');
  });
});

test.describe('Certificates Tab - AC-11', () => {
  test('AC-11: Modal requires selection before download and shows error if none selected', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.goToYouPage();
    await certPage.openCertificatesTab();
    await certPage.clickCertificateButton('Learning Plan G');
    // Attempt to download without selecting a date
    await certPage.downloadFromModal();
    const errorMsg = await certPage.getModalErrorMessage();
    await expect(errorMsg).toContain('Please select a completion to download');
    // Verify dates are displayed in correct format
    const options = certPage.completionsModal.getByRole('option');
    const count = await options.count();
    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent();
      await expect(text).toMatch(/\d{2}-\d{2}-\d{4}/);
    }
  });
});
