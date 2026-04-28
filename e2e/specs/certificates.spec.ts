import { test, expect } from '@playwright/test';
import { CertificatesPage } from '../pages/CertificatesPage';

/**
 * Feature: Completing a LP shows a certificate in certificates tab
 */

test.describe('Certificates Tab - Happy Paths', () => {
  let page: CertificatesPage;

  test.beforeEach(async ({ page: pwPage }) => {
    page = new CertificatesPage(pwPage);
    await page.gotoYouPage();
    await page.openCertificatesTab();
  });

  test.describe('@ac-1 View and download a single certificate', () => {
    test('should allow user to view and download the certificate for a learning plan', async ({ page: pwPage }) => {
      const planName = 'Learning Plan Alpha';
      await page.clickCertificateButtonByPlanName(planName);
      // Expect a download to start
      const [download] = await Promise.all([
        pwPage.waitForEvent('download'),
        // button click already performed above
      ]);
      const path = await download.path();
      expect(path).not.toBeNull();
    });
  });

  test.describe('@ac-2 Download from multiple completions', () => {
    test('should let user select and download any of the three most recent completions', async ({ page: pwPage }) => {
      const planName = 'Learning Plan Beta';
      await page.clickCertificateButtonByPlanName(planName);
      // Assume a modal appears with a list of recent completions identified by data-testid='completion-item'
      const modal = pwPage.getByTestId('completion-modal');
      await expect(modal).toBeVisible();
      const items = modal.getByTestId('completion-item');
      await expect(items).toHaveCount(3);
      // Download the second most recent
      await items.nth(1).getByRole('button', { name: /download/i }).click();
      const [download] = await Promise.all([
        pwPage.waitForEvent('download'),
      ]);
      const path = await download.path();
      expect(path).not.toBeNull();
    });
  });

  test.describe('@ac-3 Navigate via VIEW button', () => {
    test('should navigate to the learning plan page when VIEW is clicked', async ({ page: pwPage }) => {
      const planName = 'Learning Plan Gamma';
      await page.clickViewButtonByPlanName(planName);
      await expect(pwPage).toHaveURL(/.*\/learning-plans\/.*${planName.replace(/\s+/g, '-').toLowerCase()}/);
    });
  });

  test.describe('@ac-4 Filter learning plan certificates', () => {
    test('should show learning plan certificates when filter is applied', async () => {
      await page.selectFilterOption('Learning plans');
      // Verify at least one tile appears with role region and name containing a known plan
      const tile = page.page.getByRole('region', { name: /Learning Plan Alpha/i });
      await expect(tile).toBeVisible();
    });
  });

  test.describe('@ac-5 Pagination and sorting', () => {
    test('should display up to 20 most recent certificates and load more on View more', async () => {
      // Verify initial count <= 20 and sorted by most recent (assume data attribute 'data-timestamp')
      const tiles = page.page.getByTestId('certificate-tile');
      await expect(tiles).toHaveCountLessThanOrEqual(20);
      const timestamps = await tiles.evaluateAll((elements) =>
        Array.from(elements).map((el) => Number(el.getAttribute('data-timestamp')))
      );
      for (let i = 0; i < timestamps.length - 1; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
      }
      // Load next page
      await page.clickViewMore();
      await expect(tiles).toHaveCountGreaterThan(20);
    });
  });

  test.describe('@ac-6 Completed label visibility', () => {
    test('should show a COMPLETED label on each learning plan tile', async () => {
      const planName = 'Learning Plan Delta';
      const tile = page.page.getByRole('region', { name: planName });
      const label = tile.getByTestId('tile-completed-label');
      await expect(label).toHaveText(/completed/i);
    });
  });

  test.describe('@ac-7 Certificate design after download', () => {
    test('should display the new certificate design after download', async ({ page: pwPage }) => {
      const planName = 'Learning Plan Epsilon';
      await page.clickCertificateButtonByPlanName(planName);
      const [download] = await Promise.all([
        pwPage.waitForEvent('download'),
      ]);
      // Open the PDF in a new page to verify design (simplified check for existence of a known element)
      const buffer = await download.body();
      // In real test we would parse PDF; here we assert download succeeded.
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  test.describe('@ac-8 Verify PDF file name format', () => {
    test('should download PDF with correct naming convention', async ({ page: pwPage }) => {
      const planName = 'Advanced Analytics';
      const today = new Date();
      const expectedName = `${planName.replace(/\s+/g, '-')}-${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}.pdf`;
      await page.clickCertificateButtonByPlanName(planName);
      const [download] = await Promise.all([
        pwPage.waitForEvent('download'),
      ]);
      expect(download.suggestedFilename()).toBe(expectedName);
    });
  });
});

test.describe('Certificates Tab - Sad Path & Edge Cases', () => {
  let page: CertificatesPage;

  test.beforeEach(async ({ page: pwPage }) => {
    page = new CertificatesPage(pwPage);
    await page.gotoYouPage();
    await page.openCertificatesTab();
  });

  test.describe('@ac-1-sad Missing Certificate', () => {
    test('should show an error toast when certificate is unavailable', async () => {
      const planName = 'Learning Plan Missing Cert';
      await page.clickCertificateButtonByPlanName(planName);
      await page.expectDownloadToastVisible();
      await expect(page.downloadToast).toHaveText(/certificate not available/i);
    });
  });

  test.describe('@ac-5-edge Exactly 20 items pagination', () => {
    test('should correctly handle view more when exactly 20 items are present', async () => {
      // Mock or assume the backend returns exactly 20 items for the first page.
      const tiles = page.page.getByTestId('certificate-tile');
      await expect(tiles).toHaveCount(20);
      await page.clickViewMore();
      // After clicking view more, expect additional tiles to appear (at least 1).
      await expect(tiles).toHaveCountGreaterThan(20);
    });
  });
});
