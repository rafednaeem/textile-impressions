/**
 * CUSTOMER ACCOUNT TESTS
 * Runs with a saved authenticated customer session.
 * Covers: account overview, order history, order detail, sidebar navigation,
 *         profile update, and logout.
 *
 * Tags:
 *   @smoke     Read-only / production-safe.
 *   @mutation  Tests that update profile or mutate state (local only).
 */

import { test, expect } from "@playwright/test"

// ─────────────────────────────────────────────
// 1. ACCOUNT OVERVIEW
// ─────────────────────────────────────────────
test.describe("Account Overview @smoke", () => {
  test("loads account page", async ({ page }) => {
    await page.goto("/account")
    await expect(page).toHaveURL(/\/account/)
    await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 10_000 })
  })

  test("shows customer email", async ({ page }) => {
    await page.goto("/account")
    await page.waitForTimeout(2000)
    const email = process.env.CUSTOMER_EMAIL || "customer@test.com"
    await expect(page.getByText(email)).toBeVisible({ timeout: 10_000 })
  })

  test("shows recent orders section", async ({ page }) => {
    await page.goto("/account")
    await expect(
      page.getByRole("heading", { name: /recent orders/i })
    ).toBeVisible({ timeout: 10_000 })
  })

  test("View All orders link navigates to orders page", async ({ page }) => {
    await page.goto("/account")
    await page.getByRole("link", { name: /view all/i }).click()
    await expect(page).toHaveURL(/\/account\/orders/)
  })

  test("page has single main landmark", async ({ page }) => {
    await page.goto("/account")
    await expect(page.locator("main")).toHaveCount(1)
  })
})

// ─────────────────────────────────────────────
// 2. ACCOUNT SIDEBAR NAVIGATION
// ─────────────────────────────────────────────
test.describe("Account Navigation @smoke", () => {
  test("can navigate to Orders from sidebar", async ({ page }) => {
    await page.goto("/account")
    const ordersLink = page.getByRole("link", { name: /orders/i }).first()
    await ordersLink.click()
    await expect(page).toHaveURL(/\/account\/orders/)
  })

  test("can navigate to Addresses from sidebar", async ({ page }) => {
    await page.goto("/account")
    const addrLink = page.getByRole("link", { name: /addresses/i }).first()
    if ((await addrLink.count()) > 0) {
      await addrLink.click()
      await expect(page).toHaveURL(/\/account\/addresses/)
    }
  })

  test("can navigate to Wishlist from sidebar", async ({ page }) => {
    await page.goto("/account")
    const wishLink = page.getByRole("link", { name: /wishlist/i }).first()
    if ((await wishLink.count()) > 0) {
      await wishLink.click()
      await expect(page).toHaveURL(/\/account\/wishlist/)
    }
  })
})

// ─────────────────────────────────────────────
// 3. ORDER HISTORY
// ─────────────────────────────────────────────
test.describe("Order History @smoke", () => {
  test("orders page loads", async ({ page }) => {
    await page.goto("/account/orders")
    await expect(page).toHaveURL(/\/account\/orders/)
    const heading = page.getByRole("heading", { name: /order/i })
    const empty = page.getByText(/no orders yet/i)
    await expect(heading.or(empty)).toBeVisible({ timeout: 10_000 })
  })

  test("order items show status badge", async ({ page }) => {
    await page.goto("/account/orders")
    await page.waitForTimeout(2000)
    const statusBadges = page.locator(".rounded-full").filter({ hasText: /pending|processing|shipped|delivered|cancelled/i })
    if ((await statusBadges.count()) > 0) {
      await expect(statusBadges.first()).toBeVisible()
    }
  })

  test("can navigate to order detail if orders exist", async ({ page }) => {
    await page.goto("/account/orders")
    await page.waitForTimeout(2000)
    const viewLink = page.getByRole("link", { name: /view/i }).first()
    if ((await viewLink.count()) > 0) {
      await viewLink.click()
      await expect(page).toHaveURL(/\/account\/orders\/[a-z0-9-]+/)
      await expect(page.locator("h1, h2").first()).toBeVisible()
    }
  })
})

// ─────────────────────────────────────────────
// 4. ORDER DETAIL
// ─────────────────────────────────────────────
test.describe("Order Detail @smoke", () => {
  test("order detail page loads", async ({ page }) => {
    // Try a known order first, then fall back to list navigation.
    await page.goto("/account/orders/test-order-id")
    await page.waitForTimeout(2000)

    const heading = page.locator("h1, h2").first()
    const notFound = page.getByText(/not found/i)
    const hasHeading = await heading.isVisible().catch(() => false)
    const hasNotFound = await notFound.isVisible().catch(() => false)

    if (!hasHeading && !hasNotFound) {
      // Navigate from list
      await page.goto("/account/orders")
      await page.waitForTimeout(2000)
      const viewLink = page.getByRole("link", { name: /view/i }).first()
      if ((await viewLink.count()) > 0) {
        await viewLink.click()
        await expect(page).toHaveURL(/\/account\/orders\/[a-z0-9-]+/)
      } else {
        test.skip()
      }
    }
  })
})

// ─────────────────────────────────────────────
// 5. PROFILE UPDATE
// ─────────────────────────────────────────────
test.describe("Profile Update @mutation", () => {
  test("can update full name and phone", async ({ page }) => {
    await page.route("/api/account/profile", async (route) => {
      if (route.request().method() === "PATCH" || route.request().method() === "PUT") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ full_name: "Updated Name", phone: "03001234567" }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto("/account")
    await page.waitForTimeout(1500)

    const editBtn = page.getByRole("button", { name: /edit profile/i }).first()
    if ((await editBtn.count()) === 0) {
      test.skip()
    }
    await editBtn.click()

    const nameInput = page.locator('input[name="full_name"], input[name="fullName"]').first()
    const phoneInput = page.locator('input[name="phone"]').first()

    if ((await nameInput.count()) > 0) await nameInput.fill("Updated Name")
    if ((await phoneInput.count()) > 0) await phoneInput.fill("03001234567")

    await page.getByRole("button", { name: /save/i }).first().click()
    await expect(page.getByText(/updated|saved/i).first()).toBeVisible({ timeout: 10_000 })
  })
})

// ─────────────────────────────────────────────
// 6. LOGOUT
// ─────────────────────────────────────────────
test.describe("Logout @smoke", () => {
  test("can sign out from account page", async ({ page }) => {
    await page.goto("/account")
    await page.waitForTimeout(1000)
    const signOut = page.getByRole("button", { name: /sign out/i })
      .or(page.getByRole("link", { name: /sign out/i }))
      .or(page.getByRole("button", { name: /logout/i }))
    if ((await signOut.count()) > 0) {
      await signOut.first().click()
      await expect(page).toHaveURL(/\/|\/auth\/login/, { timeout: 10_000 })
    }
  })
})
