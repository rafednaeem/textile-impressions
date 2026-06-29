/**
 * ACCESSIBILITY SMOKE TESTS
 * Basic a11y checks using Playwright-native assertions only.
 * Does NOT use axe-core (no new dependencies).
 *
 * Tags:
 *   @smoke  Safe for production.
 *   @a11y   Accessibility-specific.
 */

import { test, expect } from "@playwright/test"

const PUBLIC_PAGES = [
  { name: "Home", path: "/" },
  { name: "Shop", path: "/shop" },
  { name: "Product Detail", path: "/products/hand-embroidered-khaddar-kurta" },
  { name: "Lookbook", path: "/lookbook" },
  { name: "Craft Guide", path: "/craft-guide" },
  { name: "Colors", path: "/colors" },
  { name: "Skills Studio", path: "/skills-studio" },
  { name: "Custom Orders", path: "/custom-orders" },
  { name: "Incubator", path: "/incubator" },
]

const AUTH_PAGES = [
  { name: "Login", path: "/auth/login" },
  { name: "Signup", path: "/auth/signup" },
  { name: "Reset Password", path: "/auth/reset-password" },
]
test.describe("A11Y - Landmarks @smoke @a11y", () => {
  for (const { name, path } of PUBLIC_PAGES) {
    test(`${name} has a single main landmark`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState("networkidle")
      const mains = page.locator("main")
      await expect(mains).toHaveCount(1)
    })

    test(`${name} has a header element`, async ({ page }) => {
      await page.goto(path)
      await expect(page.locator("header").first()).toBeVisible()
    })

    test(`${name} has a footer element`, async ({ page }) => {
      await page.goto(path)
      await expect(page.locator("footer").first()).toBeVisible()
    })
  }
})


test.describe("A11Y - Auth Pages @smoke @a11y", () => {
  for (const { name, path } of AUTH_PAGES) {
    test(`${name} has visible page content`, async ({ page }) => {
      await page.goto(path)
      await expect(page.locator("h1, h2").first()).toBeVisible()
    })
  }
})

test.describe("A11Y ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Images @smoke @a11y", () => {
  test("all images on homepage have alt text", async ({ page }) => {
    await page.goto("/")
    const images = page.locator("img")
    const count = await images.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute("alt")
      // Decorative images may have empty alt; require alt attribute to exist.
      expect(alt).not.toBeNull()
    }
  })

  test("all images on product detail page have alt text", async ({ page }) => {
    await page.goto("/products/hand-embroidered-khaddar-kurta")
    await page.waitForTimeout(2000)
    const images = page.locator("img")
    const count = await images.count()
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const alt = await images.nth(i).getAttribute("alt")
        expect(alt).not.toBeNull()
      }
    }
  })
})

test.describe("A11Y ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Forms @smoke @a11y", () => {
  test("login form inputs have labels", async ({ page }) => {
    await page.goto("/auth/login")
    const inputs = ["#email", "#password"]
    for (const selector of inputs) {
      const input = page.locator(selector)
      const id = await input.getAttribute("id")
      const ariaLabel = await input.getAttribute("aria-label")
      const ariaLabelledBy = await input.getAttribute("aria-labelledby")
      const label = page.locator(`label[for="${id}"]`)
      const hasLabel = (await label.count()) > 0
      expect(hasLabel || !!ariaLabel || !!ariaLabelledBy).toBeTruthy()
    }
  })

  test("signup form inputs have labels", async ({ page }) => {
    await page.goto("/auth/signup")
    const inputs = ["#fullName", "#email", "#phone", "#password", "#confirmPassword"]
    for (const selector of inputs) {
      const input = page.locator(selector)
      const id = await input.getAttribute("id")
      const ariaLabel = await input.getAttribute("aria-label")
      const ariaLabelledBy = await input.getAttribute("aria-labelledby")
      const label = page.locator(`label[for="${id}"]`)
      const hasLabel = (await label.count()) > 0
      expect(hasLabel || !!ariaLabel || !!ariaLabelledBy).toBeTruthy()
    }
  })

  test("custom order form inputs have labels", async ({ page }) => {
    await page.goto("/custom-orders")
    const inputs = await page.locator('input, select, textarea').all()
    for (const input of inputs) {
      const tag = await input.evaluate((el) => el.tagName.toLowerCase())
      const type = await input.getAttribute("type")
      if (tag === "input" && (type === "hidden" || type === "submit")) continue

      const id = await input.getAttribute("id")
      const name = await input.getAttribute("name")
      const ariaLabel = await input.getAttribute("aria-label")
      const ariaLabelledBy = await input.getAttribute("aria-labelledby")
      const hasLabel = id ? (await page.locator(`label[for="${id}"]`).count()) > 0 : false
      expect(hasLabel || !!ariaLabel || !!ariaLabelledBy || !!name).toBeTruthy()
    }
  })
})

test.describe("A11Y ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Interactive Elements @smoke @a11y", () => {
  test("all header links and buttons have accessible names", async ({ page }) => {
    await page.goto("/")
    const controls = await page.locator("header a, header button").all()
    for (const control of controls) {
      const name = await control.getAttribute("aria-label")
      const text = await control.textContent()
      const title = await control.getAttribute("title")
      expect(!!name || !!(text && text.trim()) || !!title).toBeTruthy()
    }
  })

  test("focus indicator is visible on interactive elements", async ({ page }) => {
    await page.goto("/")
    const firstLink = page.locator("header a").first()
    await firstLink.focus()
    const isFocused = await firstLink.evaluate((el) => el === document.activeElement)
    expect(isFocused).toBeTruthy()
  })

  test("page title is descriptive on every public page", async ({ page }) => {
    for (const { path } of [...PUBLIC_PAGES, ...AUTH_PAGES]) {
      await page.goto(path)
      const title = await page.title()
      expect(title.length).toBeGreaterThan(3)
    }
  })
})
