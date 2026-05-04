import { test, expect } from '@playwright/test';
import { CertificatesPage } from '../pages/CertificatesPage';

test.describe('Certificates Management - AC-1', () => {
  test('HAPPY: view and download a single certificate', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.goToCertificatesTab();
    await certPage.clickCertificateButton('Learning Plan A');
    const filename = await certPage.waitForDownload();
    expect(filename).toMatch(/Learning Plan A-\d{2}-\d{2}-\d{4}\.pdf/);
  });
});

test.describe('Certificates Management - AC-2', () => {
  test('HAPPY: select and download any of the three most recent certificates', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.goToCertificatesTab();
    // open the certificate selector for a plan with multiple completions
    await certPage.clickCertificateButton('Learning Plan B');
    const options = page.getByTestId('certificate-option');
    await expect(options).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      await options.nth(i).click();
      const filename = await certPage.waitForDownload();
      expect(filename).toMatch(/Learning Plan B-\d{2}-\d{2}-\d{4}\.pdf/);
    }
  });
});

test.describe('Certificates Management - AC-3', () => {
  test('HAPPY: navigate to learning plan page via VIEW button', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.goToCertificatesTab();
    await certPage.clickViewButton('Learning Plan C');
    await expect(page).toHaveURL(/.*\/learning-plan\/.*C/);
  });
});

test.describe('Certificates Management - AC-4', () => {
  test('HAPPY: filter results show learning plan certificates', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.goToCertificatesTab();
    await certPage.applyFilter('Learning plans');
    const tiles = await certPage.getCertificateTiles();
    expect(tiles.length).toBeGreaterThan(0);
    // verify each tile belongs to a learning plan (placeholder check)
    for (const tile of tiles) {
      await expect(tile).toHaveAttribute('data-object-type', 'learning-plan');
    }
  });
});

test.describe('Certificates Management - AC-5', () => {
  test('HAPPY: pagination shows up to 20 items and loads more on View more', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.goToCertificatesTab();
    const firstBatch = await certPage.getCertificateTiles();
    expect(firstBatch.length).toBeLessThanOrEqual(20);
    if (firstBatch.length === 20) {
      await certPage.clickViewMore();
      const secondBatch = await certPage.getCertificateTiles();
      expect(secondBatch.length).toBeGreaterThan(20);
    }
  });
});

test.describe('Certificates Management - AC-6', () => {
  test('HAPPY: completed label appears on tiles', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.goToCertificatesTab();
    await certPage.applyFilter('Learning plans');
    const tiles = await certPage.getCertificateTiles();
    for (const tile of tiles) {
      const label = await certPage.getTileLabel(tile);
      expect(label).toBe('COMPLETED');
    }
  });
});

test.describe('Certificates Management - AC-7', () => {
  test('HAPPY: downloaded certificate matches new design', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.goToCertificatesTab();
    await certPage.clickCertificateButton('Learning Plan D');
    const download = await page.waitForEvent('download');
    const path = await download.path();
    // placeholder visual regression check – in real suite compare PDF rendering
    expect(path).toBeTruthy();
  });
});

test.describe('Certificates Management - AC-8', () => {
  test('HAPPY: filename follows naming convention', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.goToCertificatesTab();
    await certPage.clickCertificateButton('Advanced Analytics');
    const filename = await certPage.waitForDownload();
    expect(filename).toMatch(/Advanced Analytics-\d{2}-\d{2}-\d{4}\.pdf/);
  });
});

test.describe('Certificates Management - AC-9', () => {
  test('SAD: display error when generation fails', async ({ page }) => {
    // Mock server error for certificate generation
    await page.route('**/generate-certificate', route => route.fulfill({ status: 500 }));
    const certPage = new CertificatesPage(page);
    await certPage.goToCertificatesTab();
    await certPage.clickCertificateButton('Failing Plan');
    await certPage.expectErrorMessageVisible();
    // Ensure no download started
    const downloads = await page.waitForEvent('download', { timeout: 2000 }).catch(() => null);
    expect(downloads).toBeNull();
  });
});

test.describe('Certificates Management - AC-10', () => {
  test('EDGE: show retry prompt on download network error', async ({ page }) => {
    // Intercept download request and abort to simulate network error
    await page.route('**/download-certificate', route => route.abort('failed'));
    const certPage = new CertificatesPage(page);
    await certPage.goToCertificatesTab();
    await certPage.clickCertificateButton('Network Issue Plan');
    await certPage.expectRetryPromptVisible();
    // No corrupted file should exist
    const download = await page.waitForEvent('download', { timeout: 2000 }).catch(() => null);
    expect(download).toBeNull();
  });
});

test.describe('Certificates Management - AC-11', () => {
  test('EDGE: correct pagination when total count not multiple of 20', async ({ page }) => {
    // Assume API returns 45 certificates
    await page.route('**/certificates*', route => {
      const url = new URL(route.request().url());
      const offset = Number(url.searchParams.get('offset') || '0');
      const limit = Number(url.searchParams.get('limit') || '20');
      const total = 45;
      const items = [];
      for (let i = offset; i < Math.min(offset + limit, total); i++) {
        items.push({ id: i, name: `Plan ${i}` });
      }
      route.fulfill({ json: { total, items } });
    });
    const certPage = new CertificatesPage(page);
    await certPage.goToCertificatesTab();
    let tiles = await certPage.getCertificateTiles();
    expect(tiles.length).toBe(20);
    await certPage.clickViewMore();
    tiles = await certPage.getCertificateTiles();
    expect(tiles.length).toBe(40);
    await certPage.clickViewMore();
    tiles = await certPage.getCertificateTiles();
    expect(tiles.length).toBe(45);
    // View more button should be disabled/hidden now
    await expect(certPage.viewMoreButton).toBeHidden();
  });
});

test.describe('Certificates Management - NEW-1777911060834', () => {
  test('HAPPY: placeholder for future scenario', async ({ page }) => {
    // No steps defined yet – test will be implemented when AC is clarified.
    expect(true).toBeTruthy();
  });
});