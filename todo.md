# Hita — Remaining TODO

> Items to complete before production deployment. None of these block frontend development.

---

## Backend — Pre-Deployment

### Deployment Config
- [ ] Create `Dockerfile` (multi-stage: build + run)
- [ ] Create `docker-compose.yml` for local full-stack dev
- [ ] Railway or Fly.io deployment config (`railway.toml` / `fly.toml`)
- [ ] Production `.env` setup (separate from dev `.env`)
- [ ] Set `NODE_ENV=production` in deployment environment

### Razorpay Payment Flow
- [ ] Get Razorpay test keys from dashboard (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`)
- [ ] Add test keys to `.env`
- [ ] Test full purchase flow: create order → simulate payment → webhook → credits added
- [ ] Test webhook signature verification with real Razorpay signatures
- [ ] Switch to live keys when ready for production

### Supabase Atomic Credits (SQL Migration)
- [ ] Create Supabase RPC function `deduct_credits(p_user_id UUID, p_amount INT)`:
  ```sql
  UPDATE credits SET balance = GREATEST(0, balance - p_amount)
  WHERE user_id = p_user_id AND balance >= p_amount
  RETURNING balance;
  ```
- [ ] Create Supabase RPC function `add_credits(p_user_id UUID, p_amount INT)`:
  ```sql
  UPDATE credits SET balance = balance + p_amount
  WHERE user_id = p_user_id
  RETURNING balance;
  ```
- [ ] Test concurrent credit deduction (verify no double-spend)

### Auth Flow
- [ ] Test full auth flow with real Supabase JWT (not `SKIP_AUTH=true`)
- [ ] Verify `SKIP_AUTH=true` is blocked when `NODE_ENV=production`
- [ ] Test token expiry handling

### Testing Gaps
- [ ] Route-level integration tests (HTTP request → response through Fastify)
- [ ] Test credits route with mock Supabase
- [ ] Test auth middleware with valid/invalid/expired tokens
- [ ] Test rate limiter under load
- [ ] Test webhook signature verification
- [ ] Test 10+ diverse user messages for prompt quality (Phase 6)

---

## Frontend — Not Started

- [ ] Decide stack: React Native (mobile) vs Next.js (web) vs both
- [ ] Set up project structure
- [ ] Build chat UI
- [ ] Integrate with backend `/chat` endpoint
- [ ] Auth flow (Supabase client-side)
- [ ] Credits display + purchase flow
- [ ] Map/location integration

---

*Last updated: Phase 7 complete + production hardening done. Backend functional, frontend pending.*
