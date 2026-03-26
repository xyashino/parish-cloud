---
version: 1.0.0
updated: 15.03.2026
---

# Domain Map — Parish Cloud

> This document defines the **Bounded Contexts** (domains) for the Parish Cloud platform. Each domain represents a distinct area of business responsibility with clear ownership, internal concepts, and explicit integration points with other domains. This is the authoritative reference for architectural decision-making and feature placement.

---

## Architecture Overview

Parish Cloud consists of two distinct layers:

- **SaaS Layer** — Built and owned by us. Handles account management, billing, provisioning, and the main dashboard.
- **Per-Site Layer** — Each provisioned parish site runs its own isolated stack (Astro app + TinaCMS backend). We configure and deploy it; TinaCMS operates it.

```
┌─────────────────────────────────────────────────────┐
│                     SaaS Layer                      │
│  Account · Auth · Billing · Provisioning · Dashboard│
└──────────────────────┬──────────────────────────────┘
                       │ provisions
          ┌────────────▼────────────┐
          │   Per-Site Layer        │
          │  TinaCMS Integration    │
          │  Template System        │
          │  Edge Infrastructure    │
          └─────────────────────────┘
```

---

## Domain List

| #   | Domain                          | Layer        | Short Description                                      |
| --- | ------------------------------- | ------------ | ------------------------------------------------------ |
| 1   | Account Management              | SaaS         | Priest/Admin identity, account lifecycle, trial state  |
| 2   | Authentication                  | SaaS         | SaaS login, sessions, route guards                     |
| 3   | Site Provisioning               | SaaS         | Git repo forking, subdomain assignment, isolation      |
| 4   | Main Dashboard (Hub)            | SaaS         | Central UI: site list, details, status, CMS routing    |
| 5   | Billing & Subscriptions         | SaaS         | Stripe, tiers, trial logic, offline payments           |
| 6   | Build Pipeline & Webhooks       | SaaS + Infra | Cloudflare webhooks, build status, cache purging       |
| 7   | Edge Infrastructure & Rendering | Per-Site     | Astro SSG/ISR, CDN, hybrid rendering                   |
| 8   | TinaCMS Integration             | Per-Site     | Self-hosted backend, schema, template config           |
| 9   | Template System                 | Per-Site     | Master Astro templates, dynamic routing per template   |
| 10  | Super Admin Panel               | SaaS         | Platform analytics, promo codes, master service access |

---

## 1. Account Management

### Purpose

Manages the **identity and lifecycle of a Priest account** within the SaaS platform. An account is the top-level entity that owns one or more parish sites and a subscription.

### Owns

- `Account` entity (Priest profile, email, account state)
- Account lifecycle states: `trial` → `active` → `past_due` → `cancelled`
- Trial period: start date, expiration date, days remaining
- Relationship between an account and its provisioned sites (ownership)
- Account creation (self-service signup flow)

### Does NOT Own

- Login sessions or tokens → **Authentication**
- Subscription tier details or payment methods → **Billing & Subscriptions**
- The sites themselves → **Site Provisioning**
- TinaCMS collaborators (volunteers) → **TinaCMS Integration**

### Key Entities

- `Account` — `{ id, email, role: Priest | SuperAdmin, state, trialEndsAt, createdAt }`
- `AccountState` — `trial | active | past_due | cancelled`

### Relevant Requirements

- `FR-ACCT-001` — Trial account creation
- `FR-ACCT-002` — Trial expiration behavior (sites inaccessible, no data deleted)

### Integration Points

| Domain            | How                                                       |
| ----------------- | --------------------------------------------------------- |
| Authentication    | Provides `Account` identity after login                   |
| Billing           | Notified when account state changes (trial → active)      |
| Site Provisioning | Account ownership gates how many sites can be provisioned |

---

## 2. Authentication

### Purpose

Handles **proving who the user is** at the SaaS layer. This is entirely separate from TinaCMS's own auth system, which handles `/admin` access independently.

### Owns

- Signup / Login flows (email + password or OAuth)
- SaaS session management (JWT or server-side sessions)
- Password reset flow
- Route guards for the main dashboard (authenticated vs. public routes)
- Role enforcement at SaaS level: `Priest` vs. `SuperAdmin`

### Does NOT Own

- The `Account` entity → **Account Management**
- TinaCMS `/admin` login or volunteer sessions → **TinaCMS Integration**
- What a Priest is allowed to do based on their subscription → **Billing**

### Key Concepts

- **SaaS Session** — Independent of TinaCMS. A Priest can be logged into the main dashboard without being logged into any TinaCMS instance.
- **Role** — Determined at account level (`Priest` or `SuperAdmin`), enforced on all SaaS routes.

### Relevant Requirements

- Implied by all user stories requiring login (`US-DASH-001`, `US-BILL-001`, etc.)

### Integration Points

| Domain             | How                                                   |
| ------------------ | ----------------------------------------------------- |
| Account Management | Reads `Account` to verify identity and determine role |
| Main Dashboard     | Gates all dashboard routes behind an active session   |
| Super Admin Panel  | Restricts access to `SuperAdmin` role only            |

---

## 3. Site Provisioning

### Purpose

Handles the **automated creation and management of isolated infrastructure** for each parish website. This is the core technical pipeline that makes multi-site management possible.

### Owns

- `Site` entity (metadata, subdomain, Git repo URL, status, owning account)
- Automated forking of the master Astro template into a new isolated Git repository via API
- Subdomain assignment: `[parish].parafia.cloud`
- Site status lifecycle: `provisioning` → `building` → `live` → `suspended`
- Tier limit enforcement (how many sites an account can provision)
- Site suspension when a trial expires or subscription lapses

### Does NOT Own

- The Git repository contents after provisioning → **TinaCMS Integration** + **Template System**
- The CDN/edge layer → **Edge Infrastructure**
- Build/deploy status tracking → **Build Pipeline & Webhooks**
- Payment gating logic → **Billing & Subscriptions**

### Key Entities

- `Site` — `{ id, accountId, name, subdomain, repoUrl, status, createdAt }`
- `SiteStatus` — `provisioning | building | live | suspended`

### Relevant Requirements

- `FR-PROV-001` — Automated provisioning (fork repo, assign subdomain, provision infrastructure)

### Integration Points

| Domain                  | How                                                          |
| ----------------------- | ------------------------------------------------------------ |
| Account Management      | Checks account ownership; links site to account              |
| Billing & Subscriptions | Checks active tier before allowing new site creation         |
| Build Pipeline          | Receives webhook events after provisioning triggers a build  |
| TinaCMS Integration     | Each provisioned repo contains a self-hosted TinaCMS backend |

---

## 4. Main Dashboard (Hub)

### Purpose

The **"thin" central UI** of the SaaS platform. It is a lightweight orchestration layer — it does not manage state itself but routes the Priest to the right tools: CMS editor, billing, build status.

### Owns

- Site Manager Hub UI (list/grid of all Priest's sites)
- Site Detail view (preview, build status, "Edit Website" CTA)
- Live Build Status display (reading webhook data)
- Published site preview (iframe or redirect to live URL)
- "Add New Website" flow (triggers provisioning)
- "Edit Website" button routing to the site's `/admin` TinaCMS route

### Does NOT Own

- Actual build logic or webhook ingestion → **Build Pipeline & Webhooks**
- Site provisioning logic → **Site Provisioning**
- Billing UI → **Billing & Subscriptions**
- Any content management → **TinaCMS Integration**

### Relevant Requirements

- `FR-DASH-001` — Site Manager Hub list
- `FR-DASH-002` — Live Build Status via Cloudflare webhooks
- `FR-DASH-003` — Direct CMS Routing via "Edit Website" button

### Integration Points

| Domain              | How                                                                  |
| ------------------- | -------------------------------------------------------------------- |
| Site Provisioning   | Triggers provisioning on "Add New Website"                           |
| Build Pipeline      | Reads live build status per site                                     |
| Billing             | Shows trial countdown; gates "Add Site" behind tier check            |
| TinaCMS Integration | "Edit Website" redirects to `/admin` of the correct TinaCMS instance |

---

## 5. Billing & Subscriptions

### Purpose

Handles all **monetization logic** — trial management, subscription tiers, Stripe integration, and offline payment support.

### Owns

- `Subscription` entity linked to an account
- Stripe Customer, Subscription, and Invoice management
- Trial countdown tracker (synced with Account state)
- Tier definitions: `trial`, `basic` (MVP); `advanced` (post-MVP)
- Tier gating: restricts number of sites per tier
- Offline payment flow: generating single-use 100% discount Stripe Promo Codes pinned to an account
- Billing Portal UI (within the main dashboard)

### Does NOT Own

- Account state transition logic → **Account Management** (Billing notifies it)
- Site suspension on non-payment → **Site Provisioning** (Billing signals it)

### Key Entities

- `Subscription` — `{ id, accountId, stripeSubscriptionId, tier, status, currentPeriodEnd }`
- `Tier` — `trial | basic | advanced`
- `PromoCode` — `{ id, stripePromoCodeId, accountId, usedAt }`

### Relevant Requirements

- `FR-BILL-001` — Basic subscription tier definition
- `FR-BILL-002` — Unified Stripe billing portal
- `FR-ADMN-002` — Offline Activation Engine (Stripe promo codes)

### Integration Points

| Domain             | How                                                                    |
| ------------------ | ---------------------------------------------------------------------- |
| Account Management | Notifies of subscription state changes to update `AccountState`        |
| Site Provisioning  | Signals when a site should be suspended (payment lapse) or reactivated |
| Super Admin Panel  | Super Admin triggers promo code generation for offline accounts        |

---

## 6. Build Pipeline & Webhooks

### Purpose

Bridges the **per-site deployment lifecycle** with the SaaS dashboard. Tracks and broadcasts build/deploy status from Cloudflare back to the Hub.

### Owns

- Cloudflare webhook ingestion endpoint
- Build status store per site: `idle | building | ready | failed`
- ISR cache purge trigger events (after TinaCMS content commits)
- Live status updates pushed to the Main Dashboard (polling or WebSocket/SSE)

### Does NOT Own

- The CDN or ISR cache itself → **Edge Infrastructure & Rendering**
- The dashboard UI displaying the status → **Main Dashboard**
- Git commit triggering → **TinaCMS Integration**

### Key Concepts

- **Cloudflare Webhook** — Sent by Cloudflare Pages/Workers on build start, success, or failure. Ingested, stored, and forwarded to the dashboard.
- **ISR Cache Purge** — Triggered after a TinaCMS content save commits to Git, causing the Edge CDN to revalidate the affected page instantly.

### Relevant Requirements

- `FR-DASH-002` — Live Build Status display

### Integration Points

| Domain              | How                                                                 |
| ------------------- | ------------------------------------------------------------------- |
| Main Dashboard      | Pushes current build status per site for UI display                 |
| Edge Infrastructure | Triggers cache purge on successful deploy                           |
| TinaCMS Integration | Content saves in TinaCMS trigger Git commits, which initiate builds |

---

## 7. Edge Infrastructure & Rendering

### Purpose

Defines the **rendering architecture** of each deployed parish website — how pages are generated, cached, and served at the edge.

### Owns

- Astro hybrid rendering configuration per site
- Static Site Generation (SSG) for layout-level pages (zero-cost edge caching)
- Incremental Static Regeneration (ISR) for content pages (Stale-While-Revalidate)
- Edge CDN configuration and global deployment
- Cache invalidation strategy (per-page, not full-site rebuilds)

### Does NOT Own

- Content data → **TinaCMS Integration**
- Template design/routing → **Template System**
- Build/deploy triggers → **Build Pipeline & Webhooks**

### Key Concepts

- **SSG** — Core layout shells are pre-built. Zero runtime cost. Served from edge cache.
- **ISR** — When a content page is requested after a cache invalidation, it is regenerated in the background while the stale version is still served instantly. No full-site rebuild needed.
- **Astro Preview Mode** — Used inside the TinaCMS editor only; bypasses the CDN cache to show real-time draft content.

### Relevant Requirements

- `FR-TINA-003` — Instant Publishing via ISR (no full CI/CD rebuild)

---

## 8. TinaCMS Integration

### Purpose

The **configuration and self-hosted backend layer** that powers each parish site's CMS. TinaCMS itself handles content editing, user invitations, sessions, and media natively. Our responsibility is to configure, deploy, and integrate the self-hosted backend per provisioned site.

### Owns

- Self-hosted TinaCMS Astro API backend (one per site, inside the isolated Git repo)
- Content schema definitions (`tina.config.ts`): collections, fields, templates
- Template switching configuration (global `siteSettings` collection with template selector)
- TinaCMS collaborator access setup (service account auto-invite on provisioning)
- Integration between TinaCMS Git commits and our Build Pipeline

### What TinaCMS Handles Natively (NOT our code)

- `/admin` login and session management for Priests and Volunteers
- Volunteer invitation flow via email
- Visual content editing UI
- Git commit on content save
- Media uploads and management
- Real-time preview (Astro Preview Mode integration)

### Key Concepts

- **Self-Hosted Backend** — Each site runs its own Astro API route (`/api/tina`) that acts as the TinaCMS GraphQL backend. This replaces the paid TinaCMS Cloud subscription entirely.
- **Isolated Instance** — Each parish site has a completely independent TinaCMS instance, ensuring data and user access do not overlap between parishes.
- **Schema as Config** — The `tina.config.ts` file defines all content types (pages, announcements, events, settings). Changing this is a template-level concern, versioned in the master Astro template repo.

### Relevant Requirements

- `FR-TINA-001` — Template Switching via TinaCMS global settings
- `FR-TINA-002` — Visual Editing (Astro Preview Mode)
- `FR-TINA-003` — Instant Publishing via ISR after Git commit
- `FR-ORGN-001` — Volunteer access management (configured via TinaCMS collaborators)
- `FR-ADMN-003` — Master service account auto-invited to every TinaCMS instance

### Integration Points

| Domain              | How                                                                      |
| ------------------- | ------------------------------------------------------------------------ |
| Site Provisioning   | Each new Git repo contains the pre-configured TinaCMS backend            |
| Template System     | `tina.config.ts` references which template is active via global settings |
| Build Pipeline      | TinaCMS Git commits trigger Cloudflare builds and ISR cache purges       |
| Edge Infrastructure | TinaCMS Preview Mode bypasses the ISR cache for draft content            |

---

## 9. Template System

### Purpose

Manages the **visual design layer** of parish websites — the master Astro templates that define the look and feel. Switching templates changes the entire site's UI without touching the content.

### Owns

- Master Astro template repository (the source fork target for all provisioned sites)
- Template variants: `modern`, `traditional` (and future additions)
- Dynamic routing: Astro routes content through the correct template wrapper based on the `siteSettings.template` value
- Template versioning: updates to the master template can be propagated to existing sites via Git merges

### Does NOT Own

- Content data → **TinaCMS Integration**
- Template selection UI → **TinaCMS Integration** (exposed as a TinaCMS global settings field)
- CDN caching of rendered output → **Edge Infrastructure**

### Key Concepts

- **Template Isolation** — Content schema remains identical across all templates. Only the Astro layout wrappers (`layouts/Modern.astro`, `layouts/Traditional.astro`) change.
- **Zero Content Loss** — Switching templates is a config change only; all underlying content (stored in Git as markdown/JSON) is preserved.

### Relevant Requirements

- `FR-TINA-001` — Template Switching (exposed via TinaCMS global settings; rendered via this domain)

---

## 10. Super Admin Panel

### Purpose

Internal tooling for the **platform operator** (us) to monitor platform health, manage offline payments, and provide technical support to any parish site.

### Owns

- Super Admin-only dashboard UI (protected by `SuperAdmin` role)
- Platform analytics: total accounts, total sites, active/past-due subscriptions, MRR
- Stripe Promo Code generator: creates single-use, 100% discount codes pinned to a specific Priest account for offline payment activation
- Master service account management: ensures the service account has collaborator access to every TinaCMS instance for support

### Does NOT Own

- Stripe API integration internals → **Billing & Subscriptions**
- TinaCMS collaborator management logic → **TinaCMS Integration**
- Account state changes → **Account Management**

### Relevant Requirements

- `FR-ADMN-001` — Admin Metrics (accounts, sites, subscriptions, MRR)
- `FR-ADMN-002` — Offline Activation Engine (Stripe promo code generation)
- `FR-ADMN-003` — Master Service Account access to all TinaCMS instances

### Integration Points

| Domain                  | How                                                         |
| ----------------------- | ----------------------------------------------------------- |
| Billing & Subscriptions | Delegates promo code generation to Billing domain           |
| Account Management      | Reads account and site counts for metrics                   |
| TinaCMS Integration     | Verifies/repairs master service account collaborator access |

---

## Cross-Domain Boundaries — Quick Reference

| Question                            | Answer (Domain)                          |
| ----------------------------------- | ---------------------------------------- |
| Who owns the `Account` entity?      | Account Management                       |
| Who handles the SaaS login session? | Authentication                           |
| Who owns the `Site` entity?         | Site Provisioning                        |
| Who handles TinaCMS `/admin` login? | TinaCMS (native)                         |
| Who defines content schema?         | TinaCMS Integration                      |
| Who invites volunteers?             | TinaCMS Integration (configures TinaCMS) |
| Who gates site creation by tier?    | Billing checks → Site Provisioning       |
| Who triggers ISR cache purge?       | Build Pipeline & Webhooks                |
| Who defines template variants?      | Template System                          |
| Who generates offline promo codes?  | Super Admin Panel → Billing              |
