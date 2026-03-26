---
version: 1.0.0
updated: 15.03.2026
---

# Product Requirements Document (PRD) - Parish Cloud

## Table of Contents

1.  Glossary
2.  Shared Concepts
3.  Project Overview
4.  User Problem
5.  Functional Requirements
6.  Project Scope
7.  User Stories
8.  Success Metrics

## 1. Glossary

- **Astro:** A modern web framework that helps build fast, content-focused websites, resulting in zero-cost edge caching.
- **Git:** A version control system that tracks code changes. In this project, it backs up and securely manages all website data automatically.
- **Headless CMS:** A backend content management system where the content repository is separated ("headless") from the front-end display.
- **ISR (Incremental Static Regeneration):** A technical strategy that allows individual pages of a website to be updated quickly in the background without needing to rebuild the entire site.
- **Monorepo:** A single repository containing the code for multiple projects or components.
- **MRR:** Monthly Recurring Revenue, a financial metric for subscription businesses.
- **SaaS:** Software-as-a-Service, a distribution model where applications are hosted by a provider and made available over the internet.
- **SSG (Static Site Generation):** A way of generating websites where the web pages are fully built in advance, making them load instantly.
- **TinaCMS:** A user-friendly, visual content management system that integrates with Git to track changes securely.
- **Turborepo:** A high-performance build system used to speed up and manage complex monorepo codebases.

## 2. Shared Concepts

- **"Thin Dashboard, Fat CMS":** The core philosophy of Parish Cloud's architecture. The main SaaS dashboard is straightforward and lightweight ("thin"), focusing purely on account management, billing, and handling site previews. Actual website editing, template management, and volunteer coordination occur deep inside isolated, site-specific TinaCMS editor instances ("fat").
- **Multi-Site Hub:** Priests often oversee several parishes simultaneously. The platform provides a unified view where a single Priest can manage multiple, independent parish websites and pay one consolidated bill from a single login.
- **Offline Payments Strategy:** Not all parishes can pay via conventional online methods like Stripe. To accommodate check or invoice payments, Super Admins can securely issue single-use, 100% discount Stripe Promotion Codes pinned strictly to an account.

## 3. Project Overview

Parish Cloud is a specialized Software-as-a-Service (SaaS) platform enabling Catholic parishes to deploy professional, maintenance-free websites. It uses a **"Thin Dashboard, Fat CMS"** approach: the main SaaS dashboard acts as a Hub handling provisioning, billing, and live site previews, while all site management (templates, publishing, volunteers) happens directly inside isolated TinaCMS instances.

In the MVP phase, Priests can manage multiple parish websites under a single account. They create sites via a self-service onboarding flow. Accounts start on a free trial, after which Priests subscribe to a tier to keep sites live. The technical foundation relies on a Turborepo monorepo, Astro for lightning-fast frontend delivery, and a Self-Hosted TinaCMS backend.

## 4. User Problem

Catholic parishes struggle to maintain a professional and modern web presence. The core pain points include:

- **Technically unfriendly platforms:** Most parish websites are built on WordPress, which demands ongoing technical maintenance that parish staff are not equipped to handle.
- **High cost, low value:** Existing solutions are expensive relative to the limited functionality parishes actually need.
- **Outdated, cookie-cutter designs:** Agencies tend to offer generic templates with an outdated look and feel.
- **Managing Multiple Sites:** Priests who oversee multiple parishes currently have to juggle multiple disparate logins, hosting providers, and bills.

In essence, parishes are stuck choosing between expensive, overly complex platforms they can't manage and cheap, templated sites that look outdated.

## 5. Functional Requirements

- **FR-ACCT-001 (Trial Account):** Accounts must start on a free trial period (e.g., 14/30 days) allowing the creation of 1 website.
- **FR-ACCT-002 (Trial Expiration):** Following trial expiration, public parish sites must become inaccessible until a subscription is activated, with no data deleted.
- **FR-BILL-001 (Basic Subscription):** The system must offer a "Basic" paid tier allowing 1 website per account on a `[parish].parafia.cloud` subdomain.
- **FR-BILL-002 (Unified Billing):** The Main Dashboard must provide a Stripe billing portal to view trial countdowns, update payment methods, select subscription tiers based on site count, and view invoices.
- **FR-DASH-001 (Site Manager Hub):** The Main Dashboard must display a list or grid of all active parish websites assigned to the Priest.
- **FR-PROV-001 (Automated Provisioning):** Adding a new site must automatically fork a new Git repository, assign a subdomain, and provision independent infrastructure.
- **FR-DASH-002 (Live Build Status):** The Main Dashboard must utilize Cloudflare webhooks to display visual loading indicators and confirmed statuses during site builds.
- **FR-DASH-003 (Direct CMS Routing):** The site details view must have an "Edit Website" button that routes users directly to the `/admin` path of the respective TinaCMS instance.
- **FR-TINA-001 (Template Switching):** The TinaCMS settings must include a dropdown to switch website templates globally, rendering new visual wrappers without altering content.
- **FR-TINA-002 (Visual Editing):** The CMS editor must utilize Astro Preview Mode so that users can instantly see real-time graphical changes while updating content.
- **FR-TINA-003 (Instant Publishing):** Saved changes must be committed to Git and bypass whole-site CI/CD build delays, utilizing ISR to instantly deploy updates to the specific cached page.
- **FR-ORGN-001 (Volunteer Management):** Priests must be able to invite collaborators via email, restricting volunteer access strictly to content editing without template or billing capabilities.
- **FR-ADMN-001 (Admin Metrics):** The Super Admin Dashboard must summarize total accounts, total websites, active/past-due subscriptions, and MRR.
- **FR-ADMN-002 (Offline Activation Engine):** Super Admins must be able to automatically generate and assign restricted, single-use 100% discount Stripe promo codes to a target Priest's account.
- **FR-ADMN-003 (Master Service Access):** A master service account must automatically receive collaborator access to all provisioned TinaCMS instances for debugging and support.

## 6. Project Scope

### In Scope for MVP

- Priest self-service signup, trial access, and subscription payment processing via Stripe.
- The Main "Site Manager Hub" dashboard for managing multiple parish infrastructures from one login.
- Automated repository provisioning and free subdomains (`[parish].parafia.cloud`).
- Independent visual editing interfaces via a Self-Hosted TinaCMS wrapper.
- Instant page publishing utilizing Astro and ISR cache invalidation.
- Hierarchical access management per site (Priest / Volunteer).
- Super Admin tools: metrics dashboard and offline activation promo codes.

### Out of Scope for MVP

- Custom Domain mapping (e.g., `www.stjohn.com`).
- Advanced automated tier subscription management to instantly support 3+ sites (handled via upgrades post-MVP).
- Deep analytics or visitor tracking specific to the published parish websites.
- In-app technical support ticketing widgets.

## 7. User Stories

- **US-ACCT-001:** As a Priest, I want a free trial period, so that I can evaluate the platform risk-free before deciding to pay for a subscription.
- **US-BILL-001:** As a Priest, I want to manage all my billing from a single place, so that tracking expenses for multiple parishes is simple and clean.
- **US-DASH-001:** As a Priest, I want a central dashboard viewing all my parishes, so that I can jump into whichever website needs updating today without logging in twice.
- **US-PROV-001:** As a Priest, I want to click a button and have a new parish site setup instantly, so that I don't need any technical skills to launch my website.
- **US-DASH-002:** As a Priest, I want straightforward visual alerts of my live build status, so that I know exactly when my updates reach the public.
- **US-DASH-003:** As a Priest, I want a single "Edit Website" button in my hub, so that I can directly access the backend content manager without remembering specific URLs.
- **US-TINA-001:** As a Priest, I want to quickly swap my entire website’s design template, so that I can give the parish a fresh look over time without losing any text or images.
- **US-TINA-002:** As a Volunteer, I want to use a visual editor where I can see exactly what my changes look like, so that I know my announcements won't break the layout.
- **US-TINA-003:** As a Volunteer, I want my saved updates to go live instantly, so that urgent parish announcements are visible right away.
- **US-ORGN-001:** As a Priest, I want to grant volunteers secure access strictly to content folders, so that they can post updates but cannot accidentally break settings or view billing.
- **US-ADMN-001:** As a Super Admin, I want automated "offline payment" code generators, so that I can seamlessly accommodate older parishes that only pay via paper invoices.
- **US-ADMN-002:** As a Super Admin, I want to view a concise analytics dashboard, so that I can measure company growth, subscriber health, and financial trajectory all at a glance.
- **US-ADMN-003:** As a Super Admin, I want master access to every client site seamlessly, so that I can jump in to solve their technical issues without needing their password.

## 8. Success Metrics

- **Activation Rate:** At least 35% of all sign-ups successfully publish their first website during the trial phase.
- **Time to Value (TTV):** The average time duration from a Priest hitting "Sign Up" to actively viewing a live preview of their new dynamic website is under 7 minutes.
- **Volunteer Adoption:** At least 40% of active paid accounts successfully onboard one or more volunteer collaborators via the CMS within their first month.
- **Trial Conversion Rate:** Reach a 15% conversion rate of users upgrading from a Free Trial Account to a paid Basic Subscription Tier.
- **Revenue Milestone:** Achieve $1,500 Monthly Recurring Revenue (MRR) from basic tier subscriptions within 4 months of the initial rollout.

---

### **Clarifying Questions**

- How should we handle the user experience if a Priest on a "Basic MVP tier" attempts to add a second website during or after their trial? Are they blocked completely, or prompted with a "Contact Us to Upgrade" upsell?
- Do invited Volunteers have a centralized "dashboard" like Priests, or do they only log in via the direct URL path to the TinaCMS instance (e.g., `/admin`) of the specific site they are assigned to?
- What happens to an offline-activated account once their 100% discount promotional period technically concludes? Do they revert to a locked state pending manual review?
- Regarding the ISR pipeline, is there a maximum frequency of cache invalidations we should limit volunteers to, or will Edge CDN caching expenses be negligible at MVP?
