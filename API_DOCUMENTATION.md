# VELoop Rewards — REST API Documentation

This document specifies the complete RESTful API contract for the VELoop Rewards platform.

---

## 1. Authentication & Security Specifications

All protected endpoints require an HTTP `Authorization` header containing a valid JSON Web Token (JWT):
```http
Authorization: Bearer <jwt_token>
```

### Standard HTTP Status Codes
| Code | Meaning | Description |
| :--- | :--- | :--- |
| `200 OK` | Success | The request succeeded and returned the requested payload. |
| `201 Created` | Resource Created | A new entity (user, withdrawal reservation, ad session) was created. |
| `400 Bad Request` | Validation Failure | Malformed JSON, missing mandatory fields, or business rule violation. |
| `401 Unauthorized` | Unauthenticated | Missing, invalid, or expired JWT bearer token. |
| `403 Forbidden` | Access Denied | Authenticated user lacks permission (e.g. non-admin calling admin API or suspended account). |
| `404 Not Found` | Entity Missing | Target user, wallet, withdrawal, or route was not found. |
| `409 Conflict` | Concurrency Conflict | Race condition or duplicate resource conflict. |
| `500 Server Error` | Internal Failure | Unhandled server error. |

---

## 2. Authentication APIs

### 2.1 User Registration
- **Method / Route:** `POST /api/auth/register`
- **Access:** Public
- **Request Body:**
```json
{
  "name": "Alexander Wright",
  "email": "alex.wright@veloop.io",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "referralCode": "VEL-OPTIONAL"
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "message": "User registered successfully.",
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "60d0fe4f5311236168a109ca",
    "name": "Alexander Wright",
    "email": "alex.wright@veloop.io",
    "role": "user",
    "referralCode": "VEL-A9B1C2",
    "accountStatus": "Active"
  }
}
```

### 2.2 User Login
- **Method / Route:** `POST /api/auth/login`
- **Access:** Public
- **Request Body:**
```json
{
  "email": "alex.wright@veloop.io",
  "password": "Password123!"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "60d0fe4f5311236168a109ca",
    "name": "Alexander Wright",
    "email": "alex.wright@veloop.io",
    "role": "user",
    "accountStatus": "Active",
    "level": 4
  }
}
```

### 2.3 Administrator Login
- **Method / Route:** `POST /api/admin/auth/login`
- **Access:** Public (Enforces `role: 'admin'`)
- **Request Body:**
```json
{
  "email": "admin@veloop.io",
  "password": "Admin@2026"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "admin": {
    "id": "6afe901116f966444cb1d0bb",
    "name": "System Administrator",
    "email": "admin@veloop.io",
    "role": "admin"
  }
}
```

---

## 3. User Profile APIs (`/api/profile`)

All endpoints in this section require `protect` middleware (`Authorization: Bearer <user_token>`).

### 3.1 Get Current User Profile
- **Route:** `GET /api/profile/me`
- **Response `200 OK`:**
```json
{
  "success": true,
  "user": {
    "id": "60d0fe4f5311236168a109ca",
    "userId": "VEL-894210",
    "fullName": "Alexander Wright",
    "email": "alex.wright@veloop.io",
    "phone": "+1 (555) 382-9102",
    "avatarUrl": "",
    "referralCode": "VEL-ALEX99",
    "accountStatus": "Active",
    "isVerified": true,
    "level": 4,
    "createdAt": "2024-03-15T10:00:00.000Z"
  }
}
```

### 3.2 Update User Profile
- **Route:** `PATCH /api/profile/me`
- **Request Body:**
```json
{
  "name": "Alexander G. Wright",
  "phone": "+1 (555) 999-0000",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```
- **Integrity Rule:** Privileged fields (`role`, `level`, `email`, `passwordHash`, `accountStatus`) are strictly ignored.

### 3.3 Authoritative Wallet Reward Balances
- **Route:** `GET /api/profile/rewards`
- **Response `200 OK`:**
```json
{
  "success": true,
  "rewards": {
    "ves": 4850.50,
    "sves": 1220.00,
    "gems": 345,
    "tokens": 85.00,
    "xp": 12450
  }
}
```

### 3.4 Level & XP Progress
- **Route:** `GET /api/profile/level-progress`
- **Response `200 OK`:**
```json
{
  "success": true,
  "progress": {
    "currentLevel": 4,
    "levelName": "Gold Pioneer",
    "totalXP": 12450,
    "currentLevelXPRequirement": 10000,
    "nextLevelXPRequirement": 15000,
    "remainingXP": 2550,
    "progressPercentage": 83,
    "rewardMultiplier": "1.25x",
    "perks": "+25% all reward multipliers, zero-fee token swaps"
  }
}
```

### 3.5 Achievements Catalog & Unlocks
- **Route:** `GET /api/profile/achievements`
- **Response `200 OK`:**
```json
{
  "success": true,
  "achievements": [
    {
      "id": "ach_01",
      "code": "FIRST_STEP",
      "title": "First Step",
      "description": "Completed your first platform reward activity.",
      "category": "Onboarding",
      "icon": "Rocket",
      "badgeColor": "#F4C76A",
      "xpReward": 100,
      "unlocked": true,
      "unlockedAt": "2024-03-15T12:00:00.000Z",
      "progress": 1,
      "required": 1
    }
  ]
}
```

### 3.6 User Referrals Overview
- **Route:** `GET /api/profile/referrals`
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "referralCode": "VEL-ALEX99",
    "totalReferrals": 5,
    "successfulReferrals": 4,
    "pendingReferrals": 1,
    "earnedRewardsVEs": 400,
    "earnedRewardsXP": 800,
    "referredUsers": [
      {
        "id": "usr_991",
        "name": "Marcus Aurelius",
        "email": "m***@veloop.io",
        "joinedDate": "2026-10-30",
        "status": "Active"
      }
    ]
  }
}
```

### 3.7 Recent Activity Ledger
- **Route:** `GET /api/profile/activity`
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "act_ci_60d0fe4f",
      "type": "Daily Bonus",
      "amount": "+25 VEs",
      "timestamp": "2026-11-19T05:00:00.000Z",
      "time": "1 hour ago",
      "status": "COMPLETED",
      "icon": "Calendar"
    }
  ]
}
```

### 3.8 Submit Token Withdrawal Request
- **Route:** `POST /api/profile/withdrawals`
- **Request Body:**
```json
{
  "amount": 25.00,
  "asset": "tokens",
  "payoutMethod": "CRYPTO_USDC",
  "destination": "0x71C...B492"
}
```
- **Integrity Rule:** Requires `asset: "tokens"`. Automatically reserves 25.00 Tokens from `Wallet.tokensBalance` using ACID transactions.

---

## 4. Sponsored Ad Watching APIs (`/api/ads`)

All ad endpoints require `protect` middleware (`Authorization: Bearer <user_token>`).

### 4.1 Get Ad Availability Status
- **Route:** `GET /api/ads/status`
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "canWatch": true,
    "dailyRemaining": 20,
    "dailyLimit": 20,
    "cooldownRemaining": 0,
    "baseReward": 15,
    "multiplier": 1.25,
    "potentialReward": 18.75,
    "level": 4,
    "levelName": "Gold Pioneer"
  }
}
```

### 4.2 Start Ad Session
- **Route:** `POST /api/ads/start-session`
- **Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "impressionToken": "a1b2c3d4e5f6...",
    "minWatchDuration": 15,
    "expiresAt": "2026-11-19T06:15:00.000Z",
    "baseReward": 15,
    "multiplier": 1.25,
    "potentialReward": 18.75
  }
}
```

### 4.3 Claim Ad Reward
- **Route:** `POST /api/ads/claim-reward`
- **Request Body:**
```json
{
  "impressionToken": "a1b2c3d4e5f6..."
}
```
- **Integrity Rule:** The backend calculates elapsed time between session start and claim. Rejects early claims (<15s) with `HTTP 400`. Enforces single-use tokens and prevents double-crediting.

---

## 5. Administrative Console APIs (`/api/admin`)

All administrative endpoints require `protect, authorize('admin')`.

### 5.1 Dashboard Telemetry
- **Route:** `GET /api/admin/dashboard/stats`
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 12,
      "usersGrowth": "+12.4% this month",
      "activeUsers": 11,
      "activePercentage": 91.7,
      "suspendedUsers": 1,
      "suspendedPercentage": 8.33,
      "totalRewardsDistributed": 4850.50,
      "pendingWithdrawalsCount": 2,
      "pendingWithdrawalsAmount": 50.00,
      "totalReferralsRecorded": 8,
      "adminActionsToday": 4
    },
    "rewardDistribution": [
      { "name": "VEs Distributed", "amount": 4850.50, "color": "#F4C76A" },
      { "name": "SVEs Staked", "amount": 1220.00, "color": "#6EA8FE" },
      { "name": "Gems Claimed", "amount": 345, "color": "#A78BFA" },
      { "name": "Tokens Swapped", "amount": 85.00, "color": "#C7CEDB" }
    ],
    "recentActivities": [],
    "recentAdminLogs": []
  }
}
```

### 5.2 User Directory Search & Pagination
- **Route:** `GET /api/admin/users?page=1&limit=10&search=Alexander&status=Active`
- **Response `200 OK`:**
```json
{
  "success": true,
  "users": [
    {
      "id": "60d0fe4f5311236168a109ca",
      "userId": "VEL-894210",
      "fullName": "Alexander Wright",
      "email": "alex.wright@veloop.io",
      "accountStatus": "Active",
      "level": 4,
      "vesBalance": 4850.50,
      "tokensBalance": 85.00,
      "referralsCount": 5,
      "registeredDate": "2024-03-15",
      "lastActive": "2026-10-30 14:22"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### 5.3 User Profile & Wallet Details
- **Route:** `GET /api/admin/users/:id`
- **Response `200 OK`:** Returns full user profile, authoritative wallet holdings, and referral standings.
- **Response `404 Not Found`:** Returns exact contract message:
```json
{
  "success": false,
  "message": "Member with identifier 'non-existent-user-id' was not found in the directory."
}
```

### 5.4 Update User Account Status (Moderation)
- **Route:** `PATCH /api/admin/users/:id/status`
- **Request Body:**
```json
{
  "status": "Suspended",
  "reason": "Automated script detection on click fraud"
}
```
- **Integrity Rule:** `reason` is mandatory. Creates an immutable `AdminAuditLog` record.

### 5.5 Auditable Balance Adjustment
- **Route:** `POST /api/admin/rewards/adjust`
- **Request Body:**
```json
{
  "userId": "VEL-894210",
  "asset": "ves",
  "amount": 100,
  "reason": "Promotional campaign adjustment"
}
```
- **Integrity Rule:** Cannot reduce balance below zero. Creates an immutable `AdminAuditLog` record.

### 5.6 Review Pending Withdrawal
- **Route:** `PATCH /api/admin/withdrawals/:id`
- **Request Body:**
```json
{
  "status": "Rejected",
  "reason": "Address verification failed"
}
```
- **Integrity Rule:** Atomically refunds reserved tokens upon rejection. Re-reviewing is prevented.
