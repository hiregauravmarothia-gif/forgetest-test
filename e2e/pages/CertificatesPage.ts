import { Page, Locator } from '@playwright/test';

export class CertificatesPage {
  readonly page: Page;
  readonly certificatesTab: Locator;
  readonly filterDropdown: Locator;
  readonly viewMoreButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.certificatesTab = page.getByRole('tab', { name: /certificate/i });
    this.filterDropdown = page.getByTestId('filter-dropdown');
    this.viewMoreButton = page.getByRole('button', { name: /view more/i });
  }

  async goToCertificatesTab() {
    await this.certificatesTab.click();
    await this.page.waitForLoadState('networkidle');
  }

  tileByPlanName(planName: string): Locator {
    return this.page.getByTestId('certificate-tile').filter({ hasText: planName });
  }

  async clickCertificateButton(planName: string) {
    const tile = this.tileByPlanName(planName);
    const button = tile.getByTestId('certificate-button');
    await button.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickViewButton(planName: string) {
    const tile = this.tileByPlanName(planName);
    const button = tile.getByTestId('view-button');
    await button.click();
    await this.page.waitForLoadState('networkidle');
  }

  async openCertificateVersionSelector(planName: string) {
    const tile = this.tileByPlanName(planName);
    const selector = tile.getByTestId('certificate-version-selector');
    await selector.click();
    await this.page.waitForLoadState('networkidle');
  }

  async selectCertificateVersion(planName: string, versionLabel: string) {
    await this.openCertificateVersionSelector(planName);
    const option = this.page.getByRole('option', { name: versionLabel });
    await option.click();
    await this.page.waitForLoadState('networkidle');
  }

  async applyFilter(filterText: string) {
    await this.filterDropdown.click();
    const option = this.page.getByRole('option', { name: filterText });
    await option.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getVisibleTileCount(): Promise<number> {
    return await this.page.getByTestId('certificate-tile').count();
  }

  async clickViewMore() {
    await this.viewMoreButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getCompletedLabel(planName: string): Promise<string> {
    const tile = this.tileByPlanName(planName);
    return await tile.getByTestId('completed-label').innerText();
  }

  async downloadLatestCertificate(planName: string): Promise<string> {
    await this.clickCertificateButton(planName);
    // Assuming the download starts automatically after click
    const [ download ] = await Promise.all([
      this.page.waitForEvent('download'),
      // click already performed
    ]);
    const path = await download.path();
    return path ?? '';
  }
}
