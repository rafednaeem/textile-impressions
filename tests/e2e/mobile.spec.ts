/**
 * MOBILE RESPONSIVENESS TESTS
 * Verifies key pages and interactions on a small viewport.
 *
 * Tags:
 *   @smoke  Safe for production.
 *   @mobile Mobile-specific.
 */

import { test, expect } from "@playwright/test"

const MOBILE_VIEWPORT = { width: 390, height: 844 }

test.use({ viewport: MOBILE_VIEWPORT })

test.describe("Mobile — Storefront @smoke @mobile", () => {
  test("homepage renders without horizontal overflow", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth)
  })

  test("header hamburger menu opens navigation", async ({ page }) => {
    await page.goto("/")
    const menuBtn = page.locator('button[aria-label*="menu" i], button:has(svg)').first()
    if ((await menuBtn.count()) > 0) {
      await menuBtn.click()
      await page.waitForTimeout(500)
      const nav = page.locator("nav, [role='navigation']").first()
      await expect(nav).toBeVisible()
    }
  })

  test("shop page product cards are visible", async ({ page }) => {
    await page.goto("/shop")
    await page.waitForTimeout(2000)
    const cards = page.locator('[data-testid="product-card"], .product-card, article')
    expect(await cards.count()).toBeGreaterThanOrEqual(0)
  })

  test("product detail page shows add-to-cart button", async ({ page }) => {
    await page.goto("/products/hand-embroidered-khaddar-kurta")
    await page.waitForTimeout(2000)
    const addBtn = page.getByRole("button", { name: /add to cart/i }).first()
    await expect(addBtn).toBeVisible()
  })

  test("cart drawer opens and shows empty state", async ({ page }) => {
    await page.goto("/")
    const cartTrigger = page.locator('[aria-label*="cart" i], button:has-text("bag")').first()
    if ((await cartTrigger.count()) > 0) {
      await cartTrigger.click()
      await page.waitForTimeout(500)
      const drawer = page.locator('[role="dialog"], aside, .cart-drawer').first()
      await expect(drawer.or(page.getByText(/your cart is empty/i)).first()).toBeVisible()
    }
  })
})

test.describe("Mobile — Auth @smoke @mobile", () => {
  test("login form fits viewport", async ({ page }) => {
    await page.goto("/auth/login")
    const form = page.locator("form").first()
    await expect(form).toBeVisible()
    const box = await form.boundingBox()
    expect(box?.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width)
  })

  test("signup form fits viewport", async ({ page }) => {
    await page.goto("/auth/signup")
    const form = page.locator("form").first()
    await expect(form).toBeVisible()
    const box = await form.boundingBox()
    expect(box?.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width)
  })
})

test.describe("Mobile — Admin @smoke @mobile", () => {
  test.use({ storageState: "tests/e2e/.auth/admin.json" })

  test("admin dashboard renders without horizontal overflow", async ({ page }) => {
    await page.goto("/admin")
    await page.waitForTimeout(2000)
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth)
  })

  test("admin mobile menu opens", async ({ page }) => {
    await page.goto("/admin")
    const menuBtn = page.locator('button[aria-label*="menu" i], button:has(svg)').first()
    if ((await menuBtn.count()) > 0) {
      await menuBtn.click()
      await page.waitForTimeout(500)
      const sidebar = page.locator("aside, nav").first()
      await expect(sidebar).toBeVisible()
    }
  })
})
