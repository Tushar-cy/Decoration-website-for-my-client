# 🎈 Decor Joy Gurgaon - Showcase Catalogue, Event Inquiries & Admin CRM

> **"Your Celebration. Our Creation."**  
> Gurugram's premier event and party decoration styling service, operating since 2021.

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-19.0.0-blue.svg)](https://react.dev/)
[![Express Version](https://img.shields.io/badge/express-4.21.2-lightgrey.svg)](https://expressjs.com/)
[![Database](https://img.shields.io/badge/database-MongoDB%20Atlas-green.svg)](https://www.mongodb.com/atlas)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](#)

---

## 📋 Table of Contents
1. [🌟 Platform Overview & Business Model](#-platform-overview--business-model)
2. [📱 Mobile Ergonomics & Psychological Design](#-mobile-ergonomics--psychological-design)
3. [⚡ Prerequisites](#-prerequisites)
4. [🚀 1-Click Production VPS Deployment](#-1-click-production-vps-deployment)
5. [💻 Manual Step-by-Step Setup Guide (For Local Development)](#-manual-step-by-step-setup-guide-for-local-development)
   - [Step 1: MongoDB Setup (Free Atlas Cloud or Local)](#step-1-mongodb-setup-free-atlas-cloud-or-local)
   - [Step 2: Backend Setup & Database Seeding](#step-2-backend-setup--database-seeding)
   - [Step 3: Frontend Client Startup](#step-3-frontend-client-startup)
6. [⚠️ Troubleshooting: Fixing `connect ECONNREFUSED 127.0.0.1:27017`](#-troubleshooting-fixing-connect-econnrefused-12700127017)
7. [🔐 Admin Command Center & Lead Pipeline Guide](#-admin-command-center--lead-pipeline-guide)
8. [💬 WhatsApp Inquiries & Event Planner Flow](#-whatsapp-inquiries--event-planner-flow)
9. [🧪 Testing & Quality Assurance](#-testing--quality-assurance)
10. [👨‍💻 Developed By](#-developed-by)
11. [📍 Business Contact](#-business-contact)

---

## 🌟 Platform Overview & Business Model

Decor Joy Gurgaon operates on a **high-touch showcase and consultation model**:
```
Catalogue Showcase → WhatsApp Inquiry / Custom Event Form → Admin Leads Inbox → Manual Consultation & Setup
```

The client handles all customers personally to tailor party themes, balloon palettes, and venue specifics for Gurugram condominiums and residences. There is **no impersonal online cart or automated payment checkout**.

- **Storefront & Catalogue Showcase**:
  - Luxury celebration aesthetics: Ivory canvas, warm golds (`#b88932`), rose accents, and Playfair Display typography.
  - Curated showcases for **Birthdays, Anniversaries, Baby Showers, Proposals, and Special Celebrations**.
  - Indicative starting prices and variant options (scales & color palettes) to set clear expectations.
  - High-definition multi-image galleries with interactive previews.
  - Primary CTA on every package: **"Enquire on WhatsApp"** with pre-filled context.
  - Secondary CTA on every package: **"Plan My Event"** linking to the custom event form.
- **WhatsApp Direct Inquiries**:
  - Contextual click-to-chat links pre-filled with package name and customer enquiry text.
  - Direct communication on business WhatsApp (`+91 7015767715`).
- **Dynamic Purpose Event Forms**:
  - Schema-driven multi-step planner for 6 occasions (Birthday, Anniversary, Baby Shower, Proposal, Corporate, Other).
  - Validation on frontend and backend with Cloudflare Turnstile anti-spam protection.
  - Stores submissions directly into MongoDB and pings the owner on WhatsApp instantly.
- **Admin Leads CRM**:
  - Real-time pipeline tracking: `new` $\rightarrow$ `contacted` $\rightarrow$ `quoted` $\rightarrow$ `converted` $\rightarrow$ `closed` / `spam`.
  - 1-click WhatsApp follow-up button for every customer lead.
  - Internal staff notes and assignment tracking.
- **Security & Performance**:
  - Edge caching with Redis single-flight deduplication.
  - Rate limiting, CSRF custom header verification (`X-Requested-With: decorjoy`), Helmet headers, and Mongo sanitize defense.
  - Prerendered HTML for all public routes ensuring instant load times and perfect SEO rankings.

---

## 📱 Mobile Ergonomics & Psychological Design

The platform is designed mobile-first (optimized at 360px, 390px, and 412px viewports) for Gurugram customers browsing on smartphones:

1. **The Thumb-Zone Action Bar**:
   - On mobile viewports, the primary conversion buttons (**"Enquire on WhatsApp"** and **"Plan Event"**) stay sticky at the bottom screen edge, resting comfortably in the natural thumb arc of one-handed smartphone use without overlapping navigation bars.
2. **Strict Touch Target Compliance ($\ge 44\text{px} \times 44\text{px}$)**:
   - All interactive controls, quick-view triggers, and swatches meet or exceed the 44px minimum touch target size to prevent misclicks.
3. **No iOS Auto-Zoom Jars**:
   - All form input fields use font sizes $\ge 16\text{px}$, preventing Safari on iOS from auto-zooming when typing.
4. **The "Damage-Free" Guarantee**:
   - Addresses the #1 hesitation of Gurgaon high-rise condo tenants: fear of losing rental security deposits due to chipped paint.
5. **No Native App Nagging**:
   - Clean, lightweight mobile web application running directly in any modern mobile browser without fake PWA install banners.

---

## ⚡ Prerequisites

Before running the application, make sure you have:
- **Node.js**: `v20.0.0` or higher installed ([Download Node.js](https://nodejs.org/))
- **Git**: Installed on your system ([Download Git](https://git-scm.com/))
- **MongoDB**: EITHER a free **MongoDB Atlas cloud database** (recommended, takes 3 minutes, no local software required) OR a local MongoDB instance.
- **Redis**: Optional in development (bypasses gracefully if offline; required in production for rate-limit and edge caching).

---

## 🚀 1-Click Production VPS Deployment (For Client & Linux Servers)

If deploying on a Linux VPS (Ubuntu / Debian), deploy the entire stack with **one command without writing or changing a single line of code**:

```bash
# Make script executable & deploy with automatic database seed
chmod +x deploy.sh
./deploy.sh --seed
```

**What this automated script does:**
1. ✅ Automatically installs all server and client production dependencies.
2. ✅ Auto-generates secure random 64-character JWT secrets in `server/.env`.
3. ✅ Builds and prerenders all 11 static pages and optimizes all authentic portfolio photos.
4. ✅ Seeds categories, packages, add-ons, and admin credentials into MongoDB.
5. ✅ Boots the Node.js API cluster under PM2 with auto-restart on system reboot.
6. ✅ Provides a ready-to-copy `nginx.conf` file to connect to your domain with SSL.

---

## 💻 Manual Step-by-Step Setup Guide (For Local Development)

### Step 1: MongoDB Setup (Free Atlas Cloud or Local)

#### Option A: MongoDB Atlas Cloud (Recommended — Free & No Installation)
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account.
2. Click **Create Deployment** $\rightarrow$ select **M0 Free Shared Cluster** $\rightarrow$ choose **Mumbai (`ap-south-1`)** region.
3. Under **Security Quickstart**:
   - **Username & Password**: Create a database user (e.g., `decorjoy` / `<your-strong-password>`).
   - **Network Access**: Click **Add IP Address** $\rightarrow$ select **Allow Access from Anywhere (`0.0.0.0/0`)** $\rightarrow$ click **Confirm**.
4. Once created, click **Connect** $\rightarrow$ choose **Drivers (Node.js)**.
5. Copy your connection string. It looks like:
   ```
   mongodb+srv://decorjoy:<your-db-password>@cluster0.abcde.mongodb.net/decorjoy?retryWrites=true&w=majority
   ```

#### Option B: Local MongoDB
If you prefer running MongoDB locally on your machine:
- Make sure MongoDB Community Server is installed and running on port `27017`.
- Your connection string is: `mongodb://127.0.0.1:27017/decorjoy`.

---

### Step 2: Backend Setup & Database Seeding

1. Open your terminal and navigate to the `server/` directory:
   ```powershell
   cd server
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Configure your environment file:
   - Create or edit `server/.env`:
     ```env
     NODE_ENV=development
     PORT=5000
     MONGO_URI=mongodb+srv://decorjoy:<your-db-password>@cluster0.abcde.mongodb.net/decorjoy?retryWrites=true&w=majority
     JWT_ACCESS_SECRET=your_32_character_minimum_random_secret_here
     JWT_REFRESH_SECRET=your_32_character_minimum_random_secret_here
     CLIENT_URL=http://localhost:5173
     REDIS_URL=redis://127.0.0.1:6379
     ADMIN_EMAIL=admin@decorjoy.com
     ADMIN_PASSWORD=DecorJoyAdmin2026!
     ```

4. **Seed the database** (Loads showcase packages, galleries, add-ons, categories, and admin credentials):
   ```powershell
   npm run seed
   ```
   *Output will confirm: "Database seeding completed successfully!"*

5. **Start the backend server**:
   ```powershell
   npm run dev
   ```
   *Your API will now be live on `http://localhost:5000/api`!*

---

### Step 3: Frontend Client Startup

1. Open a **second terminal window** and navigate to the `client/` directory:
   ```powershell
   cd client
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Start the Vite React development server:
   ```powershell
   npm run dev
   ```

4. **Open your browser** and visit:
   ```
   http://localhost:5173
   ```
   *All decoration showcases, multi-photo carousels, category filters, and WhatsApp inquiry buttons will load!*

---

## ⚠️ Troubleshooting: Fixing `connect ECONNREFUSED 127.0.0.1:27017`

If you run `npm run seed` or `npm run dev` and see:
```
Seeding Error: MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
[ERROR]: MongoDB connection attempt failed: connect ECONNREFUSED 127.0.0.1:27017
```

### How to fix in 30 seconds:
1. Create a free database at [mongodb.com/atlas](https://www.mongodb.com/atlas) (see Step 1 above).
2. Open `server/.env` and replace `MONGO_URI` with your cloud Atlas connection string:
   ```env
   MONGO_URI=mongodb+srv://decorjoy:<password>@cluster0.abcde.mongodb.net/decorjoy?retryWrites=true&w=majority
   ```
3. Run `npm run seed` and `npm run dev`. It connects instantly!

---

## 🔐 Admin Command Center & Lead Pipeline Guide

The platform includes an administrative CRM for managing decoration inquiries, showcase catalogues, and business settings:

- **Portal URL**: `http://localhost:5173/admin/login`
- **Default Seed Email**: `admin@decorjoy.com`
- **Default Seed Password**: Configured via `ADMIN_PASSWORD` in `server/.env`

### Key Admin Features:
1. **Lead Enquiries & Pipeline Dashboard**: Real-time stats on today's inquiries, this week's inquiries, occasion breakdown, and pipeline status (`new`, `contacted`, `quoted`, `converted`, `closed`, `spam`).
2. **Submissions Manager**: View complete customer responses, add internal follow-up notes, assign to staff, and mark deals as converted. Includes 1-click WhatsApp follow-up link.
3. **Showcase Catalogue Manager**: Create or edit decoration packages, upload photos, set starting prices, and toggle active status.
4. **Dynamic Purpose Form Builder**: Customize inquiry questions, validation rules, and success messages for each celebration type.
5. **Store Settings**: Update business contact numbers, announcement banner, and serviceable Gurugram pincodes.
6. **Audit Logs & Users**: Security audit trail tracking all administrative actions.

---

## 💬 WhatsApp Inquiries & Event Planner Flow

Customers connect with the team through two streamlined paths:
1. **Instant Package Inquiries**: Every package card and detail page includes an **"Enquire on WhatsApp"** button pre-populated with the package name and inquiry context.
2. **"Plan My Event" Planner**: Submitting the multi-step planner (`/plan-my-event`) records customer preferences in the database, notifies the owner, and provides a direct WhatsApp link to finalize mockups.

---

## 🧪 Testing & Quality Assurance

The codebase includes automated test suites covering all critical paths:

- **Backend Unit & Integration Tests (66 Tests Passing)**:
  ```powershell
  cd server
  npm test
  ```
  *Tests showcase catalogue queries, money validation, phone normalization, JWT authentication, role guards, purpose forms, and rate limiting.*

- **Frontend Lint & Type Checks**:
  ```powershell
  cd client
  npm run lint
  ```
  *Zero errors across all client source files.*

- **Production Build Validation**:
  ```powershell
  cd client
  npm run build
  ```
  *Vite production build and static SSR prerendering for all 11 routes with <h1> tags.*

---

## 👨‍💻 Developed By

Built with care for **Decor Joy Gurgaon** by:

- **Tushar Chawla** — [GitHub Profile](https://github.com/Tushar-cy)
- **Ansh Bhola** — [GitHub Profile](https://github.com/ansh2028)

---

## 📍 Business Contact

- **Brand**: Decor Joy Gurgaon
- **Operating Since**: 2021
- **Address**: 166GF, Sector 57, Housing Board Colony, Gurugram, Haryana
- **Phone / WhatsApp**: [+91 7015767715](https://wa.me/917015767715)
- **Email**: decorjoygurgaon@gmail.com
- **Google Photos Portfolio**: [View Real Event Photos](https://photos.app.goo.gl/bWGFDXU3Tjr8afQL9)
