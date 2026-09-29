---
description: Decor Joy Gurgaon project rules
alwaysApply: true
---
# Decor Joy Gurgaon - Project Rules

Project: Decor Joy Gurgaon, event decoration store + booking site.
Stack (fixed): React 19 + Vite in client/, Express 4 + Mongoose 8 (Node 20+) in server/, MongoDB Atlas, Redis, Cloudinary, Razorpay, Cloudflare in front.

## Rules
- The server is the source of truth for prices, discounts, availability and order totals. Never trust totals, prices or coupons sent by the client.
- Every public endpoint: zod validation, rate limit, return only whitelisted fields. Never return raw Mongoose documents from public routes.
- Every list endpoint is paginated (default 20, max 100) and backed by an index. No unbounded find().
- No hardcoded secrets or fallback secrets. A missing env var means the server refuses to boot (server/config/env.js validates with zod).
- Money is stored in paise as integers. Dates are stored as Date (UTC) and displayed in IST.
- No fake/default data fallbacks in the client API layer. Use loading, error (with retry) and empty states.
- Mobile first: design at 360px first. No inline styles for layout (they cannot use media queries). Touch targets at least 44px. Inputs at least 16px font size.
- Central error handler. Never leak err.message or stack to clients in production.
- Small commits. Add or update tests for money, auth and slot logic. Update README when behaviour changes.
- If something is ambiguous, choose the option that is safest for money and data and list the assumption in the PR description.
