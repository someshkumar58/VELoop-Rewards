# VELoop Rewards – Task 14: Complete Full-Stack User Profile & Admin Management System

**Domain:** Full Stack Web Development (MERN Stack)  
**Deliverable:** Complete, Professional, Production-Ready Frontend (React.js + Vite)

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)

### Installation & Launch

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies (React Router v7, Bootstrap 5, Lucide React, Axios, etc.)
npm install

# 3. Start the development server
npm run dev
```

The application will be live at:
**[http://localhost:5173/](http://localhost:5173/)**

---

## 🎨 Technology Stack

- **Framework:** React.js (v19) via Vite
- **Routing:** React Router v7 (`react-router-dom`)
- **Styling:** CSS Modules + Bootstrap 5 Grid/Components
- **Theme:** VELoop Navy Palette (`#161827` primary background)
- **Icons:** Lucide React & React Icons
- **HTTP Client:** Axios with Request & Response Interceptors
- **State Management:** React Context API (`AuthContext`, `ToastContext`)

---

## 📑 Core Modules & Routes

### 1. User Profile Module (`/user-profile`)
The User Profile page implements all 8 mandatory sections:
1. **Profile Hero & Personal Info:** Avatar, Full Name, Unique User ID, Email, Referral Code, Member Since, Status, Level, XP Progress, working copy buttons, and an interactive Edit Profile modal.
2. **Reward Assets:** 5 separate cards (`VEs`, `SVEs`, `Gems`, `Tokens`, `XP`) with distinct iconography, live balance formatting, and hoverable explanatory tooltips with conversion rates.
3. **Level Progress & Achievements:** Tier status, server-authoritative XP progress bar, unlocked achievement badges, locked objectives with progress counters, and upcoming target teasers.
4. **Withdrawal Overview:** Complete accounting overview. Successfully withdrawn amounts ($320.00) strictly exclude pending requests ($45.00). Includes interactive Payout Request modal.
5. **Quick Actions:** Cards for Refer Friends, View Achievements, View Wallet, and 4 backend-contract cards with modal dialogues explaining integration contracts.
6. **Referral Snapshot:** Unique invitation code, one-click copy code & link, referral count metrics, and milestone progress bar.
7. **Recent Activity Stream:** Chronological ledger of daily bonuses, ad rewards, referrals, XP bonuses, withdrawals, and gem wins with category filter tabs.
8. **Account Security:** KYC Tier 2 status, 2FA status, session telemetry, preferences modal, and sign-out functionality.

### 2. Admin Management Module
- `/admin/login`: Secure Admin Login with form validation, show/hide password, and Development Demo Credentials panel.
- `/admin/dashboard`: Platform KPIs, proportional reward distribution breakdown chart, and recent admin audit trail.
- `/admin/users`: Member directory with search, status filters, pagination, and Suspend/Restore modal with mandatory audit reason.
- `/admin/users/:id`: Member dossier with wallet breakdown, moderation controls, and balance adjustment shortcut.
- `/admin/rewards`: Vault holdings, circulation figures, and authorized balance adjustment UI (`POST /api/admin/rewards/adjust`).
- `/admin/levels`: Tier hierarchy configuration (XP min/max, reward multipliers, perks).
- `/admin/achievements`: Badge creation and configuration console.
- `/admin/withdrawals`: Payout approval queue with status filters (Pending, Approved, Rejected) and review modal.
- `/admin/referrals`: Member referral tree and bonus attribution ledger.
- `/admin/activity`: Live real-time stream of all user engagement events.
- `/admin/audit-logs`: Read-only, tamper-evident security audit log viewer.
- `/admin/settings`: Server-authoritative platform parameters and tokenomics limits.

### 3. Fallback Routes
- `/unauthorized`: 403 Access Denied
- `*`: 404 Route Not Found

---

## ⚡ Development Preview Mode

Because backend microservices might not be running during frontend evaluations, this application features a **Development Preview Mode**:
- Enabled by default via `VITE_ENABLE_DEV_PREVIEW=true` in `.env`.
- Displays a visible **"DEMO DATA ACTIVE"** pill and top banner.
- Features an interactive **"Details & Toggle"** control in the top bar to switch between Preview Mode and Live API Mode on the fly.
- When Preview Mode is toggled off without a running backend, real network requests fail gracefully and render accessible `ErrorState` components with a working "Retry" button.

### Demo Admin Credentials
- **Email:** `admin@veloop.io`
- **Password:** `Admin@2026`
*(Can also be populated with 1 click via the "Autofill" button on the Admin Login page)*

---

## 🏗️ Production Build & Verification

```bash
cd frontend
npm run build
```

Production output will be generated inside `frontend/dist/`.

---

## 📚 Project Documentation Files

- [FRONTEND_STRUCTURE.md](file:///s:/internship/frontend/FRONTEND_STRUCTURE.md) — Detailed folder tree and component architecture.
- [FRONTEND_PROGRESS.md](file:///s:/internship/frontend/FRONTEND_PROGRESS.md) — Progress classification across tested, preview, and pending tasks.
- [API_INTEGRATION_STATUS.md](file:///s:/internship/frontend/API_INTEGRATION_STATUS.md) — Full REST API endpoint specification.
