import { APIRequestContext, Page } from '@playwright/test';

/** Sign in via Firebase Auth REST API and return the idToken. */
export async function getIdToken(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const apiKey = process.env.E2E_FIREBASE_API_KEY;
  if (!apiKey) throw new Error('E2E_FIREBASE_API_KEY not set');

  const res = await request.post(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    { data: { email, password, returnSecureToken: true } },
  );
  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`Firebase sign-in failed (${res.status()}): ${body}`);
  }
  const body = await res.json();
  return body.idToken as string;
}

/** Log in via the UI login page. Redirects to /seller-central on success. */
export async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('#si-email', email);
  await page.fill('#si-pass', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/seller-central', { timeout: 15_000 });
}

/** Returns true if both seller + buyer env vars are configured. */
export function hasTestAccounts(): boolean {
  return !!(
    process.env.E2E_SELLER_EMAIL &&
    process.env.E2E_SELLER_PASSWORD &&
    process.env.E2E_BUYER_EMAIL &&
    process.env.E2E_BUYER_PASSWORD
  );
}
