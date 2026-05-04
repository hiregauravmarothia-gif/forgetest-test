import { Page, Locator } from '@playwright/test';

export class CertificatesPage {
  readonly page: Page;
  readonly certificatesTab: Locator;
  readonly viewMoreButton: Locator;
  readonly errorMessage: Locator;
  readonly retryPrompt: Locator;

  constructor(page: Page) {
    this.page = page;
    this.certificatesTab = page.getByTestId('certificates-tab');
    this.viewMoreButton = page.getByRole('button', { name: /view more/i });
    this.errorMessage = page.getByRole('alert').filter({ hasText: 'Certificate could not be generated' });
    this.retryPrompt = page.getByRole('dialog').filter({ hasText: 'Download failed. Retry?' });
  }

  async goToCertificatesTab() {
    await this.certificatesTab.click();
  }

  async clickCertificateButton(planName: string) {
    const button = this.page.getByTestId('certificate-button').filter({ hasText: planName });
    await button.click();
  }

  async clickViewButton(planName: string) {
    const button = this.page.getByTestId('view-button').filter({ hasText: planName });
    await button.click();
  }

  async applyFilter(filterOption: string) {
    const filter = this.page.getByTestId('filter-select');
    await filter.selectOption({ label: filterOption });
  }

  async getCertificateTiles(): Promise<Locator[]> {
    const tiles = this.page.getByTestId('certificate-tile');
    const count = await tiles.count();
    const result: Locator[] = [];
    for (let i = 0; i < count; i++) {
      result.push(tiles.nth(i));
    }
    return result;
  }

  async getTileLabel(tile: Locator): Promise<string> {
    return await tile.getByTestId('tile-label').innerText();
  }

  async clickViewMore() {
    await this.viewMoreButton.click();
  }

  async waitForDownload(): Promise<string> {
    const [ download ] = await Promise.all([
      this.page.waitForEvent('download'),
      // the click that triggers download should be performed by the caller
    ]);
    return download.suggestedFilename();
  }

  async expectErrorMessageVisible() {
    await this.errorMessage.waitFor({ state: 'visible' });
  }

  async expectRetryPromptVisible() {
    await this.retryPrompt.waitFor({ state: 'visible' });
  }
}
