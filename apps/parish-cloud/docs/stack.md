---
version: 1.1.0
updated: 26.03.2026
---

# Technology Stack - Parish Cloud

---

## Frontend

### Astro (Hybrid: SSG + ISR)

- **Why:** Core of the "Thin Dashboard, Fat CMS" approach. Zero-cost edge caching for static pages, Incremental Static Regeneration (ISR) for instant background updates without full-site rebuilds, perfect Lighthouse scores, and 3-5x smaller bundles. Includes Astro Preview Mode for real-time visual editing.
- **Alternative rejected:** Next.js (heavier client footprint, expensive at scale for multi-site hosting, API routes limited in static exports)

### React

- **Why:** Largest UI ecosystem, works seamlessly with Astro Islands for interactive dashboard components and complex state.

### Tailwind CSS

- **Why:** Utility-first, tiny bundles, rapid UI development for both the main dashboard and templates.

---

## Data Layer

### TanStack Query

- **Why:** Best-in-class data fetching, automatic caching, optimistic updates, perfect Supabase integration

---

## Content Management (CMS)

### Self-Hosted TinaCMS

- **Why:** Git-backed content management, fully self-hostable within Astro API routes, true "schema as config", visual editing capabilities for non-technical users.
- **Alternative rejected:** TinaCMS Cloud / Sanity / Contentful (expensive per-project fees incompatible with a scalable, low-cost multi-tenant architecture)
- **Use for:** "Fat CMS" layer — editing content, switching templates, and managing volunteers inside isolated parish sites.

---

## Infrastructure & Edge

### Cloudflare Pages & CDN

- **Why:** Global edge network, instant ISR cache purging, built-in CI/CD webhooks for build visibility (broadcasted back to the dashboard), $0 cost for static hosting.
- **Alternative rejected:** Vercel (more expensive at scale, strict limits on multi-site provisioning and edge bandwidth without Enterprise tier)

### Automated Git Repositories

- **Why:** Complete data isolation per site. The API automatically forks a master Astro template into a new repo for every provisioned parish.
- **Use for:** Storing code, configuration, and content (Markdown/JSON) independently for every parish website.

---

## Backend & Integrations

### Supabase (PostgreSQL)

- **Why:** Direct client-to-DB (90% of ops), RLS security, real-time built-in, full SQL support
- **Alternative rejected:** Firebase (NoSQL limitations, no joins, must denormalize)

### Supabase Auth

- **Why:** Built-in, $0 cost, Google OAuth + Email/Password, works with RLS

### Astro API Routes

- **Why:** Keeps the backend API layer naturally co-located with the frontend app. Perfect for the Self-Hosted TinaCMS integration.

### Stripe

- **Why:** Industry standard for subscription management, robust API for recurring billing, allows Priests to manage a single unified bill for multiple parish sites.

### Stripe Promo Codes

- **Why:** Secure way to handle "Offline Payments" (checks/invoices). Super Admins generate single-use, 100% discount codes pinned strictly to an account without breaking the core subscription logic.

---

## Monorepo & Package Management

### pnpm

- **Why:** Faster than npm/yarn, efficient disk usage (symlinks), strict dependency resolution.

### Turborepo

- **Why:** High-performance monorepo build system, intelligent caching, parallel task execution.
- **Use for:** Orchestrating builds, linting, and sharing packages between the SaaS Hub and the Master Astro Templates.
