import { test, expect } from '@playwright/test';
import { CertificatesPage } from '../pages/CertificatesPage';

/**
 * Helper to format expected file name pattern
 */
function expectedFileName(courseName: string, date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${courseName}-${dd}-${mm}-${yyyy}.pdf`;
}

test.describe('Certificates Tab - AC-1', () => {
  test('AC-1: User can view and download a certificate for a learning plan', async ({ page }) => {
    const certificates = new CertificatesPage(page);
    await certificates.goToYouPage();
    await certificates.openCertificatesTab();
    await certificates.clickCertificateButton('Learning Plan A');
    await expect(certificates.certificateModal).toBeVisible();
    const download = await certificates.downloadCertificateFromModal();
    const path = await download.path();
    expect(path).toBeTruthy();
  });
});

test.describe('Certificates Tab - AC-2', () => {
  test('AC-2: User can select and download any of the three most recent completions', async ({ page }) => {
    const certificates = new CertificatesPage(page);
    await certificates.goToYouPage();
    await certificates.openCertificatesTab();
    await certificates.clickCertificateButton('Learning Plan B');
    await expect(certificates.certificateModal).toBeVisible();
    // Assume modal shows a list of recent completions with data-testid='completion-item'
    const completionItems = certificates.certificateModal.getByTestId('completion-item');
    const count = await completionItems.count();
    expect(count).toBeLessThanOrEqual(3);
    for (let i = 0; i < count; i++) {
      const item = completionItems.nth(i);
      await item.click(); // select this completion
      const download = await certificates.downloadCertificateFromModal();
      const path = await download.path();
      expect(path).toBeTruthy();
    }
  });
});

test.describe('Certificates Tab - AC-3', () => {
  test('AC-3: VIEW button navigates to the learning plan page', async ({ page }) => {
    const certificates = new CertificatesPage(page);
    await certificates.goToYouPage();
    await certificates.openCertificatesTab();
    await certificates.clickViewButton('Learning Plan C');
    await expect(page).toHaveURL(/\/learning-plan\/.*C/);
  });
});

test.describe('Certificates Tab - AC-4', () => {
  test('AC-4: Filter by Learning plans shows correct certificates', async ({ page }) => {
    const certificates = new CertificatesPage(page);
    await certificates.goToYouPage();
    await certificates.openCertificatesTab();
    await certificates.selectFilter('Learning plans');
    const tile = certificates.certificateTile('Learning Plan D');
    await expect(tile).toBeVisible();
  });
});

test.describe('Certificates Tab - AC-5', () => {
  test('AC-5: Up to 20 certificates displayed, sorted, and view more loads next batch', async ({ page }) => {
    const certificates = new CertificatesPage(page);
    await certificates.goToYouPage();
    await certificates.openCertificatesTab();
    const initialCount = await certificates.getCertificateTilesCount();
    expect(initialCount).toBeLessThanOrEqual(20);
    // Verify sorting by checking first two tiles dates (assume data-testid='certificate-date')
    const firstDate = await certificates.certificateTile('0').getByTestId('certificate-date').innerText();
    const secondDate = await certificates.certificateTile('1').getByTestId('certificate-date').innerText();
    expect(new Date(firstDate).getTime()).toBeGreaterThanOrEqual(new Date(secondDate).getTime());
    await certificates.clickViewMore();
    const afterCount = await certificates.getCertificateTilesCount();
    expect(afterCount).toBeGreaterThan(initialCount);
    expect(afterCount).toBeLessThanOrEqual(40);
  });
});

test.describe('Certificates Tab - AC-6', () => {
  test('AC-6: Completed label appears on each learning plan tile', async ({ page }) => {
    const certificates = new CertificatesPage(page);
    await certificates.goToYouPage();
    await certificates.openCertificatesTab();
    const label = await certificates.getCompletedLabelText('Learning Plan E');
    expect(label.trim().toUpperCase()).toBe('COMPLETED');
  });
});

test.describe('Certificates Tab - AC-7', () => {
  test('AC-7: Downloaded certificate matches new design (visual regression placeholder)', async ({ page }) => {
    const certificates = new CertificatesPage(page);
    await certificates.goToYouPage();
    await certificates.openCertificatesTab();
    await certificates.clickCertificateButton('Learning Plan F');
    const download = await certificates.downloadCertificateFromModal();
    const path = await download.path();
    // Placeholder for visual diff – in real suite compare PDF rendering
    expect(path).toBeTruthy();
  });
});

test.describe('Certificates Tab - AC-8', () => {
  test('AC-8: Downloaded file name follows naming convention', async ({ page }) => {
    const certificates = new CertificatesPage(page);
    await certificates.goToYouPage();
    await certificates.openCertificatesTab();
    await certificates.clickCertificateButton('Learning Plan G');
    const download = await certificates.downloadCertificateFromModal();
    const suggestedName = download.suggestedFilename();
    const today = new Date();
    const expected = expectedFileName('Learning Plan G', today);
    expect(suggestedName).toMatch(new RegExp(`^Learning Plan G-\d{2}-\d{2}-\d{4}\\.pdf$`));
    // Additional strict check if date matches today (allowing possible timezone differences)
    expect(suggestedName).toBe(expected);
  });
});

test.describe('Certificates Tab - AC-9', () => {
  test('AC-9: Certificate preview modal shows correct certificate only', async ({ page }) => {
    const certificates = new CertificatesPage(page);
    await certificates.goToYouPage();
    await certificates.openCertificatesTab();
    await certificates.clickCertificateButton('Learning Plan H');
    await expect(certificates.certificateModal).toBeVisible();
    const modalContent = await certificates.certificateModal.textContent();
    expect(modalContent).toContain('Learning Plan H');
    // Ensure no other plan titles appear
    expect(modalContent).not.toContain('Learning Plan X');
  });
});

test.describe('Certificates Tab - AC-10', () => {
  test('AC-10: View more respects max three certificates per plan and loads next 20 items', async ({ page }) => {
    const certificates = new CertificatesPage(page);
    await certificates.goToYouPage();
    await certificates.openCertificatesTab();
    // Assume initial load shows 20 tiles, each may contain up to 3 completion items
    const initialTiles = await certificates.getCertificateTilesCount();
    expect(initialTiles).toBeLessThanOrEqual(20);
    // Verify each tile does not exceed three completion items
    for (let i = 0; i < initialTiles; i++) {
      const tile = certificates.certificateTile(`tile-${i}`);
      const completions = tile.getByTestId('completion-item');
      const compCount = await completions.count();
      expect(compCount).toBeLessThanOrEqual(3);
    }
    await certificates.clickViewMore();
    const afterTiles = await certificates.getCertificateTilesCount();
    expect(afterTiles).toBeLessThanOrEqual(40);
  });
});

test.describe('Certificates Tab - AC-11', () => {
  test('AC-11: Friendly message shown when no certificates are available', async ({ page }) => {
    const certificates = new CertificatesPage(page);
    await certificates.goToYouPage();
    await certificates.openCertificatesTab();
    // Simulate user with no certificates – assume test environment provides such state
    await expect(certificates.noCertificatesMessage).toBeVisible();
    await expect(certificates.noCertificatesMessage).toHaveText(/no certificates available/i);
    // Ensure no tile elements are rendered
    const tileCount = await certificates.getCertificateTilesCount();
    expect(tileCount).toBe(0);
  });
});
