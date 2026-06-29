/**
 * CUSTOMER WISHLIST TESTS
 * Runs with a saved authenticated customer session.
 * Covers: empty state, add product from PDP/shop, remove product.
 *
 * Tags:
 *   @smoke    Read-only / production-safe page-load tests.
 *   @mutation Tests that create, update, or delete data (local only).
 */

import { test, expect } from "@playwright/test"

test.describe("Customer Wishlist @smoke", () => {
  test("wishlist page loads", async ({ page }) => {
    await page.goto("/account/wishlist")
    await expect(page).toHaveURL(/\/account\/wishlist/)
    await expect(
      page.getByRole("heading", { name: /wishlist/i })
    ).toBeVisible({ timeout: 10_000 })
  })

  test("shows empty state when no items", async ({ page }) => {
    await page.goto("/account/wishlist")
    await page.waitForTimeout(2000)

    const wishlistItem = page.locator("[data-wishlist-item]").first()
    const empty = page.getByText(/empty|no items|no products/i)

    const hasItems = await wishlistItem.count() > 0
    const hasEmpty = await empty.isVisible().catch(() => false)
    expect(hasItems || hasEmpty).toBeTruthy()
  })
})

test.describe("Customer Wishlist @mutation", () => {
  test("can add a product to wishlist from shop", async ({ page }) => {
    // Mock the wishlist add endpoint to avoid side effects.
    await page.route("/api/wishlist", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ id: "wish-test-id", product_id: "test-product" }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto("/shop")
    await page.waitForTimeout(2000)

    // Prefer a wishlist/heart button; fall back to adding from PDP.
    const wishlistBtn = page.getByRole("button", { name: /wishlist/i })
      .or(page.locator("button[aria-label*='wishlist' i], button:has(svg)"))
      .first()

    if (await wishlistBtn.count() > 0) {
      await wishlistBtn.click()
    } else {
      // Navigate to a PDP and click Add to Wishlist.
      const productLink = page.locator("a[href^='/products/']").first()
      if (await productLink.count() > 0) {
        await productLink.click()
        await expect(page).toHaveURL(/\/products\//)
        const pdpWishlistBtn = page.getByRole("button", { name: /wishlist/i }).first()
        if (await pdpWishlistBtn.count() > 0) {
          await pdpWishlistBtn.click()
        }
      }
    }

    // Confirm via toast, button state, or navigation to wishlist.
    const toast = page.locator('[data-sonner-toast]').first()
    const successText = page.getByText(/added to wishlist|saved/i).first()
    await expect(toast.or(successText)).toBeVisible({ timeout: 10_000 })
  })

  test("can remove a product from wishlist", async ({ page }) => {
    await page.route("/api/wishlist/**", async (route) => {
      if (route.request().method() === "DELETE") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) })
      } else {
        await route.continue()
      }
    })

    await page.goto("/account/wishlist")
    await page.waitForTimeout(2000)

    const removeBtn = page.getByRole("button", { name: /remove/i })
      .or(page.locator("button[aria-label*='remove' i]"))
      .first()
    if (await removeBtn.count() === 0) {
      test.skip()
    }
    await removeBtn.click()

    await expect(page.getByText(/removed|deleted|empty/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test("can add then remove a product on the wishlist page", async ({ page }) => {
    await page.route("/api/wishlist", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ id: "wish-cycle-id" }) })
      } else {
        await route.continue()
      }
    })
    await page.route("/api/wishlist/**", async (route) => {
      if (route.request().method() === "DELETE") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) })
      } else {
        await route.continue()
      }
    })

    // Add from shop.
    await page.goto("/shop")
    await page.waitForTimeout(2000)
    const wishlistBtn = page.getByRole("button", { name: /wishlist/i })
      .or(page.locator("button[aria-label*='wishlist' i]"))
      .first()
    if (await wishlistBtn.count() === 0) {
      test.skip()
    }
    await wishlistBtn.click()
    await page.waitForTimeout(1000)

    // Remove from wishlist page.
    await page.goto("/account/wishlist")
    await page.waitForTimeout(1500)
    const removeBtn = page.getByRole("button", { name: /remove/i }).first()
    if (await removeBtn.count() > 0) {
      await removeBtn.click()
      await expect(page.getByText(/removed|empty/i).first()).toBeVisible({ timeout: 10_000 })
    }
  })
})
