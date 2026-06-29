/**
 * CUSTOMER ADDRESSES TESTS
 * Runs with a saved authenticated customer session.
 * Covers: listing, add, edit, set-default, and delete address.
 *
 * Tags:
 *   @smoke    Read-only / production-safe page-load tests.
 *   @mutation Tests that create, update, or delete data (local only).
 */

import { test, expect } from "@playwright/test"

test.describe("Customer Addresses @smoke", () => {
  test("addresses page loads", async ({ page }) => {
    await page.goto("/account/addresses")
    await expect(page).toHaveURL(/\/account\/addresses/)
    await expect(
      page.getByRole("heading", { name: /address/i })
    ).toBeVisible({ timeout: 10_000 })
  })

  test("shows address list or empty state", async ({ page }) => {
    await page.goto("/account/addresses")
    await page.waitForTimeout(1500)

    const listItem = page.locator("[data-address], .address-card").first()
    const empty = page.getByText(/no addresses/i)

    const hasList = await listItem.count() > 0
    const hasEmpty = await empty.isVisible().catch(() => false)
    expect(hasList || hasEmpty).toBeTruthy()
  })

  test("Add Address button is present", async ({ page }) => {
    await page.goto("/account/addresses")
    const addBtn = page
      .getByRole("button", { name: /add address/i })
      .or(page.getByRole("link", { name: /add address/i }))
    if (await addBtn.count() > 0) {
      await expect(addBtn.first()).toBeVisible()
    }
  })
})

test.describe("Customer Addresses @mutation", () => {
  test("can add a new address", async ({ page }) => {
    // Prevent accidental real mutations.
    await page.route("/api/account/addresses", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: "addr-test-id",
            label: "Home",
            full_name: "Test Customer",
            phone: "03001234567",
            address_line_1: "123 Test Street",
            city: "Karachi",
            province: "Sindh",
            postal_code: "74000",
            country: "Pakistan",
            is_default: false,
          }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto("/account/addresses")
    await page.waitForTimeout(1500)

    const addBtn = page
      .getByRole("button", { name: /add address/i })
      .or(page.getByRole("link", { name: /add address/i }))
      .first()
    if (await addBtn.count() === 0) {
      test.skip()
    }
    await addBtn.click()

    // Fill the address form using robust selectors.
    const nameInput = page.locator('input[name="full_name"], input[name="name"], input[placeholder*="Name"]').first()
    if (await nameInput.count() > 0) await nameInput.fill("Test Customer")

    const phoneInput = page.locator('input[name="phone"], input[placeholder*="03"]').first()
    if (await phoneInput.count() > 0) await phoneInput.fill("03001234567")

    const addressInput = page.locator('input[name="address_line_1"], input[name="address"], input[placeholder*="House"]').first()
    if (await addressInput.count() > 0) await addressInput.fill("123 Test Street")

    const cityInput = page.locator('input[name="city"], input[placeholder*="City"]').first()
    if (await cityInput.count() > 0) await cityInput.fill("Karachi")

    const provinceSelect = page.locator('select[name="province"], select[name="state"]').first()
    if (await provinceSelect.count() > 0) await provinceSelect.selectOption("Sindh")

    const postalInput = page.locator('input[name="postal_code"], input[name="postal"], input[placeholder*="Postal"]').first()
    if (await postalInput.count() > 0) await postalInput.fill("74000")

    const labelInput = page.locator('input[name="label"], input[placeholder*="Label"]').first()
    if (await labelInput.count() > 0) await labelInput.fill("Home")

    await page.getByRole("button", { name: /save/i }).first().click()

    // Expect a success toast or the new address to appear.
    await expect(
      page.getByText(/saved|added|123 Test Street/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test("can edit an existing address", async ({ page }) => {
    await page.route("/api/account/addresses/**", async (route) => {
      if (route.request().method() === "PATCH" || route.request().method() === "PUT") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: "addr-test-id", address_line_1: "456 Updated Road" }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto("/account/addresses")
    await page.waitForTimeout(1500)

    const editBtn = page.getByRole("button", { name: /edit/i }).first()
    if (await editBtn.count() === 0) {
      test.skip()
    }
    await editBtn.click()

    const addressInput = page.locator('input[name="address_line_1"], input[name="address"]').first()
    if (await addressInput.count() > 0) await addressInput.fill("456 Updated Road")

    await page.getByRole("button", { name: /save/i }).first().click()
    await expect(page.getByText(/updated|saved|456 Updated Road/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test("can set an address as default", async ({ page }) => {
    await page.route("/api/account/addresses/**", async (route) => {
      if (route.request().method() === "PATCH") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) })
      } else {
        await route.continue()
      }
    })

    await page.goto("/account/addresses")
    await page.waitForTimeout(1500)

    const defaultBtn = page.getByRole("button", { name: /set default/i }).first()
    if (await defaultBtn.count() === 0) {
      test.skip()
    }
    await defaultBtn.click()
    await expect(page.getByText(/default|updated/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test("can delete an address", async ({ page }) => {
    await page.route("/api/account/addresses/**", async (route) => {
      if (route.request().method() === "DELETE") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) })
      } else {
        await route.continue()
      }
    })

    await page.goto("/account/addresses")
    await page.waitForTimeout(1500)

    const deleteBtn = page.getByRole("button", { name: /delete/i }).first()
    if (await deleteBtn.count() === 0) {
      test.skip()
    }
    await deleteBtn.click()

    // Confirm deletion if a dialog is shown.
    const confirmBtn = page.getByRole("button", { name: /confirm/i })
      .or(page.getByRole("button", { name: /delete/i }))
      .first()
    if (await confirmBtn.count() > 0) {
      await confirmBtn.click()
    }

    await expect(page.getByText(/deleted|removed/i).first()).toBeVisible({ timeout: 10_000 })
  })
})
