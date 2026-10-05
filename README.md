# 🎈 Decor Joy Gurgaon - Event Decoration E-Commerce & Booking Platform

> **"Your Celebration. Our Creation."**  
> Gurugram's premier event and party decoration styling service, operating since 2021.

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-19.0.0-blue.svg)](https://react.dev/)
[![Express Version](https://img.shields.io/badge/express-4.21.2-lightgrey.svg)](https://expressjs.com/)
[![Database](https://img.shields.io/badge/database-MongoDB%20Atlas-green.svg)](https://www.mongodb.com/atlas)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](#)

---

## 📋 Table of Contents
1. [🌟 Platform Overview](#-platform-overview)
2. [📱 Mobile Ergonomics & Psychological Design](#-mobile-ergonomics--psychological-design)
3. [⚡ Prerequisites](#-prerequisites)
4. [🚀 Complete Step-by-Step Setup Guide (For New Users & Clients)](#-complete-step-by-step-setup-guide-for-new-users--clients)
   - [Step 1: MongoDB Setup (Free Atlas Cloud or Local)](#step-1-mongodb-setup-free-atlas-cloud-or-local)
   - [Step 2: Backend Setup & Database Seeding](#step-2-backend-setup--database-seeding)
   - [Step 3: Frontend Client Startup](#step-3-frontend-client-startup)
5. [⚠️ Troubleshooting: Fixing `connect ECONNREFUSED 127.0.0.1:27017`](#-troubleshooting-fixing-connect-econnrefused-12700127017)
6. [🔐 Admin Command Center Guide](#-admin-command-center-guide)
7. [💬 WhatsApp Booking & Inquiries Pipeline](#-whatsapp-booking--inquiries-pipeline)
8. [🧪 Testing & Quality Assurance](#-testing--quality-assurance)
9. [👨‍💻 Developed By](#-developed-by)
10. [📍 Business Contact](#-business-contact)

---

## 🌟 Platform Overview

Decor Joy Gurgaon is an end-to-end event decoration e-commerce and booking application built for luxury celebration setups across Gurugram condos and residences.

- **Storefront & Catalog**:
  - Luxury celebration aesthetics: Ivory canvas, warm golds (`#b88932`), rose accents, and Playfair Display typography.
  - Curated packages for **Birthdays, Anniversaries, Baby Showers, Proposals, and Special Celebrations**.
  - Dynamic variant pricing: Live price recalculation based on backdrop scales (6ft vs 8ft) and color palettes.
  - Interactive Add-ons (fairy light canopies, cold pyro sparklers, LED neon signs) with instant cart totals.
  - High-definition multi-image galleries with interactive thumbnail previews.
- **Double Booking Protection & Slot Availability**:
  - Daily capacity-capped slots (Morning: 09:00–12:00, Evening: 16:30–19:30).
  - Pincode delivery validator for Gurgaon sectors.
- **Transactions & Security**:
  - Prices stored strictly in **paise as integers** (₹1 = 100 paise) preventing floating-point calculation errors.
  - Razorpay payment gateway integration with webhook signature verification and idempotency keys.
  - Rate limiting, CSRF verification, Helmet security headers, and Mongo sanitize defense against NoSQL injection.
- **Schema-Driven Dynamic Purpose Forms**:
  - 6 Occasions (Birthday, Anniversary, Baby Shower, Proposal, Corporate, Other) rendered 100% from backend schema.
  - Pre-filled WhatsApp direct-chat inquiry generation.

---

## 📱 Mobile Ergonomics & Psychological Design

The platform was designed mobile-first for Gurugram customers who predominantly book on smartphones:

1. **The Thumb-Zone Action Bar**:
   - On mobile viewports, the primary conversion buttons (**"Book Setup"** and **"WhatsApp Inquiry"**) stay sticky at the bottom screen edge, resting comfortably in the natural thumb arc of one-handed smartphone use.
2. **Strict Touch Target Compliance ($\ge 44\text{px} \times 44\text{px}$)**:
   - All interactive controls, quantity adjusters, and color swatches meet or exceed the 44px minimum touch target size to prevent misclicks.
3. **No iOS Auto-Zoom Jars**:
   - All form input fields use font sizes $\ge 16\text{px}$, preventing Safari on iOS from jarringly zooming in when typing.
4. **The "Damage-Free" Guarantee**:
   - Addresses the #1 hesitation of Gurgaon high-rise condo tenants: fear of losing rental security deposits due to chipped paint.
5. **Micro-Commitment Advance Split**:
   - A configurable advance booking percentage (default 25%) to lock the slot, with the remainder due upon setup completion, reducing upfront payment friction.

---

## ⚡ Prerequisites

Before running the application, make sure you have:
- **Node.js**: `v20.0.0` or higher installed ([Download Node.js](https://nodejs.org/))
- **Git**: Installed on your system ([Download Git](https://git-scm.com/))
- **MongoDB**: EITHER a free **MongoDB Atlas cloud database** (recommended, takes 3 minutes, no local software required) OR a local MongoDB instance.

---

## 🚀 1-Click Production VPS Deployment (For Client & Linux Servers)

If your client is setting up the site on a Linux VPS (Ubuntu / Debian), they can deploy the entire stack with **one command without writing or changing a single line of code**:

```bash
# Make script executable & deploy with automatic database seed
chmod +x deploy.sh
./deploy.sh --seed
```

**What this automated script does:**
1. ✅ Automatically installs all server and client dependencies.
2. ✅ Auto-generates secure random 64-character JWT secrets in `server/.env`.
3. ✅ Builds and prerenders all 11 static pages and optimizes all 251 authentic gallery photos.
4. ✅ Seeds categories, packages, add-ons, and admin credentials into MongoDB.
5. ✅ Boots the Node.js API cluster & background worker under PM2 with auto-restart on system reboot.
6. ✅ Provides a ready-to-copy `nginx.conf` file to connect to your domain with SSL.

---

## 💻 Manual Step-by-Step Setup Guide (For Local Development)

Follow these exact steps to run the complete website on your machine:

### Step 1: MongoDB Setup (Free Atlas Cloud or Local)

#### Option A: MongoDB Atlas Cloud (Recommended — Free & No Installation)
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account.
2. Click **Create Deployment** $\rightarrow$ select **M0 Free Shared Cluster** $\rightarrow$ choose **Mumbai (`ap-south-1`)** or **Singapore** region.
3. Under **Security Quickstart**:
   - **Username & Password**: Create a database user (e.g., `decorjoy` / `<your-strong-password>`). Note these down.
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
   - Open `server/.env` in your code editor.
   - Set `MONGO_URI` to your connection string from Step 1:
     ```env
     NODE_ENV=development
     PORT=5000
     MONGO_URI=mongodb+srv://decorjoy:<your-db-password>@cluster0.abcde.mongodb.net/decorjoy?retryWrites=true&w=majority
     JWT_ACCESS_SECRET=<generate-with: openssl rand -hex 32>
     JWT_REFRESH_SECRET=<generate-with: openssl rand -hex 32>
     CLIENT_URL=http://localhost:5173
     REDIS_URL=redis://127.0.0.1:6379
     ADMIN_EMAIL=admin@decorjoy.com
     ADMIN_PASSWORD=<choose-a-strong-password-12-chars-min>
     ```

4. **Seed the database** (Loads celebration packages, 4-photo galleries, add-ons, categories, and admin login):
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
   *All celebration packages, multi-photo carousels, category filters, and cart functionality will load dynamically!*

---

## ⚠️ Troubleshooting: Fixing `connect ECONNREFUSED 127.0.0.1:27017`

If you run `npm run seed` or `npm run dev` and see:
```
Seeding Error: MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
[ERROR]: MongoDB connection attempt failed: connect ECONNREFUSED 127.0.0.1:27017
```

### Why did this happen?
Your backend is configured with `MONGO_URI=mongodb://127.0.0.1:27017/decorjoy`, which looks for a MongoDB database installed directly on your local computer. If you have not installed or started the local MongoDB Windows service, the connection is refused.

### How to fix in 30 seconds:
1. Create a free database at [mongodb.com/atlas](https://www.mongodb.com/atlas) (see Step 1 above).
2. Open `server/.env` and replace `MONGO_URI` with your cloud Atlas connection string:
   ```env
   MONGO_URI=mongodb+srv://decorjoy:<password>@cluster0.abcde.mongodb.net/decorjoy?retryWrites=true&w=majority
   ```
3. Run `npm run seed` and `npm run dev`. It connects instantly!

### Why did the website show "Unable to load packages"?
Per **Architecture Rule 6**, this application is built to enterprise standards with **zero fake mock data**. If the backend server is offline, the client does not show outdated fake products—it displays the graceful Error & Retry card. Once your backend is connected to MongoDB, all packages appear automatically.

---

## 🔐 Admin Command Center Guide

The platform includes a complete administrative back-office for managing day-to-day operations:

- **Portal URL**: `http://localhost:5173/admin/login`
- **Default Seed Email**: `admin@decorjoy.com`
- **Default Seed Password**: Set via `ADMIN_PASSWORD` in `server/.env` before running `npm run seed` *(use a strong unique password, change upon first login)*

### Key Admin Features:
1. **Orders Dashboard**: Track new bookings, update status (`pending` $\rightarrow$ `confirmed` $\rightarrow$ `in_progress` $\rightarrow$ `completed`), and record offline cash balances.
2. **Downloadable Stylist Job Sheets**: Generate printable A4 job sheets for on-ground decoration teams with customer address, slot timings, and selected add-ons.
3. **Products & Catalog Manager**: Create or edit celebration packages, upload images, set base prices in paise, and configure color/scale variants.
4. **Dynamic Purpose Form Builder**: Edit questions, toggle required fields, and reorder steps for customer inquiry forms without code deployments.
5. **Coupons & Discounts**: Create percentage or flat ₹ discount codes with minimum order limits and expiration dates.

---

## 💬 WhatsApp Booking & Inquiries Pipeline

Customers have two seamless ways to connect via WhatsApp (`+91 7015767715`):
1. **Instant Package Inquiries**: Every product card and detail page features a **"WhatsApp Inquiry"** button that encodes the package title, selected date, and live price into a pre-composed chat link.
2. **Purpose Form Inquiries**: Submitting the multi-step celebration planner (`/plan-my-event`) stores the submission in the database and generates a direct WhatsApp link containing all celebration details.

---

## 🧪 Testing & Quality Assurance

The codebase includes automated test suites covering all critical paths:

- **Backend Unit & Integration Tests (97 Tests Passing)**:
  ```powershell
  cd server
  npm test
  ```
  *Tests money calculations in paise, slot availability, Razorpay payment verification, JWT auth, dynamic purpose forms, and rate limiting.*

- **End-to-End Browser Tests (168 Tests Passing)**:
  ```powershell
  cd client
  npm run test:e2e
  ```
  *Runs Playwright tests across Mobile (360px), Tablet (768px), and Desktop (1440px) viewports.*

- **Production Build Validation**:
  ```powershell
  cd client
  npm run build
  ```
  *Static SSR prerendering generated for 11/11 routes with zero build or lint warnings.*

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
