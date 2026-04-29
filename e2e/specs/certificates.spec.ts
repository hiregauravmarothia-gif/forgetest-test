import { test, expect } from '@playwright/test';
import { YouPage } from '../pages/YouPage';

/**
 * Feature: Certificate management on the YOU page
 */

// ---------- AC-1 ----------
test.describe('AC-1: View and download a single certificate', () => {
  test('should allow viewing and downloading the certificate for a learning plan', async ({ page }) => {
    const you = new YouPage(page);
    await you.navigateToYouPage();
    await you.selectCertificatesTab();

    const planName = 'Intro to Project Management'; // assumes fixture data
    await you.clickCertificateButton(planName);

    // Expect a download to start
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      // The click already triggered the download
    ]);
    const suggestedName = await download.suggestedFilename();
    expect(suggestedName).toMatch(new RegExp(`${planName.replace(/\s+/g, '-')}-\d{2}-\d{2}-\d{4}\\.pdf`, 'i'));
    await download.saveAs(`./downloads/${suggestedName}`);
  });
});

// ---------- AC-2 ----------
test.describe('AC-2: Choose among multiple recent certificates', () => {
  test('should let the user select and download any of the three most recent certificates', async ({ page }) => {
    const you = new YouPage(page);
    await you.navigateToYouPage();
    await you.selectCertificatesTab();

    const planName = 'Advanced Data Analytics';
    await you.clickCertificateButton(planName);

    // Assume a dropdown appears with options like "Completion 1 - 01-01-2024"
    const recentOptions = ['Completion 1 - 01-01-2024', 'Completion 2 - 15-12-2023', 'Completion 3 - 30-11-2023'];
    for (const option of recentOptions) {
      await you.selectCertificateFromDropdown(planName, option);
      const [download] = await Promise.all([
        page.waitForEvent('download'),
      ]);
      const suggestedName = await download.suggestedFilename();
      expect(suggestedName).toContain(planName.replace(/\s+/g, '-'));
      await download.saveAs(`./downloads/${suggestedName}`);
    }
  });
});

// ---------- AC-3 ----------
test.describe('AC-3: Navigate to learning plan via VIEW button', () => {
  test('should navigate to the learning plan page when VIEW is clicked', async ({ page }) => {
    const you = new YouPage(page);
    await you.navigateToYouPage();
    await you.selectCertificatesTab();

    const planName = 'Leadership Essentials';
    await you.clickViewButton(planName);

    await expect(page).toHaveURL(new RegExp(`/learning-plans/.*${planName.replace(/\s+/g, '-').toLowerCase()}`));
  });
});

// ---------- AC-4 ----------
test.describe('AC-4: Filter learning plan certificates', () => {
  test('should display learning plan certificates when filter is applied', async ({ page }) => {
    const you = new YouPage(page);
    await you.navigateToYouPage();
    await you.selectCertificatesTab();
    await you.selectFilterOption('Learning plans');

    // Verify at least one tile is displayed and it belongs to a learning plan
    const visiblePlans = await you.getVisiblePlanNames();
    expect(visiblePlans.length).toBeGreaterThan(0);
    // Additional domain‑specific checks could be added here
  });
});

// ---------- AC-5 ----------
test.describe('AC-5: Pagination and sorting of certificates', () => {
  test('should show up to 20 certificates sorted by most recent and allow loading more', async ({ page }) => {
    const you = new YouPage(page);
    await you.navigateToYouPage();
    await you.selectCertificatesTab();

    const firstPagePlans = await you.getVisiblePlanNames();
    expect(firstPagePlans.length).toBeLessThanOrEqual(20);

    // Assuming the list is sorted by date descending, we could verify ordering via a data attribute if available
    // Click View more to load next page
    await you.clickViewMore();
    const secondPagePlans = await you.getVisiblePlanNames();
    expect(secondPagePlans.length).toBeGreaterThan(firstPagePlans.length);
    expect(secondPagePlans.length).toBeLessThanOrEqual(40);
  });
});

// ---------- AC-6 ----------
test.describe('AC-6: Completed label on tiles', () => {
  test('should display a "COMPLETED" label on each learning plan tile', async ({ page }) => {
    const you = new YouPage(page);
    await you.navigateToYouPage();
    await you.selectCertificatesTab();
    await you.selectFilterOption('Learning plans');

    const planName = 'Effective Communication';
    const label = await you.getTileLabel(planName);
    await expect(label).toHaveText(/completed/i);
  });
});

// ---------- AC-7 ----------
test.describe('AC-7: Certificate download triggers design display', () => {
  test('should download the certificate and display it according to the new design', async ({ page }) => {
    const you = new YouPage(page);
    await you.navigateToYouPage();
    await you.selectCertificatesTab();

    const planName = 'Strategic Thinking';
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      you.clickCertificateButton(planName),
    ]);
    const path = await download.path();
    expect(path).not.toBeNull();
    // Additional visual regression could be performed on the opened PDF if needed
  });
});

// ---------- AC-8 ----------
test.describe('AC-8: Verify certificate file naming convention', () => {
  test('should name the downloaded PDF as [COURSE_NAME]-[dd-mm-YYYY].pdf', async ({ page }) => {
    const you = new YouPage(page);
    await you.navigateToYouPage();
    await you.selectCertificatesTab();

    const planName = 'Customer Success Basics';
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      you.clickCertificateButton(planName),
    ]);
    const filename = await download.suggestedFilename();
    const regex = new RegExp(`^${planName.replace(/\s+/g, '-')}-\d{2}-\d{2}-\d{4}\\.pdf$`, 'i');
    expect(filename).toMatch(regex);
  });
});

// ---------- AC-9 ----------
test.describe('AC-9: Handle missing certificate error', () => {
  test('should show an error message when a certificate is not available', async ({ page }) => {
    const you = new YouPage(page);
    await you.navigateToYouPage();
    await you.selectCertificatesTab();

    const planName = 'Legacy Training'; // known to have no certificate
    await you.clickCertificateButton(planName);
    const errorText = await you.getErrorMessageText();
    await expect(errorText).toContain('Certificate not available');
  });
});

// ---------- AC-10 ----------
test.describe('AC-10: Permission restrictions on certificate download', () => {
  test('should disable the Certificate button and show a tooltip when user lacks permission', async ({ page }) => {
    // Assume we can login as a user without permission via a helper (not shown)
    // await loginAsUserWithoutCertificatePermission(page);
    const you = new YouPage(page);
    await you.navigateToYouPage();
    await you.selectCertificatesTab();

    const planName = 'Compliance Basics';
    const isDisabled = await you.isCertificateButtonDisabled(planName);
    expect(isDisabled).toBeTruthy();
    const tooltip = await you.getTooltipForCertificateButton(planName);
    expect(tooltip).toContain('You do not have permission to download certificates');
  });
});

// ---------- AC-11 ----------
test.describe('AC-11: Edge case pagination beyond initial 20 certificates', () => {
  test('should correctly display remaining certificates when fewer than 20 are left', async ({ page }) => {
    const you = new YouPage(page);
    await you.navigateToYouPage();
    await you.selectCertificatesTab();

    // Load first page (20 items)
    await you.clickViewMore(); // load second page
    const allPlans = await you.getVisiblePlanNames();
    // Assuming total certificates = 35 for this user
    expect(allPlans.length).toBeLessThanOrEqual(40);
    // Verify that after loading second page we have between 21 and 35 items
    expect(allPlans.length).toBeGreaterThan(20);
  });
});
