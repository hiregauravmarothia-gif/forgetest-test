import { Page, Locator } from '@playwright/test';

export class YouPage {
  readonly page: Page;
  readonly certificatesTab: Locator;
  readonly viewMoreButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.certificatesTab = page.getByTestId('certificates-tab');
    this.viewMoreButton = page.getByRole('button', { name: /view more/i });
    this.errorMessage = page.getByRole('alert');
  }

  async navigateToYouPage() {
    await this.page.goto('/you');
    await this.page.waitForLoadState('networkidle');
  }

  async selectCertificatesTab() {
    await this.certificatesTab.click();
    await this.page.waitForLoadState('networkidle');
  }

  // Returns the tile locator for a given learning plan name
  getPlanTile(planName: string): Locator {
    // Assuming each tile has data-testid="plan-tile-{planName}" (slugified)
    return this.page.getByTestId(`plan-tile-${planName.replace(/\s+/g, '-').toLowerCase()}`);
  }

  // Certificate button inside a plan tile
  getCertificateButton(planName: string): Locator {
    return this.getPlanTile(planName).getByRole('button', { name: /certificate/i });
  }

  // View button inside a plan tile
  getViewButton(planName: string): Locator {
    return this.getPlanTile(planName).getByRole('button', { name: /view/i });
  }

  // Label inside a plan tile (e.g., "COMPLETED")
  getTileLabel(planName: string): Locator {
    return this.getPlanTile(planName).getByTestId('tile-label');
  }

  async clickCertificateButton(planName: string) {
    await this.getCertificateButton(planName).click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickViewButton(planName: string) {
    await this.getViewButton(planName).click();
    await this.page.waitForLoadState('networkidle');
  }

  async selectFilterOption(filterName: string) {
    // Assuming a dropdown with data-testid="filter-{filterName}"
    const filter = this.page.getByTestId(`filter-${filterName.toLowerCase()}`);
    await filter.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickViewMore() {
    await this.viewMoreButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async isCertificateButtonDisabled(planName: string): Promise<boolean> {
    return await this.getCertificateButton(planName).isDisabled();
  }

  async getTooltipForCertificateButton(planName: string): Promise<string> {
    const button = this.getCertificateButton(planName);
    await button.hover();
    // Assuming tooltip appears as a role="tooltip"
    const tooltip = this.page.getByRole('tooltip');
    return await tooltip.textContent() ?? '';
  }

  async getErrorMessageText(): Promise<string> {
    return await this.errorMessage.textContent() ?? '';
  }

  async getVisiblePlanNames(): Promise<string[]> {
    const tiles = this.page.getByTestId(/^plan-tile-/);
    const count = await tiles.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const tile = tiles.nth(i);
      const name = await tile.getAttribute('data-plan-name'); // assumed attribute
      if (name) names.push(name);
    }
    return names;
  }

  // Placeholder for selecting a specific completion when multiple certificates exist
  async selectCertificateFromDropdown(planName: string, optionLabel: string) {
    // ⚠ LOCATOR_GAP: exact locator for the dropdown that appears after clicking the certificate button
    const dropdown = this.page.getByRole('combobox');
    await dropdown.selectOption({ label: optionLabel });
    await this.page.waitForLoadState('networkidle');
  }

  // Placeholder for verifying download file name – Playwright's download handling will be used in tests
}
