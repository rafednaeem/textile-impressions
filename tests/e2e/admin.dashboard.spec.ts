/**
 * ADMIN DASHBOARD TESTS
 * Runs with a saved authenticated admin session.
 * Covers: dashboard KPIs, charts, and quick-action links.
 *
 * Tags:
 *   @smoke  Read-only / production-safe.
 */

import { test, expect } from "@playwright/test"

test.describe("Admin Dashboard @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin")
    await page.waitForTimeout(2000)
  })

  test("loads admin dashboard", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()
  })

  test("shows 4 KPI cards", async ({ page }) => {
    const cards = page.locator(".rounded-xl.border").filter({ hasText: /revenue|orders|payment|stock/i })
    await expect(cards).toHaveCount(4, { timeout: 10_000 })
  })

  test("revenue KPI is visible", async ({ page }) => {
    await expect(page.getByText(/total revenue/i)).toBeVisible()
  })

  test("orders KPI is visible", async ({ page }) => {
    await expect(page.getByText(/total orders/i)).toBeVisible()
  })

  test("pending payments KPI is visible", async ({ page }) => {
    await expect(page.getByText(/pending payments/i)).toBeVisible()
  })

  test("low stock KPI is visible", async ({ page }) => {
    await expect(page.getByText(/low stock/i)).toBeVisible()
  })

  test("charts render", async ({ page }) => {
    // Recharts renders SVG elements
    const charts = page.locator("svg.recharts-surface")
    await expect(charts.first()).toBeVisible({ timeout: 10_000 })
  })

  test("verify pending payments quick link works", async ({ page }) => {
    await page.getByText(/verify pending payments/i).click()
    await expect(page).toHaveURL(/\/admin\/orders/)
  })

  test("orders requiring processing quick link works", async ({ page }) => {
    await page.getByText(/orders requiring processing/i).click()
    await expect(page).toHaveURL(/\/admin\/orders/)
  })
})
