# VELoop Rewards — Full-Stack User Profile & Admin Management Platform

[![CI Verification](https://img.shields.io/badge/Backend%20Tests-235%2F235%20PASS-brightgreen)](file:///s:/internship/backend/tests)
[![Frontend Tests](https://img.shields.io/badge/Frontend%20Tests-70%2F70%20PASS-brightgreen)](file:///s:/internship/frontend/src/test)
[![Production Build](https://img.shields.io/badge/Vite%20Build-Passing-blue)](file:///s:/internship/frontend/dist)

VELoop Rewards is an enterprise-grade full-stack reward platform built with **Node.js, Express, MongoDB Atlas, React, and Vite**. It features a server-authoritative gamification engine, multi-asset financial rewards ledger, sponsored ad verification engine, token balance reservations, and a dedicated, auditable administrative moderation console.

---

## 1. Project Overview & Key Features

### User Profile & Gamification Center (`/user-profile`)
- **Backend-Driven Identity:** Live profile loading, member seniority, account verification standing, and profile editing.
- **Five-Asset Reward Holdings:** Authoritative wallet balances for **VEs (Virtual Ecosystem), SVEs (Staked), Gems, Tokens, and XP**.
- **Server-Authoritative Level Progression:** 5 canonical progression tiers (Bronze Initiate to Diamond Legend) with live progress percentage and perk unlock rules.
- **Canonical Achievements:** 7 platform achievements with truthful unlock state and atomic XP awards.
- **Sponsored Ad Watching & Verification:** Interactive modal with cryptographically signed single-use HMAC tokens, elapsed-time validation (15s minimum), 60-second cooldown, daily limits (20/day), and level-scaled rewards.
- **Token Redemption & Balance Reservation:** Payout infrastructure allowing users to request platform Token redemptions with atomic balance reservation.
- **Real User Referrals:** Live referral tree metrics (+100 VEs / +200 XP per active friend) and copy-to-clipboard interactions.
- **Recent Activity Ledger:** Unified chronological stream aggregating daily check-ins, ad watch rewards, redemptions, and level advancements.

### System Administration & Security Console (`/admin`)
- **Role-Protected Access:** Multi-layered RBAC (`role: 'admin'`) guarding administrative APIs.
- **Live Ecosystem Telemetry:** Real-time stats for registered users, active percentage, reward distributions, and pending payouts.
- **User Directory & Account Moderation:** Paginated directory with search, filtering, and account suspension/restoration enforcing mandatory audit reasons.
- **Auditable Balance Adjustments:** Authorized wallet credit/debit adjustments committing permanent records to the audit ledger.
- **Withdrawal Review Workflow:** Administrative approval or rejection with atomic token refunds.
- **Immutable Security Audit Ledger:** Searchable compliance log capturing all administrative actions, targets, deltas, and justifications.

---

## 2. System Architecture & Technology Stack

```
VELoop-Rewards/
├── backend/
│   ├── config/             # DB connection (DNS SRV fallback), level tiers, achievement catalog
│   ├── controllers/        # Auth, Profile, Ads, Admin, Withdrawals, Learning
│   ├── middleware/         # JWT authentication (protect) & RBAC (authorize)
│   ├── models/             # Mongoose schemas: User, Wallet, Withdrawal, DailyCheckIn,
│   │                       # AdImpression, UserAchievement, AdminAuditLog
│   ├── routes/             # REST routing endpoints
│   ├── services/           # Level service, ad engine, withdrawal transaction engine
│   └── tests/              # 235 automated tests (node:test)
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI cards, modals, tables, badges, skeletons
│   │   ├── context/        # AuthContext, ToastContext
│   │   ├── pages/          # UserProfilePage, AdminDashboardPage, AdminUsersPage, etc.
│   │   ├── services/       # apiClient (Axios + JWT interceptor), profileService, adService, adminService
│   │   └── test/           # 70 automated tests (Vitest + Testing Library)
├── postman/                # Working Postman collection for all API workflows
└── documentation/          # Comprehensive technical markdown guides
```

### Technology Stack
- **Backend:** Node.js v22, Express.js 4, MongoDB Atlas with Mongoose 8 (ACID Transactions), BcryptJS, JSONWebToken (HS256).
- **Frontend:** React 18, Vite 5, CSS Modules, Lucide React icons, Bootstrap layout utilities.
- **Testing:** Native `node:test` + `assert/strict`, Vitest, Supertest, React Testing Library.

---

## 3. Quick Start & Development Commands

### Prerequisites
- Node.js v20+ or v22+
- NPM v10+
- MongoDB Atlas cluster or local MongoDB instance

### 1. Monorepo Installation
```bash
# Clone the repository
git clone https://github.com/someshkumar58/VELoop-Rewards.git
cd VELoop-Rewards

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Environment Configuration
Copy `.env.example` templates to `.env`:
```bash
# Backend configuration
cp backend/.env.example backend/.env

# Frontend configuration
cp frontend/.env.example frontend/.env
```

### 3. Run Automated Tests
```bash
# Run backend test suite (235 tests across 65 suites)
npm --prefix backend test

# Run frontend test suite (70 tests across 9 test files)
npm --prefix frontend test -- --run
```

### 4. Start Development Servers
```bash
# Start backend server (starts on http://localhost:5000)
npm --prefix backend run dev

# Start frontend development server (starts on http://localhost:5173)
npm --prefix frontend run dev
```

Visit the application at **http://localhost:5173/**.

---

## 4. Evaluation Credentials

The application provides full demonstration access:

| Role | Route | Email | Password | Details |
| :--- | :--- | :--- | :--- | :--- |
| **System Admin** | `/admin/login` | `admin@veloop.io` | `Admin@2026` | Pre-seeded on Atlas with 1-click **Autofill** |
| **Active Member**| `/user-profile` | `marcus@veloop.io` | `User@2026` | Level 4 Gold Pioneer, full balance suite |

For complete evaluation workflows and reset instructions, refer to [DEMO_ACCESS.md](DEMO_ACCESS.md).

---

## 5. Technical Documentation Index

Detailed specifications and architectural guides are available in the repository:
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** — Complete RESTful endpoint schemas, request/response bodies, status codes.
- **[DATABASE.md](DATABASE.md)** — Mongoose models, data isolation, indexes, relationships, and ACID transaction rules.
- **[SECURITY.md](SECURITY.md)** — Authentication tokens, bcrypt hashing, RBAC, anti-cheat ad engine, and threat modeling.
- **[ADMIN_GUIDE.md](ADMIN_GUIDE.md)** — Operations manual for the administration console, moderation, and audit trails.
- **[TESTING.md](TESTING.md)** — Test scenarios, execution commands, and verified verification outcomes.
- **[DEMO_ACCESS.md](DEMO_ACCESS.md)** — Evaluation credentials, seed scripts, and local testing instructions.

---

## 6. Deployment Architecture

- **Backend:** Deployed to **Render / Railway** with automatic HTTPS and environment-injected MongoDB Atlas connection strings.
- **Frontend:** Deployed to **Vercel / Netlify** with optimized Vite production build and reverse proxy routing.
- **Database:** Hosted on **MongoDB Atlas** with automated SRV failover (`8.8.8.8` / `1.1.1.1` DNS resolution) and multi-region replication.
