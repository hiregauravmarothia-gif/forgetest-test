import { Page, Locator } from '@playwright/test';

export class CertificatesPage {
  readonly page: Page;

  // Locators using data-testid or ARIA role only
  readonly certificatesTab: Locator;
  readonly certificateButton: (planName: string) => Locator;
  readonly viewButton: (planName: string) => Locator;
  readonly certificateDropdown: Locator; // appears after clicking certificate button when multiple versions exist
  readonly dropdownOption: (index: number) => Locator;
  readonly completedLabel: (planName: string) => Locator;
  readonly viewMoreButton: Locator;
  readonly filterSelect: Locator;
  readonly filterOption: (optionText: string) => Locator;
  readonly errorMessage: Locator;
  readonly notification: Locator;

  constructor(page: Page) {
    this.page = page;
    this.certificatesTab = page.getByRole('tab', { name: /certificates/i });
    this.certificateButton = (planName) =>
      page.getByTestId('certificate-button').filter({ hasText: planName });
    this.viewButton = (planName) =>
      page.getByTestId('view-button').filter({ hasText: planName });
    this.certificateDropdown = page.getByTestId('certificate-version-dropdown');
    this.dropdownOption = (index) => this.certificateDropdown.locator('option').nth(index);
    this.completedLabel = (planName) =>
      page.getByTestId('certificate-tile').filter({ hasText: planName }).getByTestId('completed-label');
    this.viewMoreButton = page.getByRole('button', { name: /view more/i });
    this.filterSelect = page.getByTestId('filter-select');
    this.filterOption = (optionText) => this.filterSelect.getByRole('option', { name: optionText });
    this.errorMessage = page.getByTestId('error-message');
    this.notification = page.getByTestId('notification');
  }

  async goToYouPage() {
    await this.page.goto('/you');
  }

  async openCertificatesTab() {
    await this.certificatesTab.click();
  }

  async clickCertificateButton(planName: string) {
    await this.certificateButton(planName).click();
  }

  async selectCertificateVersion(index: number) {
    await this.certificateDropdown.click();
    await this.dropdownOption(index).click();
  }

  async clickViewButton(planName: string) {
    await this.viewButton(planName).click();
  }

  async applyFilter(optionText: string) {
    await this.filterSelect.selectOption({ label: optionText });
  }

  async clickViewMore() {
    await this.viewMoreButton.click();
  }

  async verifyCompletedLabel(planName: string) {
    await this.completedLabel(planName).waitFor({ state: 'visible' });
  }

  async getErrorMessageText() {
    return await this.errorMessage.textContent();
  }

  async getNotificationText() {
    return await this.notification.textContent();
  }
}
