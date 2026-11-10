# VELoop Rewards — API Integration Status & Specification

This document maps all REST API endpoints defined in the frontend services, their contract schemas, and their integration readiness with the Node.js/Express.js backend.

---

## 1. Authentication Endpoints

| Endpoint | Method | Service Function | Headers | Payload / Params | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/admin/auth/login` | `POST` | `adminService.login` | None | `{ email, password }` | Ready & Intercepted |
| `/api/admin/auth/me` | `GET` | `adminService.getMe` | `Bearer <token>` | None | Ready |
| `/api/admin/auth/logout` | `POST` | `adminService.logout` | `Bearer <token>` | None | Ready |

---

## 2. User Profile Endpoints

| Endpoint | Method | Service Function | Payload / Params | Expected Response | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/profile/me` | `GET` | `profileService.getProfile` | None | `{ id, fullName, userId, email, referralCode, memberSince, accountStatus, isVerified, ... }` | Ready & Tested |
| `/api/profile/me` | `PATCH` | `profileService.updateProfile` | `{ fullName, email, phone }` | `{ success: true, user: { ... } }` | Ready & Tested |
| `/api/profile/rewards` | `GET` | `profileService.getRewardAssets` | None | `{ ves, sves, gems, tokens, xp }` | Ready & Tested |
| `/api/profile/level-progress` | `GET` | `profileService.getLevelProgress` | None | `{ currentLevel, levelName, totalXP, nextLevelXPRequirement, remainingXP, progressPercentage }` | Implemented & Tested (Step 8) |
| `/api/profile/achievements` | `GET` | `profileService.getAchievements` | None | `[ { id, code, title, description, category, icon, unlocked, unlockedAt, xpReward, badgeColor, progress, required } ]` | Implemented & Tested (Step 9) |
| `/api/profile/withdrawal-summary` | `GET` | `profileService.getWithdrawalSummary` | None | `{ totalRequests, pendingCount, pendingAmount, approvedCount, rejectedCount, successfullyWithdrawnAmount }` | Ready & Tested |
| `/api/profile/referrals` | `GET` | `profileService.getReferrals` | None | `{ referralCode, totalReferrals, successfulReferrals, pendingReferrals, referralRewardsVEs, ... }` | Ready & Tested |
| `/api/profile/activity` | `GET` | `profileService.getRecentActivity` | None | `[ { id, type, title, amount, timestamp, status, icon } ]` | Ready & Tested |

---

## 3. Administrative Management Endpoints

| Endpoint | Method | Service Function | Payload / Params | Expected Response | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/admin/dashboard/stats` | `GET` | `adminService.getDashboardStats` | None | `{ stats: { ... }, rewardDistribution: [ ... ], recentActivities: [ ... ] }` | Ready & Tested |
| `/api/admin/users` | `GET` | `adminService.getUsers` | `?search=&status=&page=&limit=` | `{ users: [ ... ], total, page, limit }` | Ready & Tested |
| `/api/admin/users/:id` | `GET` | `adminService.getUserDetails` | URL param `id` | `{ id, fullName, email, accountStatus, balances, ... }` | Ready & Tested |
| `/api/admin/users/:id/status` | `PATCH` | `adminService.updateUserStatus` | `{ status, reason }` | `{ success: true, message: 'Status updated' }` | Ready & Tested |
| `/api/admin/rewards` | `GET` | `adminService.getRewardsOverview` | None | `{ distribution: [ ... ], totalVEsDistributed, reserveVaultBalance }` | Ready & Tested |
| `/api/admin/rewards/adjust` | `POST` | `adminService.adjustUserReward` | `{ userId, asset, amount, reason }` | `{ success: true, transactionId, newBalance }` | Ready & Tested |
| `/api/admin/levels` | `GET` | `adminService.getLevels` | None | `[ { id, level, name, minXP, maxXP, multiplier, perks } ]` | Ready & Tested |
| `/api/admin/levels/:id` | `PUT` | `adminService.updateLevel` | `{ name, minXP, maxXP, multiplier, perks }` | `{ success: true, level: { ... } }` | Ready & Tested |
| `/api/admin/achievements` | `GET` | `adminService.getAchievements` | None | `[ { id, title, description, xpReward, category, icon } ]` | Ready & Tested |
| `/api/admin/achievements/:id` | `PUT` | `adminService.updateAchievement` | `{ title, description, xpReward, category }` | `{ success: true, achievement: { ... } }` | Ready & Tested |
| `/api/admin/withdrawals` | `GET` | `adminService.getWithdrawals` | `?status=` | `[ { id, requestId, userId, userName, amount, currency, status } ]` | Ready & Tested |
| `/api/admin/withdrawals/:id` | `PATCH` | `adminService.reviewWithdrawal` | `{ status: 'Approved'\|'Rejected', reason }` | `{ success: true, withdrawal: { ... } }` | Ready & Tested |
| `/api/admin/referrals` | `GET` | `adminService.getReferrals` | None | `[ { referralCode, referrerName, referredUser, date, status } ]` | Ready & Tested |
| `/api/admin/activity` | `GET` | `adminService.getActivities` | None | `[ { id, user, type, amount, time, status } ]` | Ready & Tested |
| `/api/admin/audit-logs` | `GET` | `adminService.getAuditLogs` | None | `[ { id, adminUser, actionType, entityType, entityId, reason, timestamp } ]` | Ready & Tested |
| `/api/admin/settings` | `GET` | `adminService.getSettings` | None | `{ platformName, contactEmail, minWithdrawalUSD, ... }` | Ready & Tested |
| `/api/admin/settings` | `PUT` | `adminService.updateSettings` | `{ platformName, minWithdrawalUSD, ... }` | `{ success: true, settings: { ... } }` | Ready & Tested |

---

## 4. API Client Features

- **Base URL:** Defined via `VITE_API_URL` environment variable.
- **Request Interceptor:** Automatically injects JWT Bearer tokens from `localStorage` (`veloop_auth_token` or `veloop_admin_token`).
- **Response Interceptor:** Normalizes Axios error envelopes into `{ status, message, details, isNetworkError }`.
- **Offline / Error Resilience:** When the backend server is offline and preview mode is toggled off, services do not silently fall back to fake data; they emit error events and render the `ErrorState` component with a retry button.
