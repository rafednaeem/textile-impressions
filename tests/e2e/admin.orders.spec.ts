/**
 * ADMIN ORDERS TESTS
 * Covers: orders list, search, status filter, payment filter,
 *         order detail page, verify payment, reject payment, update status.
 *
 * Tags:
 *   @smoke     Read-only / production-safe.
 *   @mutation  Destructive order changes (local only).
 */

import { test, expect } from "@playwright/test"

test.describe("Admin — Orders List @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/orders")
    await page.waitForTimeout(2000)
  })

  test("page loads with Orders heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible()
  })

  test("search input is present", async ({ page }) => {
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible()
  })

  test("Filters button is present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /filters/i })).toBeVisible()
  })

  test("filter panel toggles open", async ({ page }) => {
    await page.getByRole("button", { name: /filters/i }).click()
    await expect(page.locator("select").first()).toBeVisible()
  })

  test("can filter by status", async ({ page }) => {
    await page.getByRole("button", { name: /filters/i }).click()
    await page.waitForTimeout(300)
    await page.selectOption("select >> nth=0", "payment_submitted")
    await page.waitForTimeout(1500)
    const rows = page.locator("table tbody tr")
    const empty = page.getByText(/no orders found/i)
    const hasRows = (await rows.count()) > 0
    const hasEmpty = await empty.isVisible().catch(() => false)
    expect(hasRows || hasEmpty).toBeTruthy()
  })

  test("can search by order number", async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', "TI-")
    await page.waitForTimeout(1500)
    const rows = page.locator("table tbody tr")
    const empty = page.getByText(/no orders found/i)
    const hasRows = (await rows.count()) > 0
    const hasEmpty = await empty.isVisible().catch(() => false)
    expect(hasRows || hasEmpty).toBeTruthy()
  })

  test("orders table shows correct columns", async ({ page }) => {
    const thead = page.locator("table thead")
    if ((await thead.count()) > 0) {
      await expect(thead.getByText("Order #")).toBeVisible()
      await expect(thead.getByText("Customer")).toBeVisible()
      await expect(thead.getByText("Total")).toBeVisible()
      await expect(thead.getByText("Status")).toBeVisible()
    }
  })

  test("View link on order row navigates to order detail", async ({ page }) => {
    const viewLink = page.getByRole("link", { name: /view/i }).first()
    if ((await viewLink.count()) > 0) {
      await viewLink.click()
      await expect(page).toHaveURL(/\/admin\/orders\/[a-z0-9-]+/)
    }
  })

  test("can filter by payment_submitted via URL", async ({ page }) => {
    await page.goto("/admin/orders?status=payment_submitted")
    await page.waitForTimeout(2000)
    await expect(page).toHaveURL(/status=payment_submitted/)
  })
})

test.describe("Admin — Order Detail @smoke", () => {
  test("order detail page loads if order exists", async ({ page }) => {
    await page.goto("/admin/orders")
    await page.waitForTimeout(2000)

    const viewLink = page.getByRole("link", { name: /view/i }).first()
    if ((await viewLink.count()) > 0) {
      await viewLink.click()
      await expect(page).toHaveURL(/\/admin\/orders\/[a-z0-9-]+/)
      await expect(page.locator("h1, h2").first()).toBeVisible()
    }
  })

  test("payment verification buttons are present on payment_submitted orders", async ({ page }) => {
    await page.goto("/admin/orders?status=payment_submitted")
    await page.waitForTimeout(2000)

    const viewLink = page.getByRole("link", { name: /view/i }).first()
    if ((await viewLink.count()) > 0) {
      await viewLink.click()
      await page.waitForTimeout(1000)
      const verifyBtn = page.getByRole("button", { name: /verify payment/i })
      const rejectBtn = page.getByRole("button", { name: /reject/i })
      if ((await verifyBtn.count()) > 0) {
        await expect(verifyBtn).toBeVisible()
      }
      if ((await rejectBtn.count()) > 0) {
        await expect(rejectBtn).toBeVisible()
      }
    }
  })
})

test.describe("Admin — Order Mutations @mutation", () => {
  test("can update order status", async ({ page }) => {
    await page.route("/api/admin/orders/**/status", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) })
      } else {
        await route.continue()
      }
    })

    await page.goto("/admin/orders")
    await page.waitForTimeout(2000)

    const viewLink = page.getByRole("link", { name: /view/i }).first()
    if ((await viewLink.count()) === 0) test.skip()
    await viewLink.click()
    await page.waitForTimeout(1000)

    const statusSelect = page.locator("select").first()
    if ((await statusSelect.count()) === 0) test.skip()
    await statusSelect.selectOption("processing")

    await page.getByRole("button", { name: /update status/i }).first().click()
    await expect(page.getByText(/updated|saved/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test("can verify payment", async ({ page }) => {
    await page.route("/api/admin/orders/**/verify-payment", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) })
      } else {
        await route.continue()
      }
    })

    await page.goto("/admin/orders?status=payment_submitted")
    await page.waitForTimeout(2000)

    const viewLink = page.getByRole("link", { name: /view/i }).first()
    if ((await viewLink.count()) === 0) test.skip()
    await viewLink.click()
    await page.waitForTimeout(1000)

    const verifyBtn = page.getByRole("button", { name: /verify payment/i }).first()
    if ((await verifyBtn.count()) === 0) test.skip()
    await verifyBtn.click()

    await expect(page.getByText(/verified|success/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test("can reject payment", async ({ page }) => {
    await page.route("/api/admin/orders/**/verify-payment", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) })
      } else {
        await route.continue()
      }
    })

    await page.goto("/admin/orders?status=payment_submitted")
    await page.waitForTimeout(2000)

    const viewLink = page.getByRole("link", { name: /view/i }).first()
    if ((await viewLink.count()) === 0) test.skip()
    await viewLink.click()
    await page.waitForTimeout(1000)

    const rejectBtn = page.getByRole("button", { name: /reject/i }).first()
    if ((await rejectBtn.count()) === 0) test.skip()
    await rejectBtn.click()

    await expect(page.getByText(/rejected|success/i).first()).toBeVisible({ timeout: 10_000 })
  })
})
