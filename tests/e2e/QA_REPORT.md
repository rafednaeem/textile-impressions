# Textile Impressions — Playwright QA Report

> Date: 2026-06-29
> Target production URL: `https://textile-impressions.vercel.app`
> Local URL: `http://localhost:3000` (not exercised — see Local Test Blocker)

## Executive Summary

- Expanded the Playwright suite from **~100 tests to 518 tests** across guest, customer, admin, mobile, a11y, SEO, API-contract, and checkout flows.
- Refactored `playwright.config.ts` to support environment-aware projects (`guest`, `guest-mobile`, `customer`, `customer-mobile`, `admin`, `admin-mobile`, `smoke-prod`).
- Production smoke tests were executed against the live Vercel deployment. Guest-facing tests had **34 passed / 5 failed / 1 flaky**. A full `smoke-prod` run was started but did not complete within 10 minutes due to long page-load times and retries on production.
- Local mutation tests were **blocked** by WSL/Windows Node interop issues (see Local Test Blocker).
- Several concrete bugs and reliability issues were found; recommendations are listed at the end.

## What Was Added / Changed

### New files

| File | Purpose |
|------|---------|
| `tests/e2e/ROUTE_COVERAGE_GAP.md` | Gap audit of every route vs existing coverage |
| `tests/e2e/auth.spec.ts` | Deeper auth validation, signup flow, reset-password flow |
| `tests/e2e/seo.spec.ts` | `sitemap.xml`, `robots.txt`, `manifest.webmanifest`, OG tags |
| `tests/e2e/api.contracts.spec.ts` | API endpoint status-code contracts (read-only + mutation) |
| `tests/e2e/a11y.spec.ts` | Landmark, alt-text, label, and focus checks without new deps |
| `tests/e2e/mobile.spec.ts` | Mobile viewport and hamburger-menu checks |
| `tests/e2e/customer.addresses.spec.ts` | Address CRUD (mocked mutations) |
| `tests/e2e/customer.wishlist.spec.ts` | Wishlist add/remove/empty state |
| `tests/e2e/checkout.spec.ts` | Full checkout flow, COD city logic, discount code |
| `tests/e2e/QA_REPORT.md` | This report |
| `.env.test.example` | Template for test credentials (after rotating real ones) |

### Modified files

| File | Change |
|------|--------|
| `playwright.config.ts` | Added projects for mobile and production smoke; added `@smoke`/`@mutation`/`@a11y`/`@mobile`/`@seo` tag support; removed `smoke-prod` dependency on auth setup because production customer auth was unreliable |
| `tests/e2e/guest.storefront.spec.ts` | Tagged with `@smoke`, added PDP, sort/filter, and landmark checks |
| `tests/e2e/customer.account.spec.ts` | Tagged with `@smoke`/`@mutation`, moved checkout tests out, added order-detail and profile-update tests |
| `tests/e2e/admin.dashboard.spec.ts` | Tagged `@smoke` |
| `tests/e2e/admin.products.spec.ts` | Tagged, added product-edit and mutation tests |
| `tests/e2e/admin.orders.spec.ts` | Tagged, added status update / payment verify/reject tests |
| `tests/e2e/admin.inventory.spec.ts` | Tagged, added inline-save and bulk-update tests |
| `tests/e2e/admin.discounts.spec.ts` | Tagged, added delete flow |
| `tests/e2e/admin.misc.spec.ts` | Tagged all admin navigation/page-load tests, added skills-studio registrations and settings tests |

## Production Smoke Test Results

### Guest project (`--project=guest`)

Command used:
```cmd
set BASE_URL=https://textile-impressions.vercel.app && npx playwright test --project=guest
```

| Metric | Count |
|--------|-------|
| Passed | 34 |
| Failed | 5 |
| Flaky  | 1 |

### Failed / flaky guest tests

| Test | Failure / Why it matters |
|------|--------------------------|
| `Shop › shows product cards or empty state` | Neither product cards nor empty-state text appeared within the wait window. Possible causes: slow data fetch from Supabase, skeleton loader not matched, or missing empty-state copy. |
| `Product Detail › loads PDP for digital-printed-lawn-kurta` | Flaky — sometimes `h1` did not become visible. Indicates PDP loading/rendering inconsistency. |
| `Product Detail › loads PDP for hand-embroidered-silk-clutch` | Same as above, but failed both retries. Product may not exist on production or PDP renders very slowly. |
| `Product Detail › PDP shows price and add-to-cart button` | Heading with `/kurta/i` not found. Suggests PDP content or selector mismatch. |
| `Guest Cart › cart drawer opens` | Pointer-event interception by an overlay (`bg-brand-indigo/55`). Likely a loading spinner/backdrop that does not get removed, blocking clicks. |
| `Skills Studio › workshop cards or empty state is shown` | Neither cards nor empty-state text appeared. Page may load with no workshops and no empty-state copy. |

### Smoke-prod project (`--project=smoke-prod`)

Command used:
```cmd
set BASE_URL=https://textile-impressions.vercel.app && npx playwright test --project=smoke-prod --reporter=list
```

- Started **214 @smoke tests** across storefront, a11y, SEO, API, mobile, and admin.
- Timed out after 10 minutes while running admin dashboard tests (no auth state).
- Observed before timeout:
  - **a11y landmark checks** passed for Home, Shop, Product Detail, Lookbook, Craft Guide, Colors, Skills Studio, Custom Orders, Incubator.
  - **a11y auth-page checks** (Login, Signup, Reset Password) failed on `header`/`footer`/`main` visibility — these auth pages appear to render without the standard layout, which is expected if they use a centered card layout. Tests should be updated to expect no `header`/`footer` on auth pages.
  - **admin @smoke tests** failed as expected because `smoke-prod` no longer depends on auth setup.

## Local Test Blocker

Local mutation tests (`npm run dev` + Playwright) were not executed because the harness environment cannot reliably run Node:

- `node` is not available in the WSL `PATH`; only Windows `node.exe` exists at `C:\Program Files\nodejs\node.exe`.
- Passing `BASE_URL` and other env vars from WSL bash to the Windows Node/Playwright process failed for non-Windows-executable invocations (e.g., `npx` and inline env assignment).
- `cmd.exe /c "set BASE_URL=... && npx playwright ..."` worked for production, but starting and backgrounding a local dev server under Windows cmd from WSL is unreliable in this harness.

**Recommendation:** Run local mutation tests on a machine with native Node available:
```bash
cd store
npm run dev
# separate terminal
npx playwright test --project=customer --project=admin --project=checkout
```

## Security / Config Findings

1. **`.env.test` contains real credentials.** The file is gitignored (`.env*`), but if it has ever been committed, the credentials are in git history. Rotate the customer and admin passwords and replace the file with `.env.test.example` after this run.
2. **`.env.test` had CRLF line endings.** Sourced env files with CRLF can cause shell parsing errors. Convert to LF.
3. **Customer auth setup fails on production.** The customer account in `.env.test` does not successfully redirect to `/account` on the live site. Either the password is wrong, the account does not exist on the production Supabase project, or the post-login redirect logic has changed.
4. **Admin auth setup passes on production.** Admin credentials in `.env.test` are valid for production.

## Gap Audit Summary

See `ROUTE_COVERAGE_GAP.md` for the full matrix. Key uncovered routes before this work:

- `/products/[slug]` PDP — now covered
- `/skills-studio/[slug]` and `/skills-studio/[slug]/book` — not covered
- `/account/orders/[id]` — now covered
- `/admin/products/[id]/edit` — now covered
- `/admin/skills-studio/[id]/registrations` — now covered
- API routes — now have contract tests
- Mobile viewport tests — now covered
- a11y checks — now covered
- SEO/PWA metadata — now covered

## Recommended Changes / Additions / Deletions

### High priority

1. **Fix PDP loading reliability**
   - Add a `data-testid="product-heading"` or `data-testid="product-price"` to `ProductDetailContent.tsx` and update tests to use it.
   - Ensure the PDP shows a stable heading and price quickly; consider adding a loading skeleton and verifying it disappears.

2. **Fix cart drawer click interception**
   - Investigate the `bg-brand-indigo/55` overlay that blocks the cart button. Ensure loading/backdrop states are removed when loading completes.
   - Add `data-testid="cart-trigger"` to the header cart button.

3. **Fix Shop empty-state / product-card detection**
   - Add `data-testid="product-card"` and `data-testid="shop-empty-state"` to `shop/page.tsx` or the product-grid component.
   - Ensure empty state copy includes the text the test expects.

4. **Fix Skills Studio empty state**
   - Add an empty-state message when no workshops exist so the test can detect it.

5. **Resolve customer auth credentials**
   - Verify the `CUSTOMER_EMAIL`/`CUSTOMER_PASSWORD` in `.env.test` against production Supabase Auth.
   - If the account does not exist, create it or update the test credentials.

### Medium priority

6. **Auth pages layout assertions**
   - Update `a11y.spec.ts` to expect no `header`/`footer`/`main` on `/auth/login`, `/auth/signup`, `/auth/reset-password` if those pages intentionally use a centered card layout without the site shell.

7. **Speed up production smoke tests**
   - Reduce `retries` for the `smoke-prod` project or use `workers: 2` for read-only guest tests.
   - Consider splitting `smoke-prod` into `smoke-prod-fast` (guest-only) and `smoke-prod-auth` (requires setup).

8. **Add `data-testid` attributes throughout**
   - Cart trigger, product cards, product heading/price, add-to-cart button, workshop cards, address cards, order rows, admin sidebar links, admin table rows, filter panel, discount-code form.

### Low priority / follow-up

9. **Complete local mutation-test run** once a native Node environment is available.
10. **Add `@axe-core/playwright`** if you are willing to add a dev dependency; it gives far better a11y coverage than manual checks.
11. **Remove real credentials from `.env.test`** and rotate them.

## Commands to Run Going Forward

```bash
# Local full suite
npm run test:e2e

# Local mutation tests only
npx playwright test --project=customer --project=admin --project=checkout

# Production guest smoke tests
set BASE_URL=https://textile-impressions.vercel.app
npx playwright test --project=guest

# Production read-only smoke tests (no auth setup required)
set BASE_URL=https://textile-impressions.vercel.app
npx playwright test --project=smoke-prod

# HTML report
npx playwright show-report
```

## Conclusion

The test suite now provides broad coverage of the Textile Impressions storefront, auth, account, admin, and checkout flows. Production smoke testing surfaced real reliability issues (PDP loading, cart drawer overlay, shop empty state) that should be addressed. Local destructive testing remains the next step once a proper Node runtime is available.
