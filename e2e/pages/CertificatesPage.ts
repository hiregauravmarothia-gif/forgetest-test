import { Page, Locator } from '@playwright/test';

export class CertificatesPage {
  readonly page: Page;
  readonly certificatesTab: Locator;
  readonly certificateButton: (planName: string) => Locator;
  readonly viewButton: (planName: string) => Locator;
  readonly filterDropdown: Locator;
  readonly filterOption: (option: string) => Locator;
  readonly viewMoreButton: Locator;
  readonly certificateTile: (planName: string) => Locator;
  readonly completedLabel: (planName: string) => Locator;
  readonly noCertificatesMessage: Locator;
  readonly certificateModal: Locator;
  readonly downloadLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.certificatesTab = page.getByRole('tab', { name: /certificate/i });
    this.certificateButton = (planName) =>
      page.getByTestId('certificate-button').filter({ hasText: planName });
    this.viewButton = (planName) =>
      page.getByTestId('view-button').filter({ hasText: planName });
    this.filterDropdown = page.getByTestId('filter-dropdown');
    this.filterOption = (option) => this.filterDropdown.getByRole('option', { name: option });
    this.viewMoreButton = page.getByRole('button', { name: /view more/i });
    this.certificateTile = (planName) => page.getByTestId('certificate-tile').filter({ hasText: planName });
    this.completedLabel = (planName) =>
      this.certificateTile(planName).getByTestId('completed-label');
    this.noCertificatesMessage = page.getByText(/no certificates available/i);
    this.certificateModal = page.getByRole('dialog', { name: /certificate preview/i });
    this.downloadLink = this.certificateModal.getByRole('link', { name: /download/i });
  }

  async goToYouPage() {
    await this.page.goto('/you');
  }

  async openCertificatesTab() {
    await this.certificatesTab.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickCertificateButton(planName: string) {
    await this.certificateButton(planName).click();
  }

  async clickViewButton(planName: string) {
    await this.viewButton(planName).click();
  }

  async selectFilter(option: string) {
    await this.filterDropdown.click();
    await this.filterOption(option).click();
  }

  async clickViewMore() {
    await this.viewMoreButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async downloadCertificateFromModal() {
    const [ download ] = await Promise.all([
      this.page.waitForEvent('download'),
      this.downloadLink.click()
    ]);
    return download;
  }

  async isCertificateModalVisible() {
    return await this.certificateModal.isVisible();
  }

  async getCompletedLabelText(planName: string) {
    return await this.completedLabel(planName).innerText();
  }

  async isNoCertificatesMessageVisible() {
    return await this.noCertificatesMessage.isVisible();
  }

  async getCertificateTilesCount() {
    return await this.page.getByTestId('certificate-tile').count();
  }
}
