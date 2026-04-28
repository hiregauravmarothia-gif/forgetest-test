import { test, expect } from '@playwright/test';
import { CertificatesPage } from '../pages/CertificatesPage';

/**
 * Helper to mock backend responses for certificate download.
 */
async function mockCertificateDownload(page, success = true, fileName = 'Course-01-01-2024.pdf') {
  await page.route('**/download-certificate**', route => {
    if (success) {
      route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${fileName}"` },
        body: Buffer.from('%PDF-1.4...'),
      });
    } else {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    }
  });
}

test.describe('Certificates Tab - AC-1', () => {
  test('AC-1: User can view and download a certificate from a learning plan completion', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.navigateToYouPage();
    await certPage.openCertificatesTab();
    // Assume at least one tile exists and has id attribute
    const tileIds = await certPage.getTileIds();
    expect(tileIds.length).toBeGreaterThan(0);
    const firstTile = tileIds[0];
    await mockCertificateDownload(page, true, 'MyLearningPlan-01-01-2024.pdf');
    await certPage.clickCertificateButton(firstTile);
    // Verify download started (Playwright auto-handles downloads)
    const [ download ] = await Promise.all([
      page.waitForEvent('download'),
      // click already performed above
    ]);
    const path = await download.path();
    expect(path).toBeTruthy();
    const suggestedName = await download.suggestedFilename();
    expect(suggestedName).toMatch(/MyLearningPlan-\d{2}-\d{2}-\d{4}\.pdf/);
  });
});

test.describe('Certificates Tab - AC-2', () => {
  test('AC-2: User can select and download any of the three most recent completions', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.navigateToYouPage();
    await certPage.openCertificatesTab();
    const tileIds = await certPage.getTileIds();
    expect(tileIds.length).toBeGreaterThan(0);
    const targetTile = tileIds[0];
    // Mock a UI that shows a dropdown of recent completions – we will simulate three separate download calls
    for (let i = 1; i <= 3; i++) {
      const fileName = `LearningPlan-${i}-01-01-2024.pdf`;
      await mockCertificateDownload(page, true, fileName);
      await certPage.clickCertificateButton(targetTile);
      const [download] = await Promise.all([page.waitForEvent('download')]);
      const suggested = await download.suggestedFilename();
      expect(suggested).toBe(fileName);
    }
  });
});

test.describe('Certificates Tab - AC-3', () => {
  test('AC-3: VIEW button navigates to the learning plan page', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.navigateToYouPage();
    await certPage.openCertificatesTab();
    const tileIds = await certPage.getTileIds();
    const firstTile = tileIds[0];
    await certPage.clickViewButton(firstTile);
    await expect(page).toHaveURL(/\/learning-plan\//);
  });
});

test.describe('Certificates Tab - AC-4', () => {
  test('AC-4: Filter by Learning plans shows correct certificates', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.navigateToYouPage();
    await certPage.openCertificatesTab();
    await certPage.selectObjectTypeLearningPlans();
    await certPage.applySearchFilter('Leadership');
    // Verify at least one tile appears after filter
    await expect(certPage.certificateTiles.first()).toBeVisible();
  });
});

test.describe('Certificates Tab - AC-5', () => {
  test('AC-5: Pagination shows up to 20 items and loads more on View more', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.navigateToYouPage();
    await certPage.openCertificatesTab();
    // Assume backend returns >20 items; we verify count before and after clicking View more
    const initialCount = await certPage.certificateTiles.count();
    expect(initialCount).toBeLessThanOrEqual(20);
    if (initialCount === 20) {
      await certPage.clickViewMore();
      const afterCount = await certPage.certificateTiles.count();
      expect(afterCount).toBeGreaterThan(initialCount);
    }
  });
});

test.describe('Certificates Tab - AC-6', () => {
  test('AC-6: Completed label is displayed on each learning plan tile', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.navigateToYouPage();
    await certPage.openCertificatesTab();
    await certPage.selectObjectTypeLearningPlans();
    const tileIds = await certPage.getTileIds();
    for (const id of tileIds) {
      await expect(certPage.completedLabel(id)).toHaveText(/completed/i);
    }
  });
});

test.describe('Certificates Tab - AC-7', () => {
  test('AC-7: Downloaded certificate matches new design (visual regression placeholder)', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.navigateToYouPage();
    await certPage.openCertificatesTab();
    const tileIds = await certPage.getTileIds();
    const firstTile = tileIds[0];
    await mockCertificateDownload(page, true, 'DesignCheck-01-01-2024.pdf');
    await certPage.clickCertificateButton(firstTile);
    const [download] = await Promise.all([page.waitForEvent('download')]);
    const path = await download.path();
    // Placeholder for visual diff – in real suite we would compare PDF rendering.
    expect(path).toBeTruthy();
  });
});

test.describe('Certificates Tab - AC-8', () => {
  test('AC-8: Downloaded file name follows [COURSE_NAME]-[dd-mm-YYYY].pdf format', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.navigateToYouPage();
    await certPage.openCertificatesTab();
    const tileIds = await certPage.getTileIds();
    const firstTile = tileIds[0];
    const expectedName = 'Leadership101-15-09-2023.pdf';
    await mockCertificateDownload(page, true, expectedName);
    await certPage.clickCertificateButton(firstTile);
    const [download] = await Promise.all([page.waitForEvent('download')]);
    const suggested = await download.suggestedFilename();
    expect(suggested).toBe(expectedName);
    expect(suggested).toMatch(/^.+-\d{2}-\d{2}-\d{4}\.pdf$/);
  });
});

test.describe('Certificates Tab - AC-9', () => {
  test('AC-9: Shows error message when backend returns 500 on download', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.navigateToYouPage();
    await certPage.openCertificatesTab();
    const tileIds = await certPage.getTileIds();
    const firstTile = tileIds[0];
    await mockCertificateDownload(page, false);
    await certPage.clickCertificateButton(firstTile);
    await certPage.expectErrorMessageVisible();
    // Ensure no download event occurs
    const downloadPromise = page.waitForEvent('download', { timeout: 3000 }).catch(() => null);
    const result = await downloadPromise;
    expect(result).toBeNull();
  });
});

test.describe('Certificates Tab - AC-10', () => {
  test('AC-10: Empty state when no certificates are available', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    // Mock empty response for certificates list
    await page.route('**/certificates**', route => route.fulfill({ json: [] }));
    await certPage.navigateToYouPage();
    await certPage.openCertificatesTab();
    await certPage.expectEmptyStateVisible();
    await expect(certPage.certificateTiles).toHaveCount(0);
  });
});

test.describe('Certificates Tab - AC-11', () => {
  test('AC-11: Pagination loads remaining items when total is not a multiple of 20', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    // Mock 45 certificates (2 full pages + 5 remaining)
    const mockCertificates = Array.from({ length: 45 }, (_, i) => ({ id: `tile-${i + 1}`, title: `Plan ${i + 1}` }));
    await page.route('**/certificates**', route => {
      const url = new URL(route.request().url());
      const offset = Number(url.searchParams.get('offset') || '0');
      const limit = Number(url.searchParams.get('limit') || '20');
      const slice = mockCertificates.slice(offset, offset + limit);
      route.fulfill({ json: slice });
    });
    await certPage.navigateToYouPage();
    await certPage.openCertificatesTab();
    const firstPageCount = await certPage.certificateTiles.count();
    expect(firstPageCount).toBe(20);
    await certPage.clickViewMore();
    const secondPageCount = await certPage.certificateTiles.count();
    expect(secondPageCount).toBe(40);
    await certPage.clickViewMore();
    const finalCount = await certPage.certificateTiles.count();
    expect(finalCount).toBe(45);
  });
});
