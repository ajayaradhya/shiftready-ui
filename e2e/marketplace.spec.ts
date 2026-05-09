import { test, expect } from "@playwright/test";

test.describe("Marketplace (public)", () => {
  test("marketplace page is publicly accessible", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(page.getByRole("heading", { name: /marketplace/i })).toBeVisible();
  });

  test("marketplace has search input", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(page.getByRole("searchbox")).toBeVisible();
  });
});
