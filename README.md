# Decor Joy Gurgaon - Full-Stack Event Decoration Web Application

> **"Your Celebration. Our Creation."**  
> Gurugram's premier event and party decoration styling service, operating since 2021.

---

## 🌟 Project Highlights

- **Customer Website**:
  - Luxury celebration aesthetics: Cream/ivory background (`#f8f4ed`), gold (`#b88932`) and rose gold (`#d99a9a`) accents, Google Fonts (*Playfair Display* & *Poppins*).
  - Responsive design for Desktop, Tablet, and Mobile with hamburger navigation.
  - Interactive categories: Birthdays, Anniversaries, Baby Showers, Proposals, Special Celebrations.
  - Dynamic photo gallery with filter tabs and full-screen lightbox image preview.
- **Schema-Driven Purpose Forms**:
  - Dynamic purpose forms rendered 100% from backend schema without hardcoded client fields (`/plan-my-event` and embedded in `Contact.jsx` / `CartDrawer.jsx`).
  - 6 Seeded celebrations: Birthday, Anniversary, Baby Shower / Welcome Baby, Marry Me Proposal, Corporate, and Other.
  - Mobile-first stepper interface (one group per step with real-time progress bar, touch targets >= 44px, input font size >= 16px).
  - Draft autosave to `localStorage`, inline field validation, and +91 phone normalization.
  - Anti-spam suite: Cloudflare Turnstile verification, honeypot field (`_gotcha`), 10/min submission rate limiter, and 10-minute duplicate submission guard.
  - Immutable `answersSnapshot` retaining historical question labels across schema version edits.
  - Automated WhatsApp link generator pre-filling celebration details directly into customer chat.

- **SEO & Local Search Engine Optimization (Gurgaon)**:
  - React 19 native per-route document metadata (`<title>`, `<meta>`, `<link rel="canonical">`, Open Graph, Twitter cards, product price tags).
  - Dynamic Schema.org structured data (JSON-LD): `LocalBusiness` (dynamic from settings), `Product` + `Offer`, `BreadcrumbList`, and `FAQPage`.
  - Dynamic DB-backed `GET /sitemap.xml` and `GET /robots.txt` with Redis caching.
  - Build-time static prerendering via Vite SSR (`entry-server.jsx` + `scripts/prerender.js`) producing crawler-ready static HTML with real `<h1>` elements.
  - 5 High-intent Gurgaon locality landing pages (`/locations/dlf-phase-5`, `golf-course-road`, `cyber-city`, `sohna-road`, `sector-57-gurugram`) with localized copy, society names, real testimonials, and local FAQs.
  - Automated WhatsApp review collection trigger in background worker dispatched 2 hours after event slot ends.
  - Consent-first tracking supporting GA4 & Meta Pixel with Do Not Track (DNT) detection and GTM e-commerce dataLayer events.
  - Full architectural documentation available in [docs/SEO.md](docs/SEO.md).

- **Admin Form Builder & Submissions Inbox**:
  - **Form Builder**: Visual field editor with drag-and-drop reordering, type configuration, options editor, conditional `showIf` logic, live interactive preview, and automatic version bumping on save.
  - **Submissions Inbox**: Filterable by purpose/status/date, search by name/phone, 5-stage status pipeline (`new`, `contacted`, `quoted`, `converted`, `lost`), internal notes history, staff assignment, WhatsApp click-to-chat, "Convert to Order" linking, and CSV export.
  - Seamless migration script `scripts/migrate-inquiries-to-submissions.js` importing legacy inquiries into `Submission` records.


---

## 📁 Project Structure

```
decor-joy/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Hero.jsx
│   │   │   ├── ServiceCard.jsx
│   │   │   ├── GalleryCard.jsx
│   │   │   ├── TestimonialCard.jsx
│   │   │   └── WhatsAppButton.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Services.jsx
│   │   │   ├── Gallery.jsx
│   │   │   ├── About.jsx
│   │   │   └── Contact.jsx
│   │   ├── admin/
│   │   │   ├── AdminLogin.jsx
│   │   │   ├── AdminLayout.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ServicesManager.jsx
│   │   │   ├── GalleryManager.jsx
│   │   │   ├── InquiryManager.jsx
│   │   │   └── TestimonialManager.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── styles/
│   │   │   ├── global.css
│   │   │   ├── navbar.css
│   │   │   ├── hero.css
│   │   │   ├── services.css
│   │   │   ├── gallery.css
│   │   │   ├── about.css
│   │   │   ├── contact.css
│   │   │   ├── footer.css
│   │   │   └── admin.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   ├── Admin.js
│   │   ├── Service.js
│   │   ├── Gallery.js
│   │   ├── Inquiry.js
│   │   └── Testimonial.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── serviceController.js
│   │   ├── galleryController.js
│   │   ├── inquiryController.js
│   │   └── testimonialController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── serviceRoutes.js
│   │   ├── galleryRoutes.js
│   │   ├── inquiryRoutes.js
│   │   └── testimonialRoutes.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── seed.js
│   ├── .env
│   ├── package.json
│   └── server.js
│
└── README.md
```

---

## 🚀 Quick Start & Run Instructions

### 1. Backend Server Setup

```bash
cd server
npm install
node seed.js      # Seeds default admin, sample services, gallery & testimonials
npm run dev       # Starts Express backend on http://localhost:5000
```

### 2. Frontend React Client Setup

Open a second terminal window:

```bash
cd client
npm install
npm run dev       # Starts Vite React on http://localhost:5173
```

## 🔐 Admin Portal Access

- **URL**: `http://localhost:5173/admin/login`
- **Initial Setup**: Configured via `ADMIN_EMAIL` and `ADMIN_PASSWORD` (minimum 12 characters, never default passwords) in `server/.env`.
- **Note**: Never commit or share admin credentials. Use the seed script with environment variables set.


## 📚 Architecture & Operations Documentation

- [docs/SEO.md](docs/SEO.md): Comprehensive guide to SEO, React 19 document metadata, dynamic JSON-LD schemas, XML sitemap/robots, Vite SSR static prerendering, Gurgaon locality landing pages, and consent-first analytics.
- [docs/PERF.md](docs/PERF.md): Performance, caching, Redis optimizations, circuit breakers, and load testing guide.
- [docs/RUNBOOK.md](docs/RUNBOOK.md): Operations runbook, zero-downtime deployments, backup and restore drills, and incident response.
- [docs/CLIENT_GUIDE.md](docs/CLIENT_GUIDE.md): Store owner manual for orders, slots, discounts, and inventory management.
- [docs/CLOUDFLARE.md](docs/CLOUDFLARE.md): CDN and WAF security guidelines.

## 📍 Business Information

- **Brand**: Decor Joy Gurgaon
- **Since**: 2021
- **Tagline**: *"Your Celebration. Our Creation."*
- **Address**: 166GF, Sector 57, Housing Board Colony, Gurugram, Haryana
- **Phone**: +91 7015767715
- **Email**: decorjoygurgaon@gmail.com
- **WhatsApp**: https://wa.me/917015767715
- **Google Photos Portfolio**: https://photos.app.goo.gl/bWGFDXU3Tjr8afQL9
