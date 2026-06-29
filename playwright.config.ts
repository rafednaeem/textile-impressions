import { defineConfig, devices } from "@playwright/test"

/**
 * Textile Impressions - Playwright E2E Test Config
 *
 * Environment variables:
 *   BASE_URL              Target site URL (default: http://localhost:3000)
 *   CUSTOMER_EMAIL        Existing customer account email
 *   CUSTOMER_PASSWORD     Existing customer account password
 *   ADMIN_EMAIL           Existing admin account email
 *   ADMIN_PASSWORD        Existing admin account password
 *
 * Run locally (full suite):
 *   npm run test:e2e
 *
 * Run production smoke tests only:
 *   BASE_URL=https://textile-impressions.vercel.app npx playwright test --project=smoke-prod
 *
 * Run a single project:
 *   npx playwright test --project=guest
 *
 * Tags:
 *   @smoke     Safe, read-only tests that can run against production.
 *   @mutation  Tests that create/update/delete data; run locally only.
 *   @a11y      Accessibility checks.
 *   @mobile    Mobile viewport checks.
 *   @seo       SEO/PWA metadata checks.
 */

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  retries: process.env.CI ? 2 : 1,
  workers: 1, // sequential to avoid DB/auth conflicts
  reporter: [
    ["html", { open: "never" }],
    ["list"],
  ],

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    // Shared auth setup - saves customer.json and admin.json storage states
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },

    // Guest tests (no auth) - desktop
    {
      name: "guest",
      testMatch: /.*guest.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },

    // Guest tests - mobile
    {
      name: "guest-mobile",
      testMatch: /.*guest.*\.spec\.ts/,
      use: { ...devices["Pixel 5"] },
    },

    // Customer tests (logged-in customer) - desktop
    {
      name: "customer",
      testMatch: /.*customer.*\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/customer.json",
      },
    },

    // Customer tests - mobile
    {
      name: "customer-mobile",
      testMatch: /.*customer.*\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Pixel 5"],
        storageState: "tests/e2e/.auth/customer.json",
      },
    },

    // Admin tests (logged-in admin) - desktop
    {
      name: "admin",
      testMatch: /.*admin.*\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/admin.json",
      },
    },

    // Admin tests - mobile
    {
      name: "admin-mobile",
      testMatch: /.*admin.*\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Pixel 5"],
        storageState: "tests/e2e/.auth/admin.json",
      },
    },

    // Production smoke tests - public/read-only checks only.
    // Protected customer/admin suites run in their own projects with setup credentials.
    {
      name: "smoke-prod",
      testMatch: [
        /.*guest\.storefront\.spec\.ts/,
        /.*a11y\.spec\.ts/,
        /.*seo\.spec\.ts/,
        /.*mobile\.spec\.ts/,
        /.*api\.contracts\.spec\.ts/,
      ],
      grep: /@smoke/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
