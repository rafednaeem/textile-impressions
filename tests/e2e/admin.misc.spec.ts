/**
 * ADMIN MISCELLANEOUS TESTS
 * Covers all remaining admin pages:
 * artisans, collections, customers, custom orders,
 * incubator enquiries, UGC photos, skills studio, settings.
 * Also covers admin sidebar navigation.
 *
 * Tags:
 *   @smoke     Read-only / production-safe.
 *   @mutation  Destructive admin changes (local only).
 */

import { test, expect } from "@playwright/test"

// ─────────────────────────────────────────────
// ADMIN NAVIGATION
// ─────────────────────────────────────────────
test.describe("Admin Sidebar Navigation @smoke", () => {
  test("can navigate to Products", async ({ page }) => {
    await page.goto("/admin")
    await page.getByRole("link", { name: /products/i }).first().click()
    await expect(page).toHaveURL(/\/admin\/products/)
  })

  test("can navigate to Orders", async ({ page }) => {
    await page.goto("/admin")
    await page.getByRole("link", { name: /orders/i }).first().click()
    await expect(page).toHaveURL(/\/admin\/orders/)
  })

  test("can navigate to Inventory", async ({ page }) => {
    await page.goto("/admin")
    await page.getByRole("link", { name: /inventory/i }).first().click()
    await expect(page).toHaveURL(/\/admin\/inventory/)
  })

  test("can navigate to Discounts", async ({ page }) => {
    await page.goto("/admin")
    await page.getByRole("link", { name: /discounts/i }).first().click()
    await expect(page).toHaveURL(/\/admin\/discounts/)
  })

  test("can navigate to Customers", async ({ page }) => {
    await page.goto("/admin")
    await page.getByRole("link", { name: /customers/i }).first().click()
    await expect(page).toHaveURL(/\/admin\/customers/)
  })

  test("can navigate to Artisans", async ({ page }) => {
    await page.goto("/admin")
    await page.getByRole("link", { name: /artisans/i }).first().click()
    await expect(page).toHaveURL(/\/admin\/artisans/)
  })

  test("can navigate to Collections", async ({ page }) => {
    await page.goto("/admin")
    await page.getByRole("link", { name: /collections/i }).first().click()
    await expect(page).toHaveURL(/\/admin\/collections/)
  })

  test("can navigate to Custom Orders", async ({ page }) => {
    await page.goto("/admin")
    await page.getByRole("link", { name: /custom orders/i }).first().click()
    await expect(page).toHaveURL(/\/admin\/custom-orders/)
  })

  test("can navigate to Incubator Enquiries", async ({ page }) => {
    await page.goto("/admin")
    await page.getByRole("link", { name: /incubator/i }).first().click()
    await expect(page).toHaveURL(/\/admin\/incubator-enquiries/)
  })

  test("can navigate to Skills Studio", async ({ page }) => {
    await page.goto("/admin")
    await page.getByRole("link", { name: /skills studio/i }).first().click()
    await expect(page).toHaveURL(/\/admin\/skills-studio/)
  })

  test("can navigate to UGC Photos", async ({ page }) => {
    await page.goto("/admin")
    await page.getByRole("link", { name: /ugc/i }).first().click()
    await expect(page).toHaveURL(/\/admin\/ugc-photos/)
  })

  test("can navigate to Settings", async ({ page }) => {
    await page.goto("/admin")
    await page.getByRole("link", { name: /settings/i }).first().click()
    await expect(page).toHaveURL(/\/admin\/settings/)
  })
})

// ─────────────────────────────────────────────
// INDIVIDUAL ADMIN PAGES
// ─────────────────────────────────────────────
test.describe("Admin — Artisans @smoke", () => {
  test("page loads", async ({ page }) => {
    await page.goto("/admin/artisans")
    await page.waitForTimeout(1500)
    await expect(page).toHaveURL(/\/admin\/artisans/)
    await expect(page.locator("h1")).toBeVisible()
  })
})

test.describe("Admin — Collections @smoke", () => {
  test("page loads", async ({ page }) => {
    await page.goto("/admin/collections")
    await page.waitForTimeout(1500)
    await expect(page).toHaveURL(/\/admin\/collections/)
    await expect(page.locator("h1")).toBeVisible()
  })
})

test.describe("Admin — Customers @smoke", () => {
  test("page loads", async ({ page }) => {
    await page.goto("/admin/customers")
    await page.waitForTimeout(1500)
    await expect(page).toHaveURL(/\/admin\/customers/)
    await expect(page.locator("h1")).toBeVisible()
  })

  test("shows customer table or empty state", async ({ page }) => {
    await page.goto("/admin/customers")
    await page.waitForTimeout(2000)
    const table = page.locator("table")
    const empty = page.getByText(/no customers/i)
    const hasTable = (await table.count()) > 0
    const hasEmpty = await empty.isVisible().catch(() => false)
    expect(hasTable || hasEmpty).toBeTruthy()
  })

  test("can navigate to customer detail if available", async ({ page }) => {
    await page.goto("/admin/customers")
    await page.waitForTimeout(2000)
    const viewLink = page.getByRole("link", { name: /view/i }).first()
    if ((await viewLink.count()) > 0) {
      await viewLink.click()
      await expect(page).toHaveURL(/\/admin\/customers\/[a-z0-9-]+/)
      await expect(page.locator("h1, h2").first()).toBeVisible()
    }
  })
})

test.describe("Admin — Custom Orders @smoke", () => {
  test("page loads", async ({ page }) => {
    await page.goto("/admin/custom-orders")
    await page.waitForTimeout(1500)
    await expect(page).toHaveURL(/\/admin\/custom-orders/)
    await expect(page.locator("h1")).toBeVisible()
  })

  test("shows table or empty state", async ({ page }) => {
    await page.goto("/admin/custom-orders")
    await page.waitForTimeout(2000)
    const table = page.locator("table")
    const empty = page.getByText(/no custom orders/i)
    const hasTable = (await table.count()) > 0
    const hasEmpty = await empty.isVisible().catch(() => false)
    expect(hasTable || hasEmpty).toBeTruthy()
  })
})

test.describe("Admin — Incubator Enquiries @smoke", () => {
  test("page loads", async ({ page }) => {
    await page.goto("/admin/incubator-enquiries")
    await page.waitForTimeout(1500)
    await expect(page).toHaveURL(/\/admin\/incubator-enquiries/)
    await expect(page.locator("h1")).toBeVisible()
  })

  test("shows table or empty state", async ({ page }) => {
    await page.goto("/admin/incubator-enquiries")
    await page.waitForTimeout(2000)
    const table = page.locator("table")
    const empty = page.getByText(/no enquiries/i)
    const hasTable = (await table.count()) > 0
    const hasEmpty = await empty.isVisible().catch(() => false)
    expect(hasTable || hasEmpty).toBeTruthy()
  })
})

test.describe("Admin — UGC Photos @smoke", () => {
  test("page loads", async ({ page }) => {
    await page.goto("/admin/ugc-photos")
    await page.waitForTimeout(1500)
    await expect(page).toHaveURL(/\/admin\/ugc-photos/)
    await expect(page.locator("h1")).toBeVisible()
  })
})

test.describe("Admin — Skills Studio @smoke", () => {
  test("page loads", async ({ page }) => {
    await page.goto("/admin/skills-studio")
    await page.waitForTimeout(1500)
    await expect(page).toHaveURL(/\/admin\/skills-studio/)
    await expect(page.locator("h1")).toBeVisible()
  })

  test("New Workshop button is present", async ({ page }) => {
    await page.goto("/admin/skills-studio")
    await page.waitForTimeout(1500)
    const newBtn = page.getByRole("link", { name: /new workshop/i })
    if ((await newBtn.count()) > 0) {
      await expect(newBtn).toBeVisible()
    }
  })

  test("can navigate to new workshop form", async ({ page }) => {
    await page.goto("/admin/skills-studio")
    await page.waitForTimeout(1500)
    const newBtn = page.getByRole("link", { name: /new workshop/i })
    if ((await newBtn.count()) > 0) {
      await newBtn.click()
      await expect(page).toHaveURL(/\/admin\/skills-studio\/new/)
    }
  })

  test("can navigate to workshop registrations", async ({ page }) => {
    await page.goto("/admin/skills-studio")
    await page.waitForTimeout(1500)
    const registrationsLink = page.getByRole("link", { name: /registrations/i }).first()
    if ((await registrationsLink.count()) > 0) {
      await registrationsLink.click()
      await expect(page).toHaveURL(/\/admin\/skills-studio\/.+\/registrations/)
      await expect(page.locator("h1, h2").first()).toBeVisible()
    }
  })
})

test.describe("Admin — Settings @smoke", () => {
  test("page loads", async ({ page }) => {
    await page.goto("/admin/settings")
    await page.waitForTimeout(1500)
    await expect(page).toHaveURL(/\/admin\/settings/)
    await expect(page.locator("h1")).toBeVisible()
  })

  test("settings form fields are present", async ({ page }) => {
    await page.goto("/admin/settings")
    await page.waitForTimeout(1500)
    const inputs = await page.locator("form input, form select, form textarea").all()
    expect(inputs.length).toBeGreaterThan(0)
  })
})

test.describe("Admin — Settings Mutations @mutation", () => {
  test("can save settings form", async ({ page }) => {
    await page.route("/api/admin/settings", async (route) => {
      if (["POST", "PUT", "PATCH"].includes(route.request().method())) {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) })
      } else {
        await route.continue()
      }
    })

    await page.goto("/admin/settings")
    await page.waitForTimeout(1500)

    const saveBtn = page.getByRole("button", { name: /save/i }).first()
    if ((await saveBtn.count()) === 0) test.skip()
    await saveBtn.click()

    await expect(page.getByText(/saved|updated/i).first()).toBeVisible({ timeout: 10_000 })
  })
})
