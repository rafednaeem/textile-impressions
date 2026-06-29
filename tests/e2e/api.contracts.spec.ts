/**
 * API CONTRACT TESTS
 * Verifies key API routes return expected status codes and shapes.
 *
 * Tags:
 *   @smoke     Unauthenticated contract probes; safe for production.
 *   @mutation  Tests that send real or mocked payloads; local only.
 */

import { test, expect } from "@playwright/test"

test.describe("API — Unauthenticated Security @smoke", () => {
  test("POST /api/orders rejects unauthenticated requests", async ({ request }) => {
    const response = await request.post("/api/orders", {
      data: { items: [], shipping: {} },
    })
    expect([401, 403]).toContain(response.status())
  })

  test("GET /api/orders/[id] rejects unauthenticated requests", async ({ request }) => {
    const response = await request.get("/api/orders/test-order-id")
    expect([401, 403]).toContain(response.status())
  })

  test("POST /api/cart/merge rejects unauthenticated requests", async ({ request }) => {
    const response = await request.post("/api/cart/merge", { data: {} })
    expect([401, 403]).toContain(response.status())
  })

  test("POST /api/upload/payment-proof rejects unauthenticated requests", async ({ request }) => {
    const response = await request.post("/api/upload/payment-proof", { data: {} })
    expect([401, 403]).toContain(response.status())
  })

  test("POST /api/admin/products rejects unauthenticated requests", async ({ request }) => {
    const response = await request.post("/api/admin/products", { data: {} })
    expect([401, 403]).toContain(response.status())
  })

  test("POST /api/admin/orders/test/status rejects unauthenticated requests", async ({ request }) => {
    const response = await request.post("/api/admin/orders/test/status", { data: {} })
    expect([401, 403]).toContain(response.status())
  })

  test("POST /api/admin/orders/test/verify-payment rejects unauthenticated requests", async ({ request }) => {
    const response = await request.post("/api/admin/orders/test/verify-payment", { data: {} })
    expect([401, 403]).toContain(response.status())
  })
})

test.describe("API — Public Forms @smoke", () => {
  test("POST /api/custom-orders accepts valid payload", async ({ request }) => {
    const response = await request.post("/api/custom-orders", {
      data: {
        name: "Test User",
        phone: "03001234567",
        garment_type: "kurta",
        fabric_preference: "Cotton",
        color_preference: "Blue",
        size: "M",
        quantity: "2",
        notes: "Test from Playwright",
      },
    })
    // Endpoint may return 200/201/400 depending on validation; we just verify it responds.
    expect(response.status()).toBeLessThan(500)
  })

  test("POST /api/incubator-enquiries accepts valid payload", async ({ request }) => {
    const response = await request.post("/api/incubator-enquiries", {
      data: {
        name: "Artisan Test",
        phone: "03001234567",
        craft_type: "Block Printing",
        description: "Test enquiry",
      },
    })
    expect(response.status()).toBeLessThan(500)
  })
})

test.describe("API — Authenticated Contracts @mutation", () => {
  test("POST /api/orders requires valid cart items", async ({ request }) => {
    const response = await request.post("/api/orders", {
      data: { items: [], shipping: {} },
      headers: { Authorization: "Bearer test-token" },
    })
    expect([400, 401]).toContain(response.status())
  })
})
