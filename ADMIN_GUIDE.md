# VELoop Rewards — System Administration & Operations Guide

This operational manual documents the features, workflows, and administrative controls within the VELoop Rewards Administration Console.

---

## 1. Authentication & Security Policy

### Access URL
- Navigation Route: `/admin/login`
- Local Address: `http://localhost:5173/admin/login`

### Authorization Architecture
- **Role Requirement:** Only users with `role: 'admin'` are authorized to generate administrative JWT sessions or access `/api/admin/*` endpoints.
- **Stateless Verification:** All administrative requests transmit `Authorization: Bearer <JWT>`. The backend validates the cryptographic signature, checks that the administrator is not suspended, and verifies role membership on every request.
- **Cross-Role Defense:** Ordinary platform members attempting to invoke admin routes receive `HTTP 403 Forbidden`.
- **Credential Storage:** All administrative passwords are salted and hashed with bcrypt (10 rounds). Plaintext passwords are never logged or stored.

---

## 2. Admin Dashboard Console (`/admin/dashboard`)

The Administration Console provides real-time telemetry across platform operations:

1. **Key Performance Metric Cards:**
   - **Total Registered Users:** Total count of active, suspended, and pending members.
   - **Active Members:** Count and percentage of non-suspended users.
   - **Suspended / Flagged Accounts:** Real-time tally of restricted accounts under review.
   - **Total VEs Distributed:** Platform-wide cumulative sum of virtual ecosystem currencies held.
   - **Pending Withdrawals:** Number of requests and token volume awaiting manual review.
   - **Referrals Tracked:** Total member invitations recorded.
2. **Reward Asset Distribution Portfolio:**
   - Proportional volume bar visualizing balance distribution across **VEs, SVEs, Gems, and Tokens**.
3. **Recent Administrative Actions Ledger:**
   - Real-time snapshot of the latest moderation, configuration, and withdrawal review events.
4. **Live User Activity Stream:**
   - Chronological audit stream aggregating daily check-ins, ad completions, level advancements, and withdrawal submissions.

---

## 3. User Directory & Account Moderation (`/admin/users`)

### Directory Features
- **Search:** Search members by full name, email address, or platform `User ID` (e.g. `VEL-894210`).
- **Filter:** Filter member directory by standing: `All`, `Active`, `Suspended`, or `Pending`.
- **Pagination:** Server-side pagination with configurable page sizes (default: 10).

### User Details Inspection (`/admin/users/:id`)
- Authoritative wallet holdings across all 5 assets (**VEs, SVEs, Gems, Tokens, XP**).
- Referral attribution metrics and member join date.
- Platform seniority and current progression tier.

### Account Suspension & Restoration Workflow
1. Locate the target user in the directory or details view.
2. Click **Suspend Account** (or **Restore Account** if already suspended).
3. The moderation modal requires a **Mandatory Administrative Justification** (minimum 3 characters, e.g. `"Violation of Terms of Service: Automated script detection"`).
4. Submitting executes `PATCH /api/admin/users/:id/status`.
5. The backend validates permissions, modifies `accountStatus`, and records an immutable entry in `AdminAuditLog`.
6. Administrative self-suspension or modifying other administrators is strictly forbidden (`HTTP 403`).

---

## 4. Reward & Vault Management (`/admin/rewards`)

### Tokenomics & Vault Holdings
- Displays reserve liquidity balances (e.g. `5,000,000 VEs` reserve).
- Displays total volume of issued VEs and pending redemption claims.

### Auditable Balance Adjustment Workflow
Administrators can issue authorized balance corrections:
1. Click **Adjust User Balance** in the rewards console.
2. Enter the target member's **User ID** (e.g. `VEL-894210`).
3. Select the target asset: `ves`, `tokens`, `gems`, or `sves`.
4. Enter the adjustment amount and type (**CREDIT** for positive balance addition, **DEBIT** for deduction).
5. Enter the **Mandatory Audit Justification** (e.g. `"Promotional Campaign Bonus #4"`).
6. **Integrity Rule:** Balance deductions that would reduce a member's wallet below zero are rejected with `HTTP 400 Bad Request`.
7. Every adjustment commits an immutable record to `AdminAuditLog` with previous balance, new balance, and justification.

---

## 5. Level & Achievement Configuration

### Level Tiers (`/admin/levels`)
- Inspect canonical progression thresholds:
  - **Level 1 (Bronze Initiate):** 0 – 2,499 XP (1.00x multiplier)
  - **Level 2 (Silver Explorer):** 2,500 – 5,999 XP (1.10x multiplier)
  - **Level 3 (Titanium Voyager):** 6,000 – 9,999 XP (1.15x multiplier)
  - **Level 4 (Gold Pioneer):** 10,000 – 14,999 XP (1.25x multiplier)
  - **Level 5 (Diamond Legend):** 15,000+ XP (1.50x multiplier)
- Live active member distribution per tier.
- Configuration adjustments are audited under `actionType: 'LEVEL_CONFIG_UPDATE'`.

### Achievements Catalog (`/admin/achievements`)
- Inspect canonical platform achievements with live unlock statistics:
  - `FIRST_STEP` — First Step (100 XP)
  - `STREAK_7` — Streak Master (350 XP)
  - `CRYPTO_SWAP` — Crypto Pioneer (500 XP)
  - `AMBASSADOR` — Ambassador (800 XP)
  - `WHALE_TIER` — Whale Tier (1,500 XP)
  - `CENTURION` — Centurion (2,000 XP)
  - `SUPER_CONNECTOR` — Super Connector (3,000 XP)

---

## 6. Withdrawal Review & Balance Reservation (`/admin/withdrawals`)

### Infrastructure Mode Notice
In Phase 2A/2B infrastructure mode, real-money payouts remain strictly disabled. No banking gateways, crypto networks, or third-party payout APIs are invoked.

### Review Actions
- **Approve Request:**
  - Validates status transition from `PENDING` -> `APPROVED`.
  - Records administrative reviewer ID and timestamp.
  - Leaves reserved Tokens debited from the user's available balance.
  - Re-reviewing or modifying an approved request is rejected (immutable final state).
- **Reject Request:**
  - Requires a mandatory rejection reason (minimum 3 characters, e.g. `"Incomplete KYC verification"`).
  - Atomically refunds the reserved Tokens back to the user's `Wallet.tokensBalance` using ACID transactions.
  - Idempotency safeguard ensures duplicate rejection attempts never refund tokens twice.

---

## 7. Security Audit Ledger (`/admin/audit-logs`)

The Audit Ledger provides a permanent, searchable audit trail for compliance:
- **Timestamp (UTC):** Exact ISO timestamp of the committed event.
- **Administrator Identity:** Email and role of the executing administrator.
- **Action Event:** Standardized classification (`USER_SUSPENSION`, `USER_RESTORATION`, `REWARD_ADJUSTMENT`, `WITHDRAWAL_APPROVAL`, `WITHDRAWAL_REJECTION`, `LEVEL_CONFIG_UPDATE`, `SETTINGS_UPDATE`).
- **Target Entity:** Entity type and identifier (e.g. `User: VEL-894210`, `Wallet: VEL-894210 (VES)`).
- **Delta (Before -> After):** Explicit recording of state transition (e.g. `Status: Active -> Status: Suspended`).
- **Mandatory Justification:** Verbatim reason provided by the administrator.
