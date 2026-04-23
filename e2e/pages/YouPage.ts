import { expect, Locator, Page } from '@playwright/test';

export class YouPage {
  readonly page: Page;
  readonly certificatesTab: Locator;
  readonly certificateList: Locator;
  readonly noCertificatesMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.certificatesTab = page.getByTestId('you-tab-certificates');
    this.certificateList = page.getByTestId('certificate-list');
    this.noCertificatesMessage = page.getByTestId('no-certificates-msg');
  }

  async goto() {
    await this.page.goto('/you');
  }

  async selectCertificatesTab() {
    await this.certificatesTab.click();
    await expect(this.certificatesTab).toHaveAttribute('aria-selected', 'true');
  }

  async expectCertificatePresent(title: string, date: string) {
    const certificateItem = this.certificateList.getByRole('listitem').filter({ hasText: title });
    await expect(certificateItem).toBeVisible();
    await expect(certificateItem).toContainText(date);
    const downloadLink = certificateItem.getByRole('link', { name: /download/i });
    await expect(downloadLink).toBeVisible();
  }

  async expectNoCertificatesMessage() {
    await expect(this.noCertificatesMessage).toBeVisible();
    await expect(this.noCertificatesMessage).toHaveText('You have no certificates yet.');
  }
}
