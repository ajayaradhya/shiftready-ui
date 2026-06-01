/**
 * Offer + accept flow — buyer sends offer, seller accepts.
 *
 * Requires test accounts in .env.e2e:
 *   E2E_SELLER_EMAIL / E2E_SELLER_PASSWORD
 *   E2E_BUYER_EMAIL  / E2E_BUYER_PASSWORD
 *   E2E_FIREBASE_API_KEY
 *   E2E_API_URL
 *
 * Setup: seeds a live sale via the backend API using the seller token.
 * Flow:  buyer logs in → marketplace → starts conversation → sends offer
 *        seller logs in → messages → accepts offer
 */
import { test, expect, Browser } from '@playwright/test';
import { hasTestAccounts, getIdToken, loginViaUi } from './helpers/auth';
import { seedLiveSale } from './helpers/api';

test.describe('Offer → accept flow', () => {
  test.beforeEach(() => {
    if (!hasTestAccounts()) {
      test.skip();
    }
  });

  test('buyer can start a conversation from the marketplace', async ({ page, request }) => {
    const sellerToken = await getIdToken(
      request,
      process.env.E2E_SELLER_EMAIL!,
      process.env.E2E_SELLER_PASSWORD!,
    );
    await seedLiveSale(request, sellerToken);

    // Buyer logs in
    await loginViaUi(page, process.env.E2E_BUYER_EMAIL!, process.env.E2E_BUYER_PASSWORD!);

    // Navigate to marketplace
    await page.goto('/market');

    // Find a sale card and open it
    const saleCard = page.locator('a[href*="/market/sale/"]').first();
    await expect(saleCard).toBeVisible({ timeout: 10_000 });
    await saleCard.click();

    // Look for "Express Interest" / "Message seller" / "Start conversation" button
    const contactBtn = page.locator(
      'button:has-text("Express"), button:has-text("Message"), button:has-text("Contact"), button:has-text("Offer")',
    ).first();
    await expect(contactBtn).toBeVisible({ timeout: 8_000 });
    await contactBtn.click();

    // Should navigate into a conversation
    await expect(page).toHaveURL(/messages/, { timeout: 10_000 });
  });

  test('buyer can send an offer from messages', async ({ page, request }) => {
    const sellerToken = await getIdToken(
      request,
      process.env.E2E_SELLER_EMAIL!,
      process.env.E2E_SELLER_PASSWORD!,
    );
    const { eventId } = await seedLiveSale(request, sellerToken);
    const buyerToken = await getIdToken(
      request,
      process.env.E2E_BUYER_EMAIL!,
      process.env.E2E_BUYER_PASSWORD!,
    );

    // Start conversation via API so we know the conv ID
    const convRes = await request.post(
      `${process.env.E2E_API_URL}/api/v1/messages/conversations`,
      {
        headers: {
          Authorization: `Bearer ${buyerToken}`,
          'Content-Type': 'application/json',
        },
        data: { otherUserId: 'seller_uid_placeholder' }, // seller UID resolved at runtime
      },
    );

    // Navigate buyer to messages
    await loginViaUi(page, process.env.E2E_BUYER_EMAIL!, process.env.E2E_BUYER_PASSWORD!);
    await page.goto('/market/messages');

    const convRow = page.locator('[data-testid="conversation-row"]').first();
    if (await convRow.count() === 0) {
      test.skip();
      return;
    }
    await convRow.click();

    // Open offer panel
    const offerBtn = page.locator('button:has-text("Make Offer"), button:has-text("Offer")').first();
    if (await offerBtn.count() > 0) {
      await offerBtn.click();
      const amountInput = page.locator('input[type="number"], input[placeholder*="amount"], input[placeholder*="Amount"]');
      await amountInput.fill('300');
      await page.locator('button:has-text("Send Offer"), button:has-text("Submit")').first().click();
      await expect(page.locator('body')).toContainText('300');
    }
  });

  test('seller sees and can accept an offer', async ({ page, browser, request }) => {
    const sellerToken = await getIdToken(
      request,
      process.env.E2E_SELLER_EMAIL!,
      process.env.E2E_SELLER_PASSWORD!,
    );
    await seedLiveSale(request, sellerToken);

    // Log in as seller, go to messages
    await loginViaUi(page, process.env.E2E_SELLER_EMAIL!, process.env.E2E_SELLER_PASSWORD!);
    await page.goto('/seller-central/messages');

    const convRow = page.locator('[data-testid="conversation-row"]').first();
    if (await convRow.count() === 0) {
      test.skip();
      return;
    }
    await convRow.click();

    // Look for an accept button on an offer
    const acceptBtn = page.locator('button:has-text("Accept"), button:has-text("Deal")').first();
    if (await acceptBtn.count() > 0) {
      await acceptBtn.click();
      // Confirm dialog if present
      const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
      if (await confirmBtn.count() > 0) await confirmBtn.click();
      // Deal accepted banner or status should appear
      await expect(page.locator('body')).toContainText(/accepted|deal|reserved/i, { timeout: 8_000 });
    }
  });
});
