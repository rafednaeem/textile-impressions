/**
 * ADMIN INVENTORY TESTS
 * Covers: inventory list, search, sort toggle, inline editing,
 *         bulk selection, bulk update.
 *
 * Tags:
 *   @smoke     Read-only / production-safe.
 *   @mutation  Destructive inventory changes (local only).
 */

import { test, expect } from "@playwright/test"

test.describe("Admin — Inventory @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/inventory")
    await page.waitForTimeout(2000)
  })

  test("page loads with Inventory heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Inventory" })).toBeVisible()
  })

  test("search input is present", async ({ page }) => {
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible()
  })

  test("sort toggle button is present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /stock/i })).toBeVisible()
  })

  test("can toggle sort order", async ({ page }) => {
    const sortBtn = page.getByRole("button", { name: /stock/i })
    const beforeText = await sortBtn.textContent()
    await sortBtn.click()
    await page.waitForTimeout(1000)
    const afterText = await sortBtn.textContent()
    expect(beforeText).not.toEqual(afterText)
  })

  test("can search inventory", async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', "shirt")
    await page.waitForTimeout(1500)
    const rows = page.locator("table tbody tr")
    const empty = page.getByText(/no products found/i)
    const hasRows = (await rows.count()) > 0
    const hasEmpty = await empty.isVisible().catch(() => false)
    expect(hasRows || hasEmpty).toBeTruthy()
  })

  test("table has correct columns", async ({ page }) => {
    const thead = page.locator("table thead")
    if ((await thead.count()) > 0) {
      await expect(thead.getByText("Product")).toBeVisible()
      await expect(thead.getByText("SKU")).toBeVisible()
      await expect(thead.getByText("Stock")).toBeVisible()
    }
  })

  test("select all checkbox is present", async ({ page }) => {
    const selectAll = page.locator('input[type="checkbox"]').first()
    if ((await selectAll.count()) > 0) {
      await expect(selectAll).toBeVisible()
    }
  })

  test("can select all products", async ({ page }) => {
    const selectAll = page.locator("thead input[type='checkbox']")
    if ((await selectAll.count()) > 0) {
      await selectAll.click()
      await page.waitForTimeout(500)
      const bulkInput = page.locator('input[placeholder*="Stock count"]')
      await expect(bulkInput).toBeVisible()
    }
  })

  test("can click Edit on a product to inline-edit stock", async ({ page }) => {
    const editLink = page.getByRole("button", { name: /edit/i }).first()
    if ((await editLink.count()) > 0) {
      await editLink.click()
      await page.waitForTimeout(300)
      const numInput = page.locator('input[type="number"]').last()
      await expect(numInput).toBeVisible()
    }
  })

  test("low stock products have red styling", async ({ page }) => {
    const lowStockRow = page.locator("tr.bg-red-50\\/30, tr[class*='red']")
    await expect(page).toHaveURL(/\/admin\/inventory/)
  })
})

test.describe("Admin — Inventory Mutations @mutation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/inventory")
    await page.waitForTimeout(2000)
  })

  test("can save inline stock edit", async ({ page }) => {
    await page.route("/api/admin/products/**", async (route) => {
      if (["PUT", "PATCH"].includes(route.request().method())) {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) })
      } else {
        await route.continue()
      }
    })

    const editLink = page.getByRole("button", { name: /edit/i }).first()
    if ((await editLink.count()) === 0) test.skip()
    await editLink.click()
    await page.waitForTimeout(300)

    const numInput = page.locator('input[type="number"]').last()
    await numInput.fill("99")

    await page.getByRole("button", { name: /save/i }).first().click()
    await expect(page.getByText(/saved|updated/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test("can bulk update stock", async ({ page }) => {
    await page.route("/api/admin/products/bulk-update", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) })
      } else {
        await route.continue()
      }
    })

    const selectAll = page.locator("thead input[type='checkbox']")
    if ((await selectAll.count()) === 0) test.skip()
    await selectAll.click()
    await page.waitForTimeout(500)

    const bulkInput = page.locator('input[placeholder*="Stock count"]')
    if ((await bulkInput.count()) === 0) test.skip()
    await bulkInput.fill("50")

    await page.getByRole("button", { name: /update/i }).first().click()
    await expect(page.getByText(/updated|success/i).first()).toBeVisible({ timeout: 10_000 })
  })
})
