# Textile Impressions — Handcrafted Pakistani Fashion E-Commerce

A full-featured e-commerce platform for a Pakistani fashion brand built with Next.js 16, Supabase, and shadcn/ui.

## Tech Stack

- **Framework**: Next.js 16.2.7 (App Router, Turbopack)
- **Language**: TypeScript (strict mode)
- **Database & Auth**: Supabase (PostgreSQL + SSR auth + Storage)
- **UI**: Tailwind CSS v4, shadcn/ui, Framer Motion, Lucide Icons
- **Forms**: react-hook-form + Zod v4
- **Charts**: Recharts (admin dashboard)
- **Payments**: Bank Transfer, Easypaisa, JazzCash, WhatsApp order
- **Styling**: Warm earth tone palette (#faf7f2, #c1623d, #c48b7d, #1a3a2a)
- **Fonts**: Playfair Display (headings), Inter (body)

## Features

### Storefront
- Responsive, mobile-first design
- Product catalog with category/price filtering and sorting
- Product detail pages with image gallery, size/color selectors
- Shopping cart (guest via localStorage, authenticated via Supabase)
- Wishlist
- Checkout with saved addresses, payment proof upload, WhatsApp integration
- Auth (login, signup, password reset)
- Account dashboard with order history, wishlist, address management

### Admin Dashboard
- KPI dashboard with revenue/order/payment/low-stock metrics
- Orders management with payment verification and status updates
- Product CRUD with image upload, sizes, colors, and variants
- Customer management with order history and addresses
- Inventory tracking with inline editing and bulk updates
- Discount code management

### SEO & Performance
- Dynamic metadata (Open Graph, Twitter cards)
- Structured data (JSON-LD Organization and Product schemas)
- Dynamic sitemap and robots.txt
- PWA manifest
- Next.js image optimization with lazy loading
- Server component caching with revalidation
- Loading skeletons and Suspense boundaries
- Rate limiting on API routes

## Local Setup

### Prerequisites

- Node.js 20+
- npm
- A Supabase account (free tier works)

### Step 1: Clone & Install

```bash
git clone <repo-url>
cd store
npm install
```

### Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your project dashboard, go to **SQL Editor**
3. Open `supabase/migrations/00001_schema.sql` from this repo
4. Copy the entire contents and paste into SQL Editor
5. Run the query — this creates all tables, RLS policies, triggers, and storage buckets

### Step 3: Seed Data (Optional)

```bash
# Run the seed SQL in Supabase SQL Editor
# Open supabase/seed.sql and execute it
```

This creates:
- 1 admin user
- 5 categories
- 10 products with variants and images

### Step 4: Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the values:

```bash
cp .env.local.example .env.local
```

Get your Supabase credentials:
1. Go to **Project Settings → API**
2. Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### Step 5: Run the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Making the First Admin User

### Method 1: SQL (Recommended)

Run this in Supabase SQL Editor (replace the email):

```sql
-- Find the user's ID
SELECT id, email FROM auth.users WHERE email = 'admin@example.com';

-- Update their role to admin
UPDATE public.profiles SET role = 'admin' WHERE id = '<user-id>';

-- The trigger syncs role to auth.users.raw_app_meta_data automatically.
-- You may need to sign out and sign back in for the JWT to refresh.
```

### Method 2: Direct DB Update

1. Sign up as a regular user through the app
2. In Supabase Dashboard → Table Editor → `profiles`
3. Change the user's `role` from `customer` to `admin`
4. Sign out and sign back in

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) | Yes |
| `NEXT_PUBLIC_STORE_NAME` | Store display name | Yes |
| `NEXT_PUBLIC_BASE_URL` | Site URL (e.g., https://yourdomain.com) | Yes |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp business number (format: 923XXXXXXXXX) | Yes |
| `NEXT_PUBLIC_BANK_NAME` | Bank name for payment info | No |
| `NEXT_PUBLIC_BANK_ACCOUNT` | Bank account number | No |
| `NEXT_PUBLIC_BANK_IBAN` | Bank IBAN | No |
| `NEXT_PUBLIC_EASYPAISA_NUMBER` | Easypaisa account number | No |
| `NEXT_PUBLIC_JAZZCASH_NUMBER` | JazzCash account number | No |

## Project Structure

```
store/
├── src/
│   ├── app/
│   │   ├── (admin)/          # Admin dashboard layout + pages
│   │   ├── (store)/          # Storefront layout + pages
│   │   │   ├── account/      # User account pages
│   │   │   ├── checkout/     # Checkout flow
│   │   │   ├── products/     # Product detail
│   │   │   └── shop/         # Product listing
│   │   ├── admin/            # Admin routes
│   │   ├── api/              # API routes
│   │   ├── auth/             # Authentication pages
│   │   ├── sitemap.ts        # Dynamic sitemap
│   │   ├── robots.ts         # Robots.txt
│   │   ├── manifest.ts       # PWA manifest
│   │   ├── not-found.tsx     # 404 page
│   │   ├── error.tsx         # Error page
│   │   ├── global-error.tsx  # Global error page
│   │   └── globals.css       # Tailwind CSS configuration
│   ├── components/
│   │   ├── admin/            # Admin components
│   │   ├── shared/           # Shared components (AuthGuard)
│   │   ├── store/            # Store components (Header, Footer, ProductCard, CartDrawer)
│   │   └── ui/               # shadcn/ui components
│   ├── hooks/                # React hooks (useCart)
│   ├── lib/
│   │   ├── supabase/         # Supabase clients (client, server, middleware)
│   │   ├── admin/            # Server actions for admin
│   │   ├── constants.ts      # Store constants
│   │   ├── rate-limit.ts     # API rate limiting
│   │   └── validations.ts    # Zod schemas
│   └── types/                # TypeScript types
├── supabase/
│   └── migrations/           # Database schema SQL
├── .env.local.example        # Environment variables template
├── middleware.ts             # Auth + admin role protection
└── package.json
```

## Deployment (Vercel)

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Set the **Root Directory** to `store`
4. Add all environment variables from `.env.local.example`
5. Set `NEXT_PUBLIC_BASE_URL` to your Vercel domain
6. Deploy!

### Post-Deployment

1. Update Supabase Auth settings:
   - Go to **Authentication → Settings**
   - Add your Vercel domain to **Site URL**
   - Add redirect URLs (e.g., `https://your-domain.vercel.app/auth/callback`)

2. Enable email confirmations if desired (default: off)

## License

Private — All rights reserved.
