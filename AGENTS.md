# Decor Joy Gurgaon - Project Rules

Project: Decor Joy Gurgaon, event decoration store + booking site.  
Stack (fixed): React 19 + Vite in client/, Express 4 + Mongoose 8 (Node 20+) in server/, MongoDB Atlas, Redis, Cloudinary, Razorpay, Cloudflare in front.

## Core Rules & Architecture Guidelines

1. **Source of Truth for Transactions & State**:
   - The server is the single source of truth for prices, discounts, availability, and order totals.
   - Never trust totals, prices, or coupons sent by the client.

2. **Public Endpoint Security & Hygiene**:
   - Every public endpoint must have Zod validation and rate limiting.
   - Return only explicitly whitelisted fields.
   - Never return raw Mongoose documents from public routes.

3. **Database & Query Performance**:
   - Every list endpoint must be paginated (default 20, max 100) and backed by a MongoDB index.
   - No unbounded `find()`.

4. **Environment Variables & Secrets**:
   - No hardcoded secrets or fallback secrets.
   - A missing env var means the server refuses to boot (`server/config/env.js` validates with Zod).

5. **Money & Date Formatting**:
   - Money is stored strictly in **paise as integers** (₹1 = 100 paise).
   - Dates are stored as `Date` (UTC in DB) and displayed in **IST** (Indian Standard Time, UTC+05:30).

6. **Client API Layer & UX States**:
   - No fake or default data fallbacks in the client API layer.
   - Explicitly handle and render loading, error (with retry), and empty states.

7. **Mobile-First Responsive Design**:
   - Design at 360px viewport width first.
   - No inline styles for layout (cannot use media queries).
   - Touch targets must be at least 44px × 44px.
   - Input fields must have at least 16px font size (to prevent iOS automatic zoom).

8. **Error Handling & Production Security**:
   - Centralized error handler.
   - Never leak `err.message` or stack traces to clients in production.

9. **Testing, Commits & Documentation**:
   - Maintain small, atomic commits.
   - Add or update tests for money calculation, auth, and slot availability logic.
   - Keep README.md updated whenever behavior or architecture changes.

10. **Ambiguity Resolution**:
    - When requirements are ambiguous, always choose the option that is safest for money and data integrity, and document assumptions clearly.
