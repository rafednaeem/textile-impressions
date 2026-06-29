/**
 * SEO & PWA METADATA TESTS
 * Verifies dynamic sitemap, robots.txt, and PWA manifest.
 *
 * Tags:
 *   @smoke  Read-only; safe for production.
 *   @seo    SEO/PWA specific.
 */

import { test, expect } from "@playwright/test"

test.describe("SEO & PWA @smoke @seo", () => {
  test("sitemap.xml is valid XML and contains URLs", async ({ request }) => {
    const response = await request.get("/sitemap.xml")
    expect(response.status()).toBe(200)
    const contentType = response.headers()["content-type"] || ""
    expect(contentType).toContain("xml")

    const body = await response.text()
    expect(body).toContain("<urlset")
    expect(body).toContain("<loc>")
    expect(body).toContain("textile-impressions.vercel.app")
  })

  test("robots.txt allows indexing", async ({ request }) => {
    const response = await request.get("/robots.txt")
    expect(response.status()).toBe(200)

    const body = await response.text()
    expect(body).toContain("User-agent:")
    expect(body).toContain("Allow: /")
    expect(body).toContain("Sitemap:")
  })

  test("manifest.webmanifest has required PWA fields", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest")
    expect(response.status()).toBe(200)
    const contentType = response.headers()["content-type"] || ""
    expect(contentType).toContain("json")

    const manifest = await response.json()
    expect(manifest.name).toBeTruthy()
    expect(manifest.short_name).toBeTruthy()
    expect(manifest.start_url).toBeTruthy()
    expect(manifest.display).toMatch(/standalone|browser/)
    expect(Array.isArray(manifest.icons)).toBeTruthy()
    expect(manifest.icons.length).toBeGreaterThan(0)
  })

  test("homepage has Open Graph metadata", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content")
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content")
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content")
  })

  test("product page has JSON-LD structured data", async ({ page }) => {
    await page.goto("/products/hand-embroidered-khaddar-kurta")
    const jsonLd = page.locator('script[type="application/ld+json"]')
    await expect(jsonLd.first()).toBeVisible()
    const content = await jsonLd.first().textContent()
    expect(content).toContain("Product")
  })

  test("homepage has canonical link", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href")
  })
})
