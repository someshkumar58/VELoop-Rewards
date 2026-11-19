# VELoop Rewards — Demo Access & Evaluation Guide

This document provides authorized evaluation credentials, live endpoints, and setup procedures for the VELoop Rewards full-stack application.

---

## 1. Quick Access Credentials

### A. Demonstration Administrator Access
The platform includes a pre-seeded, active administrative account in MongoDB Atlas.

| Parameter | Value |
| :--- | :--- |
| **Admin Portal Route** | `/admin/login` |
| **Local URL** | `http://localhost:5173/admin/login` |
| **Email** | `admin@veloop.io` |
| **Password** | `Admin@2026` |
| **Role** | `admin` (System Administrator) |
| **Autofill Support** | Click the **"Autofill"** button in the development credentials box on the admin login page |

### B. Demonstration Member / User Access
You can register an unlimited number of isolated test users via `/register`, or use the following pre-configured account:

| Parameter | Value |
| :--- | :--- |
| **User Profile Route** | `/user-profile` |
| **Login Route** | `/login` |
| **Local URL** | `http://localhost:5173/login` |
| **Email** | `marcus@veloop.io` |
| **Password** | `User@2026` |
| **User ID** | `VEL-894210` |
| **Referral Code** | `VEL-ALEX99` |

---

## 2. Environment Verification & Startup

### Prerequisites
- Node.js v20+ or v22+
- NPM v10+
- Internet access (for MongoDB Atlas connection)

### A. Backend Startup
```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already installed)
npm install

# Run automated test suite (235 tests across 65 suites)
npm test

# Start the Express API server (starts on http://localhost:5000)
npm run dev
```

### B. Frontend Startup
```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run frontend test suite (70 tests across 9 suites)
npm test -- --run

# Start Vite development server (starts on http://localhost:5173)
npm run dev
```

---

## 3. Seed & Reset Instructions

### Provisioning the Demo Administrator
If the database is reset or deployed into a new cluster, run the automated provisioning script:
```bash
node -e "
const path = require('path');
require('dotenv').config({ path: './backend/.env' });
const bcrypt = require('bcryptjs');
const { connectDB, disconnectDB } = require('./backend/config/db');
const User = require('./backend/models/User');

async function seed() {
  await connectDB();
  const existing = await User.findOne({ email: 'admin@veloop.io' });
  if (!existing) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Admin@2026', salt);
    await User.create({
      name: 'System Administrator',
      email: 'admin@veloop.io',
      passwordHash,
      role: 'admin',
      accountStatus: 'Active',
      userId: 'VEL-ADM001',
      referralCode: 'VEL-ADMIN1',
      isVerified: true
    });
    console.log('Admin seeded successfully.');
  }
  await disconnectDB();
}
seed();
"
```

---

## 4. Evaluation Workflows to Test

### User Workflow
1. Visit `http://localhost:5173/user-profile`.
2. Inspect server-authoritative reward balances: **VEs, SVEs, Gems, Tokens, and XP**.
3. View **Level 4 (Gold Pioneer)** progress bar and progression requirements.
4. Inspect the **7 canonical platform achievements** with truthful unlock status.
5. Review **Referral Snapshot** and copy personal referral link/code.
6. Open **Watch Sponsored Ad** modal via Quick Actions:
   - Starts a secure 15-second timer backed by a cryptographically signed HMAC impression token.
   - Enforces a 60-second cooldown and awards 15 VEs multiplied by the current level tier multiplier.
7. Open **Redeem Tokens** modal to submit a withdrawal reservation (strictly `tokens`).

### Admin Workflow
1. Visit `http://localhost:5173/admin/login`.
2. Click **Autofill** (`admin@veloop.io` / `Admin@2026`) and click **Authenticate & Access Console**.
3. View live **Ecosystem Telemetry**, portfolio distribution bar, and live activity streams.
4. Navigate to **User Directory** (`/admin/users`), search for members by User ID or email.
5. Open a member's detail page (`/admin/users/:id`), test **Account Suspension** with mandatory justification.
6. Check **Security Audit Ledger** (`/admin/audit-logs`) to verify the suspension event is committed.
7. Open **Reward Management** (`/admin/rewards`) to perform an auditable balance credit or debit.
8. Review pending withdrawal payouts (`/admin/withdrawals`).
