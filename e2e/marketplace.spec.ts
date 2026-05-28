/**
 * Marketplace browse — anonymous user.
 * No auth required; runs against prod without seeding.
 */
import { test, expect } from '@playwright/test';

test.describe('Marketplace — anonymous browse', () => {
  test('marketplace page loads', async ({ page }) => {
    await page.goto('/market');
    await expect(page).toHaveTitle(/ShiftReady/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('shows search input', async ({ page }) => {
    await page.goto('/market');
    // Search input exists (may be a text input or a search field)
    const search = page.locator('input[type="search"], input[placeholder*="earch"]').first();
    await expect(search).toBeVisible({ timeout: 10_000 });
  });

  test('empty search shows zero-results state gracefully', async ({ page }) => {
    await page.goto('/market');
    const search = page.locator('input[type="search"], input[placeholder*="earch"]').first();
    await search.fill('xyznonexistentitem12345');
    await search.press('Enter');
    // Should not show error — may show empty state or zero count
    await expect(page.locator('body')).not.toContainText('500');
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
  });

  test('navigating to /market redirects away from login', async ({ page }) => {
    await page.goto('/market');
    // Should NOT redirect to login — marketplace is public
    expect(page.url()).not.toContain('/login');
  });

  test('item detail page loads for a live item (if any exist)', async ({ page }) => {
    await page.goto('/market');
    // If there are items listed, click the first one and verify the detail page loads
    const items = page.locator('[data-testid="item-card"], [class*="item"], [class*="listing"]');
    const count = await items.count();
    if (count === 0) {
      test.skip();
      return;
    }
    await items.first().click();
    await expect(page.locator('body')).not.toContainText('404');
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
  });

  test('unauthenticated user sees public sale page without 401', async ({ page }) => {
    await page.goto('/market');
    // No API 401 errors should surface on a public page
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await page.waitForTimeout(2000);
    const authErrors = consoleErrors.filter(e => e.includes('401') || e.includes('Unauthorized'));
    expect(authErrors).toHaveLength(0);
  });
});
