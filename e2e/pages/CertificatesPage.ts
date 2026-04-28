import { Page, Locator } from '@playwright/test';

export class CertificatesPage {
  readonly page: Page;
  readonly certificateTab: Locator;
  readonly certificateButtons: Locator; // each tile's "Certificate" button
  readonly viewButtons: Locator; // each tile's "VIEW" button
  readonly filterDropdown: Locator;
  readonly viewMoreButton: Locator;
  readonly completedLabel: Locator; // label on tile
  readonly downloadToast: Locator;

  constructor(page: Page) {
    this.page = page;
    this.certificateTab = page.getByRole('tab', { name: /certificate/i });
    this.certificateButtons = page.getByTestId('certificate-button');
    this.viewButtons = page.getByTestId('view-button');
    this.filterDropdown = page.getByTestId('filter-dropdown');
    this.viewMoreButton = page.getByRole('button', { name: /view more/i });
    this.completedLabel = page.getByTestId('tile-completed-label');
    this.downloadToast = page.getByRole('alert');
  }

  async gotoYouPage() {
    await this.page.goto('/you');
  }

  async openCertificatesTab() {
    await this.certificateTab.click();
  }

  async clickCertificateButtonByPlanName(planName: string) {
    const tile = this.page.getByRole('region', { name: planName });
    await tile.getByTestId('certificate-button').click();
  }

  async clickViewButtonByPlanName(planName: string) {
    const tile = this.page.getByRole('region', { name: planName });
    await tile.getByTestId('view-button').click();
  }

  async selectFilterOption(option: string) {
    await this.filterDropdown.selectOption(option);
  }

  async clickViewMore() {
    await this.viewMoreButton.click();
  }

  async expectCertificateDownloaded(planName: string) {
    // Playwright's download handling is done in the test, not page object.
    // This method is a placeholder for future extensions.
  }

  async expectCompletedLabelVisible(planName: string) {
    const tile = this.page.getByRole('region', { name: planName });
    await tile.getByTestId('tile-completed-label').toBeVisible();
  }

  async expectDownloadToastVisible() {
    await this.downloadToast.waitFor({ state: 'visible' });
  }
}
