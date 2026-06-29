/**
 * AUTH SETUP
 * Runs once before customer/admin test suites.
 * Logs in as both customer and admin, saves storage state (cookies/localStorage)
 * so subsequent tests skip the login step entirely.
 */

import { test as setup, expect } from "@playwright/test"
import path from "path"

const CUSTOMER_AUTH_FILE = path.join(__dirname, ".auth/customer.json")
const ADMIN_AUTH_FILE = path.join(__dirname, ".auth/admin.json")

const CUSTOMER_EMAIL = process.env.CUSTOMER_EMAIL || "customer@test.com"
const CUSTOMER_PASSWORD = process.env.CUSTOMER_PASSWORD || "password123"
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@test.com"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "adminpassword"

// ---------- Customer login ----------
setup("authenticate as customer", async ({ page }) => {
  await page.goto("/auth/login")
  await expect(page.getByRole("heading", { name: "Welcome Back" })).toBeVisible()

  await page.fill("#email", CUSTOMER_EMAIL)
  await page.fill("#password", CUSTOMER_PASSWORD)
  await page.getByRole("button", { name: "Sign In" }).click()

  // Redirected to /account after login
  await page.waitForURL(/\/account/, { timeout: 15_000 })
  await page.context().storageState({ path: CUSTOMER_AUTH_FILE })
})

// ---------- Admin login ----------
setup("authenticate as admin", async ({ page }) => {
  await page.goto("/auth/login")
  await expect(page.getByRole("heading", { name: "Welcome Back" })).toBeVisible()

  await page.fill("#email", ADMIN_EMAIL)
  await page.fill("#password", ADMIN_PASSWORD)
  await page.getByRole("button", { name: "Sign In" }).click()

  // Admin users redirect to / (not /account since they go to /admin manually)
  await page.waitForURL(/\//, { timeout: 15_000 })
  await page.context().storageState({ path: ADMIN_AUTH_FILE })
})
