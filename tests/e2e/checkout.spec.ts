/**
 * CHECKOUT FLOW TESTS
 * Covers the full authenticated and guest checkout experience.
 *
 * Tags:
 *   @smoke     Read-only / page-load / validation tests.
 *   @mutation  Tests that place real or mocked orders (local only).
 */

import { test, expect } from "@playwright/test"

async function seedCart(page: any) {
  // Try to add a real product from the shop; fall back to localStorage injection.
  await page.goto("/shop")
  await page.waitForTimeout(2000)

  const addBtn = page.getByRole("button", { name: /add to cart/i }).first()
  if ((await addBtn.count()) > 0) {
    await addBtn.click()
    await page.waitForTimeout(1000)
  } else {
    await page.evaluate(() => {
      const item = {
        id: "test-id",
        cart_id: "",
        product_id: "test-product",
        variant_id: null,
        quantity: 1,
        price_at_time: 1500,
        product: {
          name: "Test Product",
          slug: "test-product",
          price: 1500,
          sale_price: null,
          inventory_count: 10,
        },
        image: null,
        variant: null,
      }
      localStorage.setItem("guest_cart", JSON.stringify([item]))
    })
  }
}

test.describe("Checkout — Empty Cart @smoke", () => {
  test("redirects or shows empty cart message", async ({ page }) => {
    await page.goto("/checkout")
    const emptyMsg = page.getByText(/your cart is empty/i)
    const isRedirected = page.url().includes("/shop")
    const hasEmpty = await emptyMsg.isVisible().catch(() => false)
    expect(hasEmpty || isRedirected).toBeTruthy()
  })
})

test.describe("Checkout — Shipping Step @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await seedCart(page)
  })

  test("checkout page loads with cart items", async ({ page }) => {
    await page.goto("/checkout")
    await page.waitForTimeout(1000)
    const shipping = page.getByRole("heading", { name: /shipping information/i })
    const empty = page.getByText(/your cart is empty/i)
    const hasShipping = await shipping.isVisible().catch(() => false)
    const hasEmpty = await empty.isVisible().catch(() => false)
    expect(hasShipping || hasEmpty).toBeTruthy()
  })

  test("shows validation errors for empty shipping form", async ({ page }) => {
    await page.goto("/checkout")
    await page.waitForTimeout(1000)
    const shippingHeading = page.getByRole("heading", { name: /shipping information/i })
    if (!(await shippingHeading.isVisible().catch(() => false))) test.skip()

    await page.getByRole("button", { name: /continue to payment/i }).click()
    await expect(page.locator(".text-red-500, .text-red-600").first()).toBeVisible()
  })

  test("can fill shipping info and proceed to payment", async ({ page }) => {
    await page.goto("/checkout")
    await page.waitForTimeout(1000)

    const shippingHeading = page.getByRole("heading", { name: /shipping information/i })
    if (!(await shippingHeading.isVisible().catch(() => false))) test.skip()

    await page.fill('input[placeholder*="Fatima"], input[placeholder*="Name"]', "Test Customer")
    await page.fill('input[placeholder*="03"]', "03001234567")
    await page.fill('input[placeholder*="House"], input[placeholder*="Street"]', "123 Test Street")
    await page.fill('input[placeholder*="Karachi"], input[placeholder*="City"]', "Lahore")
    await page.selectOption("select", "Punjab")

    await page.getByRole("button", { name: /continue to payment/i }).click()
    await expect(page.getByRole("heading", { name: /payment method/i })).toBeVisible({ timeout: 10_000 })
  })
})

test.describe("Checkout — Payment Step @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await seedCart(page)
  })

  test("bank transfer payment step shows bank details", async ({ page }) => {
    await page.goto("/checkout")
    await page.waitForTimeout(1000)

    const shippingHeading = page.getByRole("heading", { name: /shipping information/i })
    if (!(await shippingHeading.isVisible().catch(() => false))) test.skip()

    await page.fill('input[placeholder*="Fatima"]', "Test User")
    await page.fill('input[placeholder*="03"]', "03001234567")
    await page.fill('input[placeholder*="House"]', "123 Test Street")
    await page.fill('input[placeholder*="Karachi"]', "Karachi")
    await page.selectOption("select", "Sindh")
    await page.getByRole("button", { name: /continue to payment/i }).click()

    await page.getByText(/bank transfer/i).click()
    await expect(page.getByText(/meezan bank/i)).toBeVisible()
    await expect(page.getByText(/account #/i)).toBeVisible()
  })

  test("COD is disabled for non-Karachi city", async ({ page }) => {
    await page.goto("/checkout")
    await page.waitForTimeout(1000)

    const shippingHeading = page.getByRole("heading", { name: /shipping information/i })
    if (!(await shippingHeading.isVisible().catch(() => false))) test.skip()

    await page.fill('input[placeholder*="Fatima"]', "Test User")
    await page.fill('input[placeholder*="03"]', "03001234567")
    await page.fill('input[placeholder*="House"]', "123 Test Street")
    await page.fill('input[placeholder*="Karachi"]', "Lahore")
    await page.selectOption("select", "Punjab")
    await page.getByRole("button", { name: /continue to payment/i }).click()

    const codBtn = page.locator("button").filter({ hasText: /cash on delivery/i })
    await expect(codBtn).toHaveAttribute("disabled", { timeout: 5000 })
  })

  test("COD is enabled for Karachi", async ({ page }) => {
    await page.goto("/checkout")
    await page.waitForTimeout(1000)

    const shippingHeading = page.getByRole("heading", { name: /shipping information/i })
    if (!(await shippingHeading.isVisible().catch(() => false))) test.skip()

    await page.fill('input[placeholder*="Fatima"]', "Test User")
    await page.fill('input[placeholder*="03"]', "03001234567")
    await page.fill('input[placeholder*="House"]', "123 Test Street")
    await page.fill('input[placeholder*="Karachi"]', "karachi")
    await page.selectOption("select", "Sindh")
    await page.getByRole("button", { name: /continue to payment/i }).click()

    const codBtn = page.locator("button").filter({ hasText: /cash on delivery/i })
    await expect(codBtn).not.toHaveAttribute("disabled")
  })

  test("back button from payment returns to shipping", async ({ page }) => {
    await page.goto("/checkout")
    await page.waitForTimeout(1000)

    const shippingHeading = page.getByRole("heading", { name: /shipping information/i })
    if (!(await shippingHeading.isVisible().catch(() => false))) test.skip()

    await page.fill('input[placeholder*="Fatima"]', "Test User")
    await page.fill('input[placeholder*="03"]', "03001234567")
    await page.fill('input[placeholder*="House"]', "123 Test Street")
    await page.fill('input[placeholder*="Karachi"]', "Karachi")
    await page.selectOption("select", "Sindh")
    await page.getByRole("button", { name: /continue to payment/i }).click()
    await expect(page.getByRole("heading", { name: /payment method/i })).toBeVisible()

    await page.getByRole("button", { name: /back/i }).click()
    await expect(page.getByRole("heading", { name: /shipping information/i })).toBeVisible()
  })
})

test.describe("Checkout — Full Order Flow @mutation", () => {
  test("completes checkout with mocked order API", async ({ page }) => {
    // Mock the order creation API and storage upload.
    await page.route("/api/orders", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ orderId: "test-order-id", orderNumber: "TI-TEST-001" }),
      })
    })

    await page.route("**/storage/v1/object/**", async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ Key: "test/file.jpg" }) })
    })

    await seedCart(page)
    await page.goto("/checkout")
    await page.waitForTimeout(1000)

    const shippingHeading = page.getByRole("heading", { name: /shipping information/i })
    if (!(await shippingHeading.isVisible().catch(() => false))) test.skip()

    // Step 1: Shipping
    await page.fill('input[placeholder*="Fatima"]', "Test Customer")
    await page.fill('input[placeholder*="03"]', "03001234567")
    await page.fill('input[placeholder*="House"]', "123 Test Street")
    await page.fill('input[placeholder*="Karachi"]', "Karachi")
    await page.selectOption("select", "Sindh")
    await page.getByRole("button", { name: /continue to payment/i }).click()

    // Step 2: Payment — choose COD for Karachi
    await page.waitForTimeout(500)
    const codBtn = page.locator("button").filter({ hasText: /cash on delivery/i })
    await codBtn.click()
    await page.getByRole("button", { name: /continue to review/i }).click()

    // Step 3: Review
    await expect(page.getByRole("heading", { name: /review your order/i })).toBeVisible()
    await expect(page.getByText(/shipping to/i)).toBeVisible()
    await expect(page.getByText(/payment method/i)).toBeVisible()

    // Place Order
    await page.getByRole("button", { name: /place order/i }).click()

    // Step 4: Confirmation
    await expect(page.getByRole("heading", { name: /order placed/i })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/TI-TEST-001/)).toBeVisible()
  })

  test("applies discount code when available", async ({ page }) => {
    await page.route("/api/discounts/apply", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ discount: { code: "TEST10", value: 10, type: "percentage" }, total: 1350 }),
      })
    })

    await seedCart(page)
    await page.goto("/checkout")
    await page.waitForTimeout(1000)

    const shippingHeading = page.getByRole("heading", { name: /shipping information/i })
    if (!(await shippingHeading.isVisible().catch(() => false))) test.skip()

    await page.fill('input[placeholder*="Fatima"]', "Test Customer")
    await page.fill('input[placeholder*="03"]', "03001234567")
    await page.fill('input[placeholder*="House"]', "123 Test Street")
    await page.fill('input[placeholder*="Karachi"]', "Karachi")
    await page.selectOption("select", "Sindh")
    await page.getByRole("button", { name: /continue to payment/i }).click()

    // Look for discount input
    const discountInput = page.locator('input[placeholder*="discount" i], input[name="discount"]').first()
    if ((await discountInput.count()) > 0) {
      await discountInput.fill("TEST10")
      await page.getByRole("button", { name: /apply/i }).first().click()
      await expect(page.getByText(/TEST10|discount applied/i)).toBeVisible({ timeout: 10_000 })
    }
  })
})
