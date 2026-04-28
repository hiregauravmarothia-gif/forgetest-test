import { test, expect } from '@playwright/test';
import { CertificatesPage } from '../pages/CertificatesPage';

// Helper to format date for filename verification
function formatDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

test.describe('Certificates Tab - AC-1 @ac-1', () => {
  test('User can view and download a certificate for a completed learning plan', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.goToCertificatesTab();
    await certPage.clickCertificateButton('Learning Plan Alpha');
    const downloadPath = await certPage.downloadLatestCertificate('Learning Plan Alpha');
    expect(downloadPath).toBeTruthy();
    // Verify that a PDF is downloaded (simple extension check)
    expect(downloadPath).toMatch(/\.pdf$/i);
  });
});

test.describe('Certificates Tab - AC-2 @ac-2', () => {
  test('User can select and download any of the three most recent completions', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.goToCertificatesTab();
    await certPage.selectCertificateVersion('Learning Plan Beta', 'Completion 2');
    const downloadPath = await certPage.downloadLatestCertificate('Learning Plan Beta');
    expect(downloadPath).toBeTruthy();
    expect(downloadPath).toMatch(/\.pdf$/i);
  });
});

test.describe('Certificates Tab - AC-3 @ac-3', () => {
  test('VIEW button navigates to the learning plan page', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.goToCertificatesTab();
    await certPage.clickViewButton('Learning Plan Gamma');
    await expect(page).toHaveURL(/\/learning-plan\/gamma/i);
  });
});

test.describe('Certificates Tab - AC-4 @ac-4', () => {
  test('Filter by Learning plans shows only learning plan certificates', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.goToCertificatesTab();
    await certPage.applyFilter('Learning plans');
    const tiles = page.getByTestId('certificate-tile');
    await expect(tiles).toHaveCountGreaterThan(0);
    // Verify each tile contains the word "Learning Plan" in its title
    const count = await tiles.count();
    for (let i = 0; i < count; i++) {
      const title = await tiles.nth(i).getByTestId('tile-title').innerText();
      expect(title).toMatch(/learning plan/i);
    }
  });
});

test.describe('Certificates Tab - AC-5 @ac-5', () => {
  test('Displays up to 20 certificates, sorted most recent, and loads more on View more', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.goToCertificatesTab();
    const initialCount = await certPage.getVisibleTileCount();
    expect(initialCount).toBeLessThanOrEqual(20);
    // Verify sorting by checking dates on first two tiles (newest first)
    const firstDateText = await certPage.tileByPlanName('Learning Plan 1').getByTestId('completion-date').innerText();
    const secondDateText = await certPage.tileByPlanName('Learning Plan 2').getByTestId('completion-date').innerText();
    const firstDate = new Date(firstDateText);
    const secondDate = new Date(secondDateText);
    expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
    // Load more
    await certPage.clickViewMore();
    const afterCount = await certPage.getVisibleTileCount();
    expect(afterCount).toBeGreaterThan(initialCount);
    expect(afterCount).toBeLessThanOrEqual(40);
  });
});

test.describe('Certificates Tab - AC-6 @ac-6', () => {
  test('Each learning plan tile shows a COMPLETED label', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.goToCertificatesTab();
    await certPage.applyFilter('Learning plans');
    const tiles = page.getByTestId('certificate-tile');
    const count = await tiles.count();
    for (let i = 0; i < count; i++) {
      const label = await tiles.nth(i).getByTestId('completed-label').innerText();
      expect(label.trim().toUpperCase()).toBe('COMPLETED');
    }
  });
});

test.describe('Certificates Tab - AC-7 @ac-7', () => {
  test('Downloaded certificate matches new design (visual regression placeholder)', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.goToCertificatesTab();
    const downloadPath = await certPage.downloadLatestCertificate('Learning Plan Delta');
    expect(downloadPath).toBeTruthy();
    // Placeholder for visual check – in real suite compare PDF rendering to baseline
    // For now assert file size > 0
    const fs = require('fs');
    const stats = fs.statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(0);
  });
});

test.describe('Certificates Tab - AC-8 @ac-8', () => {
  test('Certificate filename follows [COURSE_NAME]-[dd-mm-YYYY].pdf pattern', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.goToCertificatesTab();
    const planName = 'Learning Plan Epsilon';
    const downloadPath = await certPage.downloadLatestCertificate(planName);
    const fileName = downloadPath.split(/[\\/]/).pop();
    const expectedDate = formatDate(new Date());
    const regex = new RegExp(`^${planName.replace(/\s+/g, '\\s')}-${expectedDate}\\.pdf$`, 'i');
    expect(fileName).toMatch(regex);
  });
});

// Sad path: attempting to download when no certificate is available
test.describe('Certificates Tab - Sad Path @sad-1', () => {
  test('Shows error message when certificate button is clicked for a plan without certificates', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.goToCertificatesTab();
    const tile = certPage.tileByPlanName('Learning Plan NoCert');
    const button = tile.getByTestId('certificate-button');
    await button.click();
    const errorToast = page.getByRole('alert').filter({ hasText: /no certificate available/i });
    await expect(errorToast).toBeVisible();
  });
});

// Edge case: exactly three completions available
test.describe('Certificates Tab - Edge Case @edge-1', () => {
  test('User can download each of the three most recent completions when only three exist', async ({ page }) => {
    const certPage = new CertificatesPage(page);
    await certPage.goToCertificatesTab();
    const planName = 'Learning Plan Triple';
    const versions = ['Completion 1', 'Completion 2', 'Completion 3'];
    for (const version of versions) {
      await certPage.selectCertificateVersion(planName, version);
      const downloadPath = await certPage.downloadLatestCertificate(planName);
      expect(downloadPath).toBeTruthy();
      expect(downloadPath).toMatch(/\.pdf$/i);
    }
  });
});
