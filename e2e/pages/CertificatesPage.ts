import { Page, Locator } from '@playwright/test';

export class CertificatesPage {
  readonly page: Page;
  // Tabs
  readonly certificatesTab: Locator;
  // Tiles representing completed learning plans
  readonly planTile: (planName: string) => Locator;
  // Buttons inside a tile
  readonly certificateButton: (planName: string) => Locator;
  readonly viewButton: (planName: string) => Locator;
  // Filter controls
  readonly objectTypeFilter: Locator;
  readonly searchFilterInput: Locator;
  readonly communitiesFilterInput: Locator;
  // Pagination
  readonly viewMoreButton: Locator;
  // Modal for multiple completions
  readonly completionsModal: Locator;
  readonly completionOption: (date: string) => Locator;
  readonly modalDownloadButton: Locator;
  readonly modalErrorMessage: Locator;
  // Empty state
  readonly emptyStateMessage: Locator;
  // Authorization error
  readonly authErrorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.certificatesTab = page.getByRole('tab', { name: /certificate/i });
    this.planTile = (planName) => page.getByTestId('certificate-plan-tile').filter({ hasText: planName });
    this.certificateButton = (planName) => this.planTile(planName).getByRole('button', { name: /certificate/i });
    this.viewButton = (planName) => this.planTile(planName).getByRole('button', { name: /view/i });
    this.objectTypeFilter = page.getByTestId('filter-object-type');
    this.searchFilterInput = page.getByTestId('filter-search');
    this.communitiesFilterInput = page.getByTestId('filter-communities');
    this.viewMoreButton = page.getByRole('button', { name: /view more/i });
    this.completionsModal = page.getByRole('dialog', { name: /select completion/i });
    this.completionOption = (date) => this.completionsModal.getByRole('option', { name: date });
    this.modalDownloadButton = this.completionsModal.getByRole('button', { name: /download/i });
    this.modalErrorMessage = this.completionsModal.getByText(/please select a completion to download/i);
    this.emptyStateMessage = page.getByText(/no certificates available/i);
    this.authErrorMessage = page.getByText(/you do not have permission to view certificates/i);
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

  async clickViewButton(planName: string) {
    await this.viewButton(planName).click();
  }

  async selectObjectType(objectType: string) {
    await this.objectTypeFilter.selectOption({ label: objectType });
  }

  async applySearchFilter(term: string) {
    await this.searchFilterInput.fill(term);
    await this.searchFilterInput.press('Enter');
  }

  async applyCommunitiesFilter(term: string) {
    await this.communitiesFilterInput.fill(term);
    await this.communitiesFilterInput.press('Enter');
  }

  async clickViewMore() {
    await this.viewMoreButton.click();
  }

  async selectCompletionDate(date: string) {
    await this.completionOption(date).click();
  }

  async downloadFromModal() {
    await this.modalDownloadButton.click();
  }

  async getDownloadedFileName(): Promise<string> {
    // Assumes the test runner is configured with downloads path
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
    ]);
    return download.suggestedFilename();
  }

  async getEmptyStateMessage() {
    return this.emptyStateMessage.textContent();
  }

  async getAuthErrorMessage() {
    return this.authErrorMessage.textContent();
  }

  async getModalErrorMessage() {
    return this.modalErrorMessage.textContent();
  }
}
