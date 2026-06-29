# Textile Impressions — Route Coverage Gap Analysis

> Generated as part of the Playwright QA expansion.
> Status: `covered` / `partial` / `missing` / `env-restricted` (read-only on production).

## Legend

- **Covered**: At least one meaningful test exists today.
- **Partial**: Page loads are tested but no functional/edge-case coverage.
- **Missing**: No test exists.
- **Env-restricted**: Only safe against localhost; production gets no mutation tests.

## Storefront (public) routes

| Route | Status | Notes / What is missing |
|-------|--------|-------------------------|
| `/` | covered | Hero, header, footer, WhatsApp button. |
| `/shop` | partial | Loads and filters by URL; missing: sort, price filter, pagination, empty state assertions, mobile layout. |
| `/products/[slug]` | missing | PDP is not directly tested. Need: image gallery, size/color selectors, price/sale price, add-to-cart with variants, breadcrumbs, meta tags, related products. |
| `/colors` | partial | Page-load only; missing color swatch interaction and a11y checks. |
| `/craft-guide` | partial | Page-load only; missing content assertions. |
| `/lookbook` | partial | Page-load only; missing image visibility and mobile layout. |
| `/skills-studio` | partial | Page-load only; missing workshop cards and navigation to detail page. |
| `/skills-studio/[slug]` | missing | Workshop detail page has no coverage. |
| `/skills-studio/[slug]/book` | missing | Workshop booking form has no coverage. |
| `/custom-orders` | partial | Form loads and submits (mocked); missing file upload, validation edge cases, WhatsApp link. |
| `/incubator` | partial | Form loads and submits (mocked); missing validation and a11y. |
| `/checkout` | partial | Empty-cart redirect tested; full checkout flow exists in `customer.account.spec.ts` but should move to dedicated `checkout.spec.ts`. Missing: discount code, bank transfer upload, Easypaisa/JazzCash, order review. |
| `/auth/login` | covered | Loads, validation, wrong credentials, links. |
| `/auth/signup` | partial | Loads, validation, password toggle, link; missing: successful signup flow, password-strength hints, terms checkbox. |
| `/auth/reset-password` | partial | Page loads; missing: email validation, success state. |

## Customer (authenticated) routes

| Route | Status | Notes / What is missing |
|-------|--------|-------------------------|
| `/account` | partial | Loads, welcome message, recent orders; missing: profile update, mobile layout, sidebar a11y. |
| `/account/orders` | partial | Loads; missing: order detail navigation, pagination, status filter. |
| `/account/orders/[id]` | missing | Order detail page has no coverage. |
| `/account/addresses` | partial | Page loads; missing: add/edit/delete address, set default, validation, empty state. |
| `/account/wishlist` | partial | Page loads; missing: add/remove product, empty state, move to cart. |

## Admin (authenticated) routes

| Route | Status | Notes / What is missing |
|-------|--------|-------------------------|
| `/admin` | covered | KPI cards, charts, quick links. |
| `/admin/products` | partial | List, search, filter, action menu; missing: pagination, bulk actions. |
| `/admin/products/new` | partial | Page loads; missing: full form validation and save (mocked). |
| `/admin/products/[id]/edit` | missing | Edit product form has no coverage. |
| `/admin/orders` | partial | List, filters, search; missing: pagination, export. |
| `/admin/orders/[id]` | partial | Detail loads; missing: status update, payment verify/reject, customer communication. |
| `/admin/inventory` | partial | List, sort, search, select all; missing: inline save, bulk update save. |
| `/admin/discounts` | partial | List, new code form (mocked); missing: delete, toggle active, edit. |
| `/admin/customers` | partial | Page-load + table/empty state; missing: customer detail, order history, pagination. |
| `/admin/artisans` | partial | Page-load only. |
| `/admin/collections` | partial | Page-load only. |
| `/admin/custom-orders` | partial | Page-load only. |
| `/admin/incubator-enquiries` | partial | Page-load only. |
| `/admin/skills-studio` | partial | Page-load + new-workshop link; missing: workshop list actions. |
| `/admin/skills-studio/new` | partial | Navigation only; missing form. |
| `/admin/skills-studio/[id]/registrations` | missing | No coverage. |
| `/admin/ugc-photos` | partial | Page-load only. |
| `/admin/settings` | partial | Page-load only; missing: form fields and save. |

## API routes

All API routes are **missing** dedicated contract tests. They are currently exercised only indirectly through UI tests.

| Route | Safe on prod? | Notes |
|-------|---------------|-------|
| `GET/POST /api/orders` | read-only GET | POST is destructive. |
| `GET /api/orders/[id]` | read-only |  |
| `POST /api/cart/merge` | no | Destructive. |
| `POST /api/custom-orders` | no | Sends WhatsApp message; mock. |
| `POST /api/incubator-enquiries` | no | Sends WhatsApp message; mock. |
| `POST /api/workshops/register` | no | Mutation. |
| `POST /api/upload/payment-proof` | no | File upload. |
| `GET/POST /api/admin/products` | read-only GET | POST/PUT/PATCH destructive. |
| `GET/PUT/DELETE /api/admin/products/[id]` | no | Destructive. |
| `POST /api/admin/upload/product-image` | no | File upload. |
| `POST /api/admin/orders/[id]/status` | no | Destructive. |
| `POST /api/admin/orders/[id]/verify-payment` | no | Destructive. |
| `GET /api/auth/callback` | read-only | OAuth callback; needs mocked code. |

## SEO / metadata / PWA

| Route | Status | Notes |
|-------|--------|-------|
| `/sitemap.xml` | missing | Dynamic sitemap not tested. |
| `/robots.txt` | missing | Dynamic robots not tested. |
| `/manifest.webmanifest` | missing | PWA manifest not tested. |

## Cross-cutting concerns

| Concern | Status | Notes |
|---------|--------|-------|
| Mobile responsiveness | missing | No mobile viewport tests exist. |
| Accessibility (a11y) | missing | No landmark, alt-text, focus, or color-contrast tests exist. |
| Rate limiting | missing | `/api/*` rate-limit behavior not tested. |
| Error boundaries | missing | `error.tsx` / `global-error.tsx` not tested. |
| Loading states | partial | Skeletons observed implicitly but not asserted. |

## Coverage summary

- **Total app routes**: ~35 page routes (including dynamic segments).
- **Covered**: 8
- **Partial**: 20
- **Missing**: 7
- **API routes missing**: 14

## Recommendations from gap audit

1. Add dedicated `products/[slug]` smoke + functional tests.
2. Add `/skills-studio/[slug]` and `/skills-studio/[slug]/book` tests.
3. Add `/account/orders/[id]` and full address/wishlist CRUD tests.
4. Add `/admin/products/[id]/edit` and `/admin/skills-studio/[id]/registrations` smoke tests.
5. Add API contract tests that run read-only on production and destructive tests locally.
6. Add `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` SEO tests.
7. Add mobile and a11y cross-cutting specs.
8. Introduce grep tags (`@smoke`, `@mutation`, `@a11y`, `@mobile`, `@seo`) so CI can split runs by environment and risk.
