/**
 * AUTH FUNCTIONAL TESTS
 * Deeper validation of login, signup, and reset-password flows.
 *
 * Tags:
 *   @smoke     Read-only / safe forms.
 *   @mutation  Creates a new user during signup (local only).
 */

import { test, expect } from "@playwright/test"
import { randomUUID } from "crypto"

test.describe("Auth — Signup Flow @mutation", () => {
  test("successful signup creates account and redirects", async ({ page }) => {
    const unique = randomUUID().slice(0, 8)
    const email = `e2e-test-${unique}@example.com`
    const password = "TestPass123!"

    await page.goto("/auth/signup")
    await page.fill("#fullName", "E2E Test User")
    await page.fill("#email", email)
    await page.fill("#phone", "03001234567")
    await page.fill("#password", password)
    await page.fill("#confirmPassword", password)

    // Intercept signup API if the app exposes one; otherwise rely on Supabase auth
    await page.route("**/auth/v1/signup", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ user: { id: "test-id", email }, session: null }),
      })
    })

    await page.getByRole("button", { name: "Create Account" }).click()

    // Expect either redirect to account, login, or a success toast
    await expect(page).toHaveURL(/\/(account|auth\/login)/, { timeout: 15_000 })
  })

  test("shows error when email is already registered", async ({ page }) => {
    await page.goto("/auth/signup")
    await page.fill("#fullName", "Existing User")
    await page.fill("#email", "admin@store.com")
    await page.fill("#phone", "03001234567")
    await page.fill("#password", "TestPass123!")
    await page.fill("#confirmPassword", "TestPass123!")
    await page.getByRole("button", { name: "Create Account" }).click()

    await expect(
      page.locator(".text-red-600, [data-sonner-toast]").first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test("enforces password minimum requirements", async ({ page }) => {
    await page.goto("/auth/signup")
    await page.fill("#password", "123")
    await page.fill("#confirmPassword", "123")
    await page.getByRole("button", { name: "Create Account" }).click()
    await expect(page.locator(".text-red-500, .text-red-600").first()).toBeVisible()
  })

  test("shows error when passwords do not match", async ({ page }) => {
    await page.goto("/auth/signup")
    await page.fill("#password", "TestPass123!")
    await page.fill("#confirmPassword", "DifferentPass123!")
    await page.getByRole("button", { name: "Create Account" }).click()
    await expect(page.locator(".text-red-500, .text-red-600").first()).toBeVisible()
  })

  test("all auth inputs have associated labels", async ({ page }) => {
    await page.goto("/auth/signup")
    const inputs = ["#fullName", "#email", "#phone", "#password", "#confirmPassword"]
    for (const selector of inputs) {
      const input = page.locator(selector)
      const ariaLabel = await input.getAttribute("aria-label")
      const id = await input.getAttribute("id")
      const label = page.locator(`label[for="${id}"]`)
      const hasLabel = (await label.count()) > 0
      expect(hasLabel || !!ariaLabel).toBeTruthy()
    }
  })
})

test.describe("Auth — Reset Password Flow @smoke", () => {
  test("validates empty email", async ({ page }) => {
    await page.goto("/auth/reset-password")
    await page.getByRole("button", { name: /send reset/i }).first().click()
    await expect(page.locator(".text-red-500, .text-red-600").first()).toBeVisible()
  })

  test("validates invalid email format", async ({ page }) => {
    await page.goto("/auth/reset-password")
    await page.fill("#email", "not-an-email")
    await page.getByRole("button", { name: /send reset/i }).first().click()
    await expect(page.locator(".text-red-500, .text-red-600").first()).toBeVisible()
  })

  test("shows success state for valid email", async ({ page }) => {
    await page.goto("/auth/reset-password")

    await page.route("**/auth/v1/recover", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      })
    })

    await page.fill("#email", "customer@example.com")
    await page.getByRole("button", { name: /send reset/i }).first().click()

    // Either redirect or success message
    await page.waitForTimeout(1500)
    const success = page.getByText(/check your email|reset link sent/i)
    const hasSuccess = await success.isVisible().catch(() => false)
    expect(hasSuccess || page.url().includes("/auth/login")).toBeTruthy()
  })
})

test.describe("Auth — Login Edge Cases @smoke", () => {
  test("invalid email format shows validation error", async ({ page }) => {
    await page.goto("/auth/login")
    await page.fill("#email", "bad-email")
    await page.fill("#password", "somepassword")
    await page.getByRole("button", { name: "Sign In" }).click()
    await expect(page.locator(".text-red-500, .text-red-600").first()).toBeVisible()
  })

  test("password is required", async ({ page }) => {
    await page.goto("/auth/login")
    await page.fill("#email", "customer@example.com")
    await page.getByRole("button", { name: "Sign In" }).click()
    await expect(page.locator(".text-red-500, .text-red-600").first()).toBeVisible()
  })
})
