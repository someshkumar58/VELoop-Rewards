# VELoop Rewards — Automated & Integration Testing Verification

This document details the test scenarios, execution instructions, expected outcomes, and verification results across the VELoop Rewards platform.

---

## 1. Test Suite Summary

The repository includes comprehensive automated test suites across both the backend (Node.js native test runner) and frontend (Vitest + Testing Library).

| Component | Framework | Suites | Tests | Status | Execution Time |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Backend Engine** | `node:test` + `assert/strict` | 65 suites | 235 tests | **PASS (100%)** | ~11.9s |
| **Frontend Application** | `vitest` v5 + `@testing-library/react` | 9 files | 70 tests | **PASS (100%)** | ~5.8s |
| **Production Build** | `vite build` | — | 2,178 modules | **PASS (0 errors)** | ~700ms |

---

## 2. Test Execution Commands

### Run All Backend Tests
```bash
cd backend
npm test
```
*Executes `node --test` across all 65 test suites.*

### Run All Frontend Tests
```bash
cd frontend
npm test -- --run
```
*Executes `vitest run --run` across all 9 test suites.*

### Verify Frontend Production Build
```bash
cd frontend
npm run build
```
*Compiles production bundle into `frontend/dist`.*

---

## 3. Test Scenarios & Verified Outcomes

### A. Authentication & Credential Security (`backend/tests/auth.test.js`)
- **Scenarios:** User registration, password hashing with bcrypt, duplicate email prevention, admin login, token verification, account suspension enforcement.
- **Expected Outcome:** Bcrypt salted hashes stored, duplicate registration rejected with 400, suspended accounts blocked with 403, admin routes reject normal users.
- **Result:** PASSED.

### B. Wallet Models & Separation of Concerns (`backend/tests/wallet.test.js`)
- **Scenarios:** Strict 1:1 user-to-wallet relationship, initial zero balance defaults, decimal precision constraints, negative balance rejection.
- **Expected Outcome:** Negative balances for any asset produce Mongoose validation errors; schema defines unique index on user reference.
- **Result:** PASSED.

### C. Level Progression & XP Engine (`backend/tests/levelService.test.js`)
- **Scenarios:** Level calculations across all 5 tiers (Bronze Initiate to Diamond Legend), percentage calculation, multiplier assignment, atomic XP awards.
- **Expected Outcome:** Threshold boundaries accurately graduate users; Level 5 returns null next threshold; reward multipliers match canonical specifications.
- **Result:** PASSED.

### D. Canonical Achievements & Idempotency (`backend/tests/achievements.test.js`)
- **Scenarios:** Verification of all 7 canonical achievements, milestone boundary detection (Whale Tier at 10,000 VEs), duplicate unlock prevention.
- **Expected Outcome:** Unlocks award XP exactly once; subsequent unlock calls return idempotent success without duplicate XP awards.
- **Result:** PASSED.

### E. Withdrawals & Token Balance Reservations (`backend/tests/withdrawals.test.js`)
- **Scenarios:** Token balance reservation, insufficient balance rejection, unsupported asset (`ves`) rejection, admin approval, admin rejection with token refund, duplicate rejection prevention.
- **Expected Outcome:** Creating withdrawal atomically deducts available Tokens; rejecting refunds Tokens exactly once; duplicate actions rejected.
- **Result:** PASSED.

### F. Sponsored Ad Watching & Security Engine (`backend/tests/ads.test.js`)
- **Scenarios:** Ad availability status, single-use impression token generation, minimum 15-second watch duration enforcement, 60-second cooldown enforcement, daily limit of 20 ads per UTC day, replay attack rejection.
- **Expected Outcome:** Early claims (<15s) receive HTTP 400; duplicate claims receive HTTP 400; wallet credited with Base (15) * Level Multiplier.
- **Result:** PASSED.

### G. Profile Referrals & Activity Ledger (`backend/tests/referralsAndActivity.test.js`)
- **Scenarios:** Referral metrics derivation, active friend counts, reward calculations (+100 VEs / +200 XP), multi-module chronological activity sorting.
- **Expected Outcome:** Authenticated user receives truthful metrics without mock fallback; activity stream combines check-ins, withdrawals, ads, and achievements.
- **Result:** PASSED.

### H. Admin Console & Security Audit Ledger (`backend/tests/adminManagement.test.js`)
- **Scenarios:** Dashboard telemetry, user directory search and filter, single user details inspection, user suspension with mandatory reason, auditable balance adjustments, audit ledger retrieval.
- **Expected Outcome:** Unauthenticated/non-admin requests rejected; suspensions commit `AdminAuditLog` records; adjusting balance below zero is rejected.
- **Result:** PASSED.

### I. Frontend Profile Module & Interactive States (`frontend/src/test/`)
- **Scenarios:** Profile hero rendering, balance cards, progress bars, achievement badges, referral copy interactions, withdrawal overview, watch ads modal lifecycle, error state rendering.
- **Expected Outcome:** Clean component rendering, truthful zero-balance display, accessible contrast, and error handling.
- **Result:** PASSED.

---

## 4. Known Limitations & Out-of-Scope Behaviors

1. **Infrastructure Mode Only:** Real-money bank wires and crypto on-chain payouts remain disabled in Phase 2A/2B. Payout methods are recorded for review only.
2. **Preview Mode Fallback:** In offline development environments when MongoDB is disconnected, the frontend provides realistic preview data (`VITE_ENABLE_DEV_PREVIEW=true`) to enable seamless UI development. In live production environments, this is disabled.
