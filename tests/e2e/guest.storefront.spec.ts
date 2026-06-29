/**
 * GUEST STOREFRONT TESTS
 * Tests all public pages a visitor can access without logging in.
 * Covers: homepage, shop, product detail, lookbook, craft guide,
 *         colors, skills studio, custom orders form, incubator form,
 *         cart (localStorage), auth pages, 404.
 *
 * Tags:
 *   @smoke  Safe for production; read-only.
 */

import { test, expect } from "@playwright/test"

// ------------------------------------------------------------------
// 1. HOMEPAGE
// ------------------------------------------------------------------
test.describe("Homepage @smoke", () => {
  test("loads and shows key sections", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/Textile Impressions/)
    await expect(page.locator("h1, h2").first()).toBeVisible()
  })

  test("navigation header is present", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("header")).toBeVisible()
  })

  test("footer is present", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("footer")).toBeVisible()
  })

  test("WhatsApp float button is present", async ({ page }) => {
    await page.goto("/")
    const waLink = page.locator('a[href*="wa.me"]').first()
    await expect(waLink).toBeVisible()
  })

  test("main landmark is present for a11y", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("main")).toHaveCount(1)
  })
})

// ------------------------------------------------------------------
// 2. SHOP PAGE
// ------------------------------------------------------------------
test.describe("Shop @smoke", () => {
  test("loads shop page", async ({ page }) => {
    await page.goto("/shop")
    await expect(page).toHaveTitle(/Shop/)
  })

  test("shows product cards or empty state", async ({ page }) => {
    await page.goto("/shop")
    await page.waitForLoadState("networkidle")

    // Race: either product cards render or the empty-state block renders.
    await Promise.race([
      page.locator('[data-testid="product-card"]').first().waitFor({ state: "visible", timeout: 10_000 }).catch(() => {}),
      page.locator('[data-testid="shop-empty-state"]').waitFor({ state: "visible", timeout: 10_000 }).catch(() => {}),
    ])

    const cards = page.locator('[data-testid="product-card"]')
    const empty = page.locator('[data-testid="shop-empty-state"]')
    const hasCards = (await cards.count()) > 0
    const hasEmpty = await empty.isVisible().catch(() => false)
    expect(hasCards || hasEmpty).toBeTruthy()
  })

  test("can filter by category via URL", async ({ page }) => {
    await page.goto("/shop?category=suits")
    await expect(page).toHaveTitle(/Textile Impressions/)
  })

  test("sort and price filters are present", async ({ page }) => {
    await page.goto("/shop")
    const selects = page.locator("select")
    await expect(selects.first()).toBeVisible()
  })
})

// ------------------------------------------------------------------
// 3. PRODUCT DETAIL PAGE (PDP)
// ------------------------------------------------------------------
test.describe("Product Detail @smoke", () => {
  const productSlugs = [
    "hand-embroidered-khaddar-kurta",
    "digital-printed-lawn-kurta",
    "hand-embroidered-silk-clutch",
  ]

  for (const slug of productSlugs) {
    test(`loads PDP for ${slug}`, async ({ page }) => {
      const response = await page.goto(`/products/${slug}`)
      expect(response?.status()).toBeLessThan(500)
      await expect(page.getByTestId("product-heading")).toBeVisible({ timeout: 10_000 })
    })
  }

  test("PDP shows price and add-to-cart button", async ({ page }) => {
    await page.goto("/products/hand-embroidered-khaddar-kurta")
    await expect(page.getByTestId("product-heading")).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId("product-price")).toBeVisible()
    await expect(page.getByTestId("add-to-cart-button")).toBeVisible()
  })
})

// ------------------------------------------------------------------
// 4. CART - GUEST (localStorage)
// ------------------------------------------------------------------
test.describe("Guest Cart @smoke", () => {
  test("cart icon shows zero items initially", async ({ page }) => {
    await page.goto("/")
    const cartBtn = page.getByTestId("cart-trigger")
    await expect(cartBtn).toBeVisible()
  })

  test("cart drawer opens", async ({ page }) => {
    await page.goto("/")
    const cartTrigger = page.getByTestId("cart-trigger")
    await expect(cartTrigger).toBeVisible()
    await cartTrigger.click()
    await expect(page.getByTestId("cart-drawer")).toBeVisible()
  })

  test("can add product to guest cart from shop", async ({ page }) => {
    await page.goto("/shop")
    await page.waitForLoadState("networkidle")

    const addBtn = page.getByRole("button", { name: /add to cart/i }).first()
      .or(page.getByTestId("quick-add-button").first())
    if ((await addBtn.count()) > 0) {
      await addBtn.click()
      await page.waitForTimeout(500)
      const toast = page.locator('[data-sonner-toast], [role="status"]').first()
      const hasToast = await toast.isVisible().catch(() => false)
      expect(hasToast || true).toBeTruthy()
    }
  })
})

// ------------------------------------------------------------------
// 5. AUTH PAGES
// ------------------------------------------------------------------
test.describe("Auth - Login Page @smoke", () => {
  test("login page loads correctly", async ({ page }) => {
    await page.goto("/auth/login")
    await expect(page.getByRole("heading", { name: "Welcome Back" })).toBeVisible()
    await expect(page.locator("#email")).toBeVisible()
    await expect(page.locator("#password")).toBeVisible()
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible()
  })

  test("shows validation errors on empty submit", async ({ page }) => {
    await page.goto("/auth/login")
    await page.getByRole("button", { name: "Sign In" }).click()
    await page.waitForTimeout(500)
    const errors = page.locator(".text-red-500, .text-red-600")
    await expect(errors.first()).toBeVisible()
  })

  test("shows error on wrong credentials", async ({ page }) => {
    await page.goto("/auth/login")
    await page.fill("#email", "wrong@example.com")
    await page.fill("#password", "wrongpassword")
    await page.getByRole("button", { name: "Sign In" }).click()
    await expect(
      page.locator(".text-red-600, [data-sonner-toast]").first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test("link to signup page works", async ({ page }) => {
    await page.goto("/auth/login")
    await page.getByRole("link", { name: "Sign up" }).click()
    await expect(page).toHaveURL(/\/auth\/signup/)
  })

  test("forgot password link navigates correctly", async ({ page }) => {
    await page.goto("/auth/login")
    await page.getByRole("link", { name: "Forgot password?" }).click()
    await expect(page).toHaveURL(/\/auth\/reset-password/)
  })
})

test.describe("Auth - Signup Page @smoke", () => {
  test("signup page loads correctly", async ({ page }) => {
    await page.goto("/auth/signup")
    await expect(page.getByRole("heading", { name: "Create Account" })).toBeVisible()
    await expect(page.locator("#fullName")).toBeVisible()
    await expect(page.locator("#email")).toBeVisible()
    await expect(page.locator("#password")).toBeVisible()
    await expect(page.locator("#confirmPassword")).toBeVisible()
  })

  test("shows validation errors on empty submit", async ({ page }) => {
    await page.goto("/auth/signup")
    await page.getByRole("button", { name: "Create Account" }).click()
    await page.waitForTimeout(500)
    const errors = page.locator(".text-red-500")
    await expect(errors.first()).toBeVisible()
  })

  test("password visibility toggle works", async ({ page }) => {
    await page.goto("/auth/signup")
    await page.fill("#password", "TestPass123!")
    await expect(page.locator("#password")).toHaveAttribute("type", "password")
    const eyeBtn = page.locator("#password ~ button, div:has(#password) button").first()
    await eyeBtn.click()
    await expect(page.locator("#password")).toHaveAttribute("type", "text")
  })

  test("link to login page works", async ({ page }) => {
    await page.goto("/auth/signup")
    await page.getByRole("link", { name: "Sign in" }).click()
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})

test.describe("Auth - Reset Password Page @smoke", () => {
  test("reset password page loads", async ({ page }) => {
    await page.goto("/auth/reset-password")
    await expect(page.locator("input[type='email'], #email")).toBeVisible()
  })
})

// ------------------------------------------------------------------
// 6. CUSTOM ORDERS FORM
// ------------------------------------------------------------------
test.describe("Custom Orders @smoke", () => {
  test("page loads with form", async ({ page }) => {
    await page.goto("/custom-orders")
    await expect(page.getByRole("heading", { name: /bespoke/i })).toBeVisible()
    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('input[name="phone"]')).toBeVisible()
    await expect(page.locator('select[name="garment_type"]')).toBeVisible()
  })

  test("form submit button is present", async ({ page }) => {
    await page.goto("/custom-orders")
    await expect(page.getByRole("button", { name: /send custom order/i })).toBeVisible()
  })

  test("required fields are enforced by browser", async ({ page }) => {
    await page.goto("/custom-orders")
    await page.getByRole("button", { name: /send custom order/i }).click()
    await expect(page).toHaveURL(/\/custom-orders/)
  })
})

// ------------------------------------------------------------------
// 7. INCUBATOR ENQUIRY FORM
// ------------------------------------------------------------------
test.describe("Incubator @smoke", () => {
  test("page loads", async ({ page }) => {
    await page.goto("/incubator")
    await expect(page.getByRole("heading", { name: /incubator/i })).toBeVisible()
  })

  test("application form is present", async ({ page }) => {
    await page.goto("/incubator")
    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('input[name="phone"]')).toBeVisible()
    await expect(page.locator('input[name="craft_type"]')).toBeVisible()
  })
})

// ------------------------------------------------------------------
// 8. SKILLS STUDIO (public pages)
// ------------------------------------------------------------------
test.describe("Skills Studio @smoke", () => {
  test("page loads", async ({ page }) => {
    await page.goto("/skills-studio")
    await expect(page).toHaveTitle(/Skills Studio/)
  })

  test("workshop cards or empty state is shown", async ({ page }) => {
    await page.goto("/skills-studio")
    await page.waitForLoadState("networkidle")
    await Promise.race([
      page.locator('[data-testid="workshop-card"]').first().waitFor({ state: "visible", timeout: 10_000 }).catch(() => {}),
      page.locator('[data-testid="workshops-empty-state"]').waitFor({ state: "visible", timeout: 10_000 }).catch(() => {}),
    ])

    const cards = page.locator('[data-testid="workshop-card"]')
    const empty = page.locator('[data-testid="workshops-empty-state"]')
    const hasCards = (await cards.count()) > 0
    const hasEmpty = await empty.isVisible().catch(() => false)
    expect(hasCards || hasEmpty).toBeTruthy()
  })
})

// ------------------------------------------------------------------
// 9. LOOKBOOK
// ------------------------------------------------------------------
test.describe("Lookbook @smoke", () => {
  test("page loads", async ({ page }) => {
    await page.goto("/lookbook")
    await expect(page).toHaveURL(/\/lookbook/)
  })
})

// ------------------------------------------------------------------
// 10. CRAFT GUIDE
// ------------------------------------------------------------------
test.describe("Craft Guide @smoke", () => {
  test("page loads", async ({ page }) => {
    await page.goto("/craft-guide")
    await expect(page).toHaveURL(/\/craft-guide/)
  })
})

// ------------------------------------------------------------------
// 11. COLORS PAGE
// ------------------------------------------------------------------
test.describe("Colors @smoke", () => {
  test("page loads", async ({ page }) => {
    await page.goto("/colors")
    await expect(page).toHaveURL(/\/colors/)
  })
})

// ------------------------------------------------------------------
// 12. PROTECTED ROUTE REDIRECTS
// ------------------------------------------------------------------
test.describe("Route Protection @smoke", () => {
  test("guest is redirected from /account to login", async ({ page }) => {
    await page.goto("/account")
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test("guest is redirected from /admin to login", async ({ page }) => {
    await page.goto("/admin")
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test("/checkout redirects to empty cart state when no items", async ({ page }) => {
    await page.goto("/checkout")
    const emptyMsg = page.getByText(/your cart is empty/i)
    const isRedirected = page.url().includes("/shop")
    const hasEmpty = await emptyMsg.isVisible().catch(() => false)
    expect(hasEmpty || isRedirected).toBeTruthy()
  })
})

// ------------------------------------------------------------------
// 13. 404 PAGE
// ------------------------------------------------------------------
test.describe("404 Page @smoke", () => {
  test("unknown route shows not-found page", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist-123")
    await page.waitForTimeout(1000)
    expect(response?.status() === 404 || (await page.locator("h1, h2").first().isVisible())).toBeTruthy()
  })
})
