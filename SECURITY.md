# VELoop Rewards — Security & Threat Modeling Architecture

This document details the security safeguards, authentication protocols, input validation pipelines, and threat mitigation strategies implemented in VELoop Rewards.

---

## 1. Authentication & Token Architecture

### 1.1 JSON Web Token (JWT) Implementation
- **Algorithm:** HMAC SHA-256 (`HS256`).
- **Signature Integrity:** Signed with `JWT_SECRET` (minimum 32-character high-entropy secret).
- **Stateless Bearer Tokens:** Transmitted via standard `Authorization: Bearer <token>` HTTP headers.
- **Payload Minimization:** JWT tokens store only non-sensitive claims: `{ id, email, role }`. Passwords, balances, and PII are never embedded in token payloads.
- **Expiration Policy:** Tokens expire after 7 days (`JWT_EXPIRES_IN=7d`), after which re-authentication is mandatory.

### 1.2 Credential Protection & Password Hashing
- **Algorithm:** Salted `bcryptjs` with 10 salt rounds.
- **Zero Plaintext Storage:** Plaintext passwords are never written to disk, database, or console logs.
- **Mongoose Schema Shield:** `passwordHash` is configured with `{ select: false }` on the `User` schema. Standard database queries strictly exclude password hashes from memory.

---

## 2. Role-Based Access Control (RBAC) & Administrative Defense

### 2.1 Role Hierarchy
- **`user` (Member):** Authorized to access their own profile (`/api/profile/*`), watch sponsored ads (`/api/ads/*`), and request token redemptions.
- **`admin` (System Administrator):** Authorized to access moderation controls (`/api/admin/*`), review withdrawals, adjust balances, and inspect the audit ledger.

### 2.2 Defense-in-Depth Authorization Pipeline
1. `protect` Middleware:
   - Validates JWT signature and expiration.
   - Queries database to verify the user account exists.
   - Enforces account status checks: suspended users receive `HTTP 403 Forbidden`.
   - Attaches verified user document to `req.user`.
2. `authorize('admin')` Middleware:
   - Validates that `req.user.role === 'admin'`.
   - Non-administrators attempting to call `/api/admin/*` receive `HTTP 403 Forbidden`.

### 2.3 Administrative Self-Protection
- Administrative moderation endpoints (`PATCH /api/admin/users/:id/status`) prevent modifying or suspending other administrators.
- Re-reviewing or changing already approved/rejected withdrawals is prevented at the business logic layer.

---

## 3. Data Integrity & Financial Safety

### 3.1 Zero Trust in Client-Supplied Data
- The backend is the single source of truth for all balances, levels, and multipliers.
- Request payloads containing balance overrides, multipliers, or fake XP amounts are strictly ignored or rejected.

### 3.2 ACID Transaction Guarantees
All operations affecting financial state utilize MongoDB Multi-Document ACID Transactions (`session.withTransaction`):
- **User Registration:** User document and Wallet document are committed atomically. If wallet creation fails, user registration is rolled back.
- **Withdrawal Submission:** Requested Tokens are atomically reserved from `Wallet.tokensBalance` using conditional queries (`{ tokensBalance: { $gte: amount } }`).
- **Withdrawal Rejection:** Reserved Tokens are atomically refunded to the user's wallet. Duplicate rejections are rejected (idempotency).

### 3.3 Sponsored Ad Replay Attack Prevention
- Every ad watching session creates a single-use cryptographically unique `impressionToken`.
- The backend measures elapsed time between `startedAt` and `claimedAt`. Claims submitted under 15 seconds are rejected (`HTTP 400`).
- Tokens transition to `CLAIMED` status atomically, preventing race conditions, replay attacks, and duplicate crediting.

---

## 4. Input Validation & Sanitization

1. **RFC 5322 Email Validation:** Validated via strict regex before normalization to lowercase.
2. **Numeric Balance Bounds:** All balance fields enforce Mongoose `min: 0` constraints to prevent negative balances.
3. **Withdrawal Asset Whitelist:** Withdrawal requests strictly accept asset `tokens`. Attempts to withdraw unsupported currencies (e.g. `ves`, `usd`) receive `HTTP 400 Bad Request`.
4. **Administrative Justification Policy:** Suspensions and balance adjustments require a mandatory justification string (minimum 3 characters).

---

## 5. Sensitive Data Handling & Environment Security

- **`.env` Exclusion:** Production `.env` files are strictly excluded via `.gitignore` to prevent secret leakage.
- **Cross-Origin Resource Sharing (CORS):** Restricts API access to authorized frontend origins (`FRONTEND_URL` / `CLIENT_ORIGIN`).
- **Masked Data Presentation:** Sensitive referral email addresses are masked (e.g. `m***@veloop.io`) in user-facing endpoints.
- **No Real-Money Payouts:** Phase 2A/2B operates in pure platform token infrastructure mode. Payout gateway credentials, private keys, and bank account numbers are never requested or stored.
