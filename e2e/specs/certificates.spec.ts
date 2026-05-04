import { test, expect } from '@playwright/test';
import { CertificatesPage } from '../pages/CertificatesPage';

// Helper to generate a safe filename pattern
function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

test.describe('Certificates management on the YOU page', () => {
  let pageObj: CertificatesPage;

  test.beforeEach(async ({ page }) => {
    pageObj = new CertificatesPage(page);
    // Assume user is already authenticated and on the YOU page
    await pageObj.openCertificatesTab();
  });

  test.describe('AC-9 [HAPPY] - Open certificate preview modal', () => {
    test('should display the correct certificate in a modal without unrelated info', async ({ page }) => {
      const entryId = 'lp-123'; // placeholder id for a completed learning plan
      await pageObj.clickCertificateButton(entryId);
      await pageObj.expectCertificateModalVisible();
      const modal = pageObj.getCertificateModal();
      // Verify modal contains the certificate title and not other LP info
      await expect(modal).toContainText(/certificate for/i);
      await expect(modal).not.toContainText(/learning plan details/i);
    });
  });

  test.describe('AC-10 [HAPPY] - Pagination load next 20 certificates', () => {
    test('should load exactly the next 20 certificates when View more is clicked', async ({ page }) => {
      // Precondition: more than three completed plans exist (>20 certificates total)
      await pageObj.clickViewMore();
      const items = await pageObj.getCertificateListItems();
      await expect(items).toHaveLength(20);
      // Verify each item belongs to a distinct learning plan (max 3 per plan)
      const planIds = await Promise.all(
        items.map(async (item) => await item.getAttribute('data-plan-id'))
      );
      const counts = planIds.reduce((acc, id) => {
        acc[id] = (acc[id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      for (const cnt of Object.values(counts)) {
        expect(cnt).toBeLessThanOrEqual(3);
      }
    });
  });

  test.describe('AC-11 [HAPPY] - No certificates available message', () => {
    test('should show friendly message when no certificates exist', async ({ page }) => {
      // Simulate user with no completed plans – assume backend mock handled elsewhere
      await pageObj.openCertificatesTab();
      await pageObj.expectNoCertificatesMessage();
    });
  });

  test.describe('AC-12 [SAD] - Handle download server error', () => {
    test('should display error message and not save corrupted file', async ({ page }) => {
      const entryId = 'lp-error'; // entry that triggers server error
      // Intercept the download request to force a 500 response
      await page.route('**/download-certificate/**', (route) => route.fulfill({ status: 500 }));
      await pageObj.clickCertificateButton(entryId);
      await pageObj.expectDownloadErrorMessage();
      // Ensure no download event is emitted
      const downloads = await page.waitForEvent('download', { timeout: 2000 }).catch(() => null);
      expect(downloads).toBeNull();
    });
  });

  test.describe('AC-13 [EDGE] - Validate downloaded filename format', () => {
    test('should download PDF with correct sanitized filename', async ({ page, browser }) => {
      const entryId = 'lp-456';
      const courseName = 'Advanced & Special: Course';
      const completionDate = new Date('2023-08-15');
      const expectedName = `${sanitizeFileName(courseName)}-${completionDate
        .toLocaleDateString('en-GB')
        .replace(/\//g, '-')}.pdf`;

      // Mock backend to return a dummy PDF stream
      await page.route('**/download-certificate/**', async (route) => {
        const pdfBuffer = Buffer.from('%PDF-1.4 dummy');
        await route.fulfill({
          status: 200,
          body: pdfBuffer,
          headers: { 'Content-Type': 'application/pdf' },
        });
      });

      const download = await pageObj.downloadCertificate(entryId);
      const path = await download.path();
      expect(path).toBeTruthy();
      const suggestedName = download.suggestedFilename();
      expect(suggestedName).toBe(expectedName);
    });
  });

  test.describe('AC-14 [EDGE] - Exact pagination limits on subsequent loads', () => {
    test('should load exactly next 20 certificates or remaining count without duplication', async ({ page }) => {
      // Assume first page already loaded (20 items). Click View more again.
      await pageObj.clickViewMore();
      const items = await pageObj.getCertificateListItems();
      // Determine total count from a data attribute on the container if available
      const totalCountAttr = await page.getByTestId('certificate-list').getAttribute('data-total-count');
      const totalCount = totalCountAttr ? parseInt(totalCountAttr, 10) : 0;
      const expectedCount = Math.min(20, totalCount - 20);
      await expect(items).toHaveLength(expectedCount);
      // Ensure no duplicate IDs between first and second page
      const firstPageIds = await page.getByTestId(/^certificate-item-/).all();
      const firstIds = await Promise.all(firstPageIds.map(i => i.getAttribute('data-certificate-id')));
      const secondIds = await Promise.all(items.map(i => i.getAttribute('data-certificate-id')));
      const duplicate = firstIds.filter(id => secondIds.includes(id));
      expect(duplicate).toHaveLength(0);
    });
  });
});
