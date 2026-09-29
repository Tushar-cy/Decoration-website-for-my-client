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
  - Booking & inquiry form saving directly to MongoDB with instant WhatsApp follow-up.
  - Reusable WhatsApp integration linked to business number: `+91 7015767715`.

- **Admin Management Portal**:
  - Separate, clean, professional dashboard design.
  - Secure JWT authentication & bcrypt password encryption.
  - Real-time statistics: Total Services, Gallery Photos, New Inquiries, and Customer Reviews.
  - Full CRUD management for Services, Gallery, and Testimonials.
  - Inquiry tracking system with status updates (`new` ➔ `contacted` ➔ `completed`) and 1-click WhatsApp customer chat.

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


## 📍 Business Information

- **Brand**: Decor Joy Gurgaon
- **Since**: 2021
- **Tagline**: *"Your Celebration. Our Creation."*
- **Address**: 166GF, Sector 57, Housing Board Colony, Gurugram, Haryana
- **Phone**: +91 7015767715
- **Email**: decorjoygurgaon@gmail.com
- **WhatsApp**: https://wa.me/917015767715
- **Google Photos Portfolio**: https://photos.app.goo.gl/bWGFDXU3Tjr8afQL9
