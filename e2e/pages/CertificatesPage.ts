import { Page, Locator } from '@playwright/test';

export class CertificatesPage {
  readonly page: Page;
  // Tabs
  readonly certificatesTab: Locator;
  // Certificate tiles list
  readonly certificateTiles: Locator;
  // View more button at bottom of list
  readonly viewMoreButton: Locator;
  // Filter controls
  readonly objectTypeFilter: Locator;
  readonly searchFilterInput: Locator;
  // Buttons inside a tile (identified by data-testid with dynamic id)
  readonly certificateButton: (tileId: string) => Locator;
  readonly viewButton: (tileId: string) => Locator;
  // Label inside tile indicating completion
  readonly completedLabel: (tileId: string) => Locator;
  // Error toast/message
  readonly errorMessage: Locator;
  // Empty state message
  readonly emptyStateMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.certificatesTab = page.getByRole('tab', { name: /certificate/i });
    this.certificateTiles = page.getByTestId('certificate-tile');
    this.viewMoreButton = page.getByRole('button', { name: /view more/i });
    this.objectTypeFilter = page.getByLabel(/object type/i);
    this.searchFilterInput = page.getByPlaceholder(/search/i);
    this.certificateButton = (tileId: string) =>
      page.getByTestId(`certificate-button-${tileId}`);
    this.viewButton = (tileId: string) =>
      page.getByTestId(`view-button-${tileId}`);
    this.completedLabel = (tileId: string) =>
      page.getByTestId(`completed-label-${tileId}`);
    this.errorMessage = page.getByRole('alert', { name: /unable to download certificate/i });
    this.emptyStateMessage = page.getByText(/no certificates available/i);
  }

  async navigateToYouPage() {
    await this.page.goto('/you');
  }

  async openCertificatesTab() {
    await this.certificatesTab.click();
  }

  async clickCertificateButton(tileId: string) {
    await this.certificateButton(tileId).click();
  }

  async clickViewButton(tileId: string) {
    await this.viewButton(tileId).click();
  }

  async selectObjectTypeLearningPlans() {
    await this.objectTypeFilter.selectOption({ label: 'Learning plans' });
  }

  async applySearchFilter(term: string) {
    await this.searchFilterInput.fill(term);
    await this.searchFilterInput.press('Enter');
  }

  async clickViewMore() {
    await this.viewMoreButton.click();
  }

  async getTileIds(): Promise<string[]> {
    const count = await this.certificateTiles.count();
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      const tile = this.certificateTiles.nth(i);
      const id = await tile.getAttribute('data-tile-id');
      if (id) ids.push(id);
    }
    return ids;
  }

  async isCompletedLabelVisible(tileId: string) {
    return await this.completedLabel(tileId).isVisible();
  }

  async expectErrorMessageVisible() {
    await this.errorMessage.waitFor({ state: 'visible' });
  }

  async expectEmptyStateVisible() {
    await this.emptyStateMessage.waitFor({ state: 'visible' });
  }
}
