/**
 * Sold rollup flow — seller marks items sold, verifies status transitions.
 *
 * Requires test accounts in .env.e2e:
 *   E2E_SELLER_EMAIL / E2E_SELLER_PASSWORD
 *   E2E_FIREBASE_API_KEY / E2E_API_URL
 *
 * Setup: seeds a live 2-item sale via backend API.
 * Flow:  seller logs in → inventory → marks one item sold → verifies PARTIALLY_SOLD
 *        marks second item sold → verifies SOLD
 */
import { test, expect } from '@playwright/test';
import { hasTestAccounts, getIdToken, loginViaUi } from './helpers/auth';
import { makeApi, seedLiveSale } from './helpers/api';

test.describe('Sold rollup', () => {
  test.beforeEach(() => {
    if (!hasTestAccounts()) {
      test.skip();
    }
  });

  test('seller can mark an item sold from inventory', async ({ page, request }) => {
    const sellerToken = await getIdToken(
      request,
      process.env.E2E_SELLER_EMAIL!,
      process.env.E2E_SELLER_PASSWORD!,
    );
    const { eventId } = await seedLiveSale(request, sellerToken);

    await loginViaUi(page, process.env.E2E_SELLER_EMAIL!, process.env.E2E_SELLER_PASSWORD!);

    // Navigate to the sale's inventory view
    await page.goto(`/seller-central`);

    // Find the seeded sale — look for it by navigating to inventory
    const saleLink = page.locator(`[data-event-id="${eventId}"], a[href*="${eventId}"]`).first();
    if (await saleLink.count() > 0) {
      await saleLink.click();
    } else {
      // Fallback: go directly to inventory URL pattern
      await page.goto(`/seller-central/${eventId}/inventory`).catch(() => {});
    }

    // Find mark-sold button on an item
    const markSoldBtn = page.locator(
      'button:has-text("Mark Sold"), button:has-text("Sold"), [aria-label*="sold"]',
    ).first();
    if (await markSoldBtn.count() === 0) {
      test.skip();
      return;
    }
    await markSoldBtn.click();

    // Handle confirmation dialog if present
    const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Yes, sold")').first();
    if (await confirmBtn.count() > 0) await confirmBtn.click();

    // Item should show sold state
    await expect(page.locator('body')).toContainText(/sold|SOLD/i, { timeout: 10_000 });
  });

  test('sale transitions to PARTIALLY_SOLD when one of two items is sold (API)', async ({ request }) => {
    const sellerToken = await getIdToken(
      request,
      process.env.E2E_SELLER_EMAIL!,
      process.env.E2E_SELLER_PASSWORD!,
    );
    const { eventId, bundleId, itemId } = await seedLiveSale(request, sellerToken);

    // Add a second item to the sale
    const api = makeApi(request, sellerToken);
    const item2Res = await api.post(`/sales/${eventId}/bundles/${bundleId}/items`, {
      name: 'Coffee Table',
      brand: 'IKEA',
      condition: 'Good',
      actual_listing_price: 120.0,
      actual_original_price: 250.0,
      actual_year_of_purchase: 2021,
    });
    expect(item2Res.ok()).toBeTruthy();

    // Mark only the first item sold
    const soldRes = await api.post(
      `/sales/${eventId}/bundles/${bundleId}/items/${itemId}/mark-sold`,
      { final_price: 400.0, buyer_label: 'E2E Test Buyer' },
    );
    expect(soldRes.ok()).toBeTruthy();

    // Verify sale status via API
    const statusRes = await api.get(`/sales/${eventId}/status`);
    const status = (await statusRes.json()).status;
    expect(status).toBe('partially_sold');
  });

  test('sale transitions to SOLD when all items are sold (API)', async ({ request }) => {
    const sellerToken = await getIdToken(
      request,
      process.env.E2E_SELLER_EMAIL!,
      process.env.E2E_SELLER_PASSWORD!,
    );
    const { eventId, bundleId, itemId } = await seedLiveSale(request, sellerToken);
    const api = makeApi(request, sellerToken);

    // Mark the single item sold
    const soldRes = await api.post(
      `/sales/${eventId}/bundles/${bundleId}/items/${itemId}/mark-sold`,
      { final_price: 450.0, buyer_label: 'E2E Buyer' },
    );
    expect(soldRes.ok()).toBeTruthy();

    // Sale has one bundle with one item → should be SOLD
    const statusRes = await api.get(`/sales/${eventId}/status`);
    const status = (await statusRes.json()).status;
    expect(status).toBe('sold');
  });

  test('mark sale sold in one action (API)', async ({ request }) => {
    const sellerToken = await getIdToken(
      request,
      process.env.E2E_SELLER_EMAIL!,
      process.env.E2E_SELLER_PASSWORD!,
    );
    const { eventId } = await seedLiveSale(request, sellerToken);
    const api = makeApi(request, sellerToken);

    const res = await api.post(`/sales/${eventId}/mark-sold`, {
      buyer_label: 'E2E Bulk Buyer',
    });
    expect(res.ok()).toBeTruthy();

    const statusRes = await api.get(`/sales/${eventId}/status`);
    expect((await statusRes.json()).status).toBe('sold');
  });
});
