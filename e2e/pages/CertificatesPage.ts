import { Page, Locator, expect } from '@playwright/test';

export class CertificatesPage {
  readonly page: Page;
  readonly certificatesTab: Locator;
  readonly viewMoreButton: Locator;
  readonly noCertificatesMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.certificatesTab = page.getByTestId('certificates-tab');
    this.viewMoreButton = page.getByRole('button', { name: /view more/i });
    this.noCertificatesMessage = page.getByTestId('no-certificates-msg');
    this.errorMessage = page.getByTestId('certificate-download-error');
  }

  async openCertificatesTab() {
    await this.certificatesTab.click();
    await expect(this.certificatesTab).toBeVisible();
  }

  certificateButton(entryId: string): Locator {
    // Assuming each certificate entry has a button with a test id that includes the entry id
    return this.page.getByTestId(`certificate-button-${entryId}`);
  }

  async clickCertificateButton(entryId: string) {
    const button = this.certificateButton(entryId);
    await button.click();
  }

  getCertificateModal(): Locator {
    return this.page.getByRole('dialog', { name: /certificate preview/i });
  }

  async expectCertificateModalVisible() {
    const modal = this.getCertificateModal();
    await expect(modal).toBeVisible();
  }

  async getCertificateListItems(): Promise<Locator[]> {
    // Each list item has a test id pattern
    const items = this.page.getByTestId(/^certificate-item-/);
    return items.all();
  }

  async clickViewMore() {
    await this.viewMoreButton.click();
  }

  async expectNoCertificatesMessage() {
    await expect(this.noCertificatesMessage).toBeVisible();
    await expect(this.noCertificatesMessage).toHaveText(/no certificates available/i);
  }

  async expectDownloadErrorMessage() {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toHaveText(/certificate could not be downloaded\. please try again later\./i);
  }

  async downloadCertificate(entryId: string) {
    const downloadPromise = this.page.waitForEvent('download');
    await this.clickCertificateButton(entryId);
    const download = await downloadPromise;
    return download;
  }
}
