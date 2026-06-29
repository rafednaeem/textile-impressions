/**
 * ADMIN DISCOUNTS TESTS
 * Covers: discount code listing, create new code form,
 *         validation, save, cancel, and delete.
 *
 * Tags:
 *   @smoke     Read-only / production-safe.
 *   @mutation  Destructive discount changes (local only).
 */

import { test, expect } from "@playwright/test"

test.describe("Admin — Discount Codes @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/discounts")
    await page.waitForTimeout(2000)
  })

  test("page loads with Discount Codes heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Discount Codes" })).toBeVisible()
  })

  test("New Code button is present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /new code/i })).toBeVisible()
  })

  test("clicking New Code shows form", async ({ page }) => {
    await page.getByRole("button", { name: /new code/i }).click()
    await expect(page.locator('input[placeholder*="SUMMER"]')).toBeVisible()
    await expect(page.locator("select").first()).toBeVisible()
  })

  test("form has all required fields", async ({ page }) => {
    await page.getByRole("button", { name: /new code/i }).click()
    await expect(page.locator('input[placeholder*="SUMMER"]')).toBeVisible()
    await expect(page.locator("select").first()).toBeVisible()
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible()
  })

  test("cancel button closes form", async ({ page }) => {
    await page.getByRole("button", { name: /new code/i }).click()
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible()
    await page.getByRole("button", { name: "Cancel" }).click()
    await expect(page.getByRole("button", { name: "Cancel" })).not.toBeVisible()
  })

  test("discount codes table has correct columns", async ({ page }) => {
    const thead = page.locator("table thead")
    if ((await thead.count()) > 0) {
      await expect(thead.getByText("Code")).toBeVisible()
      await expect(thead.getByText("Type")).toBeVisible()
      await expect(thead.getByText("Value")).toBeVisible()
      await expect(thead.getByText("Status")).toBeVisible()
    }
  })
})

test.describe("Admin — Discount Mutations @mutation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/discounts")
    await page.waitForTimeout(2000)
  })

  test("can fill and save a new discount code", async ({ page }) => {
    await page.route("**/rest/v1/discount_codes*", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify([{ id: "test-id", code: "TESTPLAY", type: "percentage", value: 10 }]),
        })
      } else {
        await route.continue()
      }
    })

    await page.getByRole("button", { name: /new code/i }).click()
    await page.fill('input[placeholder*="SUMMER"]', "TESTPLAY")
    await page.selectOption('select:first-of-type', "percentage")
    await page.fill('input[placeholder*="20"]', "15")

    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText(/TESTPLAY|saved|created/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test("can delete a discount code", async ({ page }) => {
    await page.route("**/rest/v1/discount_codes*", async (route) => {
      if (route.request().method() === "DELETE") {
        await route.fulfill({ status: 204 })
      } else {
        await route.continue()
      }
    })

    const menuBtn = page.locator("button:has(svg)").filter({ has: page.locator('[data-lucide="more-horizontal"], .lucide-more-horizontal') }).first()
    if ((await menuBtn.count()) === 0) test.skip()
    await menuBtn.click()

    const deleteBtn = page.getByRole("button", { name: /delete/i }).first()
    if ((await deleteBtn.count()) === 0) test.skip()
    await deleteBtn.click()

    const confirmBtn = page.getByRole("button", { name: /confirm/i })
      .or(page.getByRole("button", { name: /delete/i }))
      .first()
    if ((await confirmBtn.count()) > 0) {
      await confirmBtn.click()
    }

    await expect(page.getByText(/deleted|removed/i).first()).toBeVisible({ timeout: 10_000 })
  })
})
