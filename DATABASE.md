# VELoop Rewards — Database Architecture & Data Model

This document outlines the MongoDB Atlas schema design, entity relationships, database indexing, and data ownership rules.

---

## 1. Architectural Philosophy: Separation of Concerns

Financial asset integrity is the highest architectural priority in VELoop Rewards:
1. **User Identity Isolation:**
   Profile identity (name, email, avatar, phone, referral codes) is stored in the `User` collection.
2. **Wallet Balance Isolation:**
   Authoritative currency holdings (**VEs, SVEs, Gems, Tokens, and XP**) are strictly stored in the `Wallet` collection. Updating a user's phone number or avatar can never touch or risk corrupting financial balances.
3. **Strict One-to-One Ownership:**
   Each registered user possesses exactly one `Wallet` document, enforced at the database engine level via a unique compound index on `user`.
4. **ACID Transaction Safeguards:**
   All multi-document operations (registration + wallet creation, withdrawal submission + token reservation, withdrawal rejection + token refund) use MongoDB Multi-Document ACID Transactions (`session.withTransaction`).

---

## 2. Collection Schemas & Models

### 2.1 `User` Model (`backend/models/User.js`)
Represents registered participants and platform administrators.

```javascript
{
  _id: ObjectId,
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, select: false }, // Bcrypt hash, never returned in default queries
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  accountStatus: { type: String, enum: ['Active', 'Suspended', 'Pending'], default: 'Active' },
  userId: { type: String, uppercase: true, trim: true }, // e.g. VEL-894210
  phone: { type: String, trim: true },
  avatarUrl: { type: String, default: '' },
  referralCode: { type: String, uppercase: true, trim: true },
  referredBy: { type: String, uppercase: true, default: null },
  isVerified: { type: Boolean, default: false },
  level: { type: Number, default: 1, min: 1 },
  createdAt: Date,
  updatedAt: Date
}
```

### 2.2 `Wallet` Model (`backend/models/Wallet.js`)
Represents the authoritative financial ledger for platform reward assets.

```javascript
{
  _id: ObjectId,
  user: { type: ObjectId, ref: 'User', required: true, unique: true, index: true },
  vesBalance: { type: Number, default: 0, min: 0, alias: 'ves' },    // Decimal (2 places)
  svesBalance: { type: Number, default: 0, min: 0, alias: 'sves' },  // Decimal (2 places)
  gemsBalance: { type: Number, default: 0, min: 0, alias: 'gems' },  // Integer
  tokensBalance: { type: Number, default: 0, min: 0, alias: 'tokens' }, // Decimal (2 places)
  xpTotal: { type: Number, default: 0, min: 0, alias: 'xp' },        // Integer
  createdAt: Date,
  updatedAt: Date
}
```

### 2.3 `Withdrawal` Model (`backend/models/Withdrawal.js`)
Tracks balance reservations and payout redemption requests.

```javascript
{
  _id: ObjectId,
  requestId: { type: String, required: true, unique: true, uppercase: true }, // e.g. W-1001
  user: { type: ObjectId, ref: 'User', required: true, index: true },
  requestedAmount: { type: Number, required: true, min: 0.01 },
  asset: { type: String, default: 'tokens', enum: ['tokens'] },
  feeAmount: { type: Number, default: 0 },
  netAmount: { type: Number, required: true },
  payoutMethod: { type: String, enum: ['CRYPTO_USDC', 'CRYPTO_USDT', 'BANK_WIRE', 'PAYPAL', 'OTHER'] },
  destination: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING', index: true },
  rejectionReason: { type: String },
  reviewedBy: { type: ObjectId, ref: 'User' },
  reviewedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 2.4 `DailyCheckIn` Model (`backend/models/DailyCheckIn.js`)
Tracks daily reward logins and streak milestones.

```javascript
{
  _id: ObjectId,
  user: { type: ObjectId, ref: 'User', required: true, index: true },
  checkInDate: { type: Date, required: true },
  streakCount: { type: Number, default: 1, min: 1 },
  rewardEarned: { type: Number, default: 25 },
  createdAt: Date
}
```

### 2.5 `AdImpression` Model (`backend/models/AdImpression.js`)
Enforces secure ad watching sessions and prevents replay attacks.

```javascript
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: 'User', required: true, index: true },
  impressionToken: { type: String, required: true, unique: true },
  status: { type: String, enum: ['STARTED', 'COMPLETED', 'CLAIMED', 'EXPIRED'], default: 'STARTED' },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
  claimedAt: Date,
  expiresAt: { type: Date, required: true },
  minWatchDuration: { type: Number, default: 15 },
  baseReward: { type: Number, default: 15 },
  levelMultiplier: { type: Number, default: 1.0, min: 1.0 },
  rewardEarned: { type: Number, default: 0 },
  createdAt: Date
}
```

### 2.6 `UserAchievement` Model (`backend/models/UserAchievement.js`)
Records verified achievement unlocks with idempotency guarantees.

```javascript
{
  _id: ObjectId,
  user: { type: ObjectId, ref: 'User', required: true, index: true },
  achievementCode: { type: String, required: true }, // e.g. WHALE_TIER
  unlockedAt: { type: Date, default: Date.now },
  xpAwarded: { type: Number, required: true, min: 0 }
}
```

### 2.7 `AdminAuditLog` Model (`backend/models/AdminAuditLog.js`)
Permanent security audit ledger for all privileged administrator actions.

```javascript
{
  _id: ObjectId,
  adminId: { type: ObjectId, ref: 'User', required: true, index: true },
  adminUser: { type: String, required: true },
  actionType: { type: String, required: true, index: true },
  entityType: { type: String, required: true },
  entityId: { type: String, required: true, index: true },
  previousValue: { type: String, default: 'N/A' },
  newValue: { type: String, default: 'N/A' },
  reason: { type: String, required: true, minlength: 3 },
  details: { type: Object, default: {} },
  timestamp: { type: Date, default: Date.now, index: true }
}
```

---

## 3. Database Indexes

| Collection | Indexed Fields | Index Type | Purpose |
| :--- | :--- | :--- | :--- |
| `users` | `{ email: 1 }` | Unique | Enforces single account per email address |
| `users` | `{ userId: 1 }` | Unique / Sparse | Rapid lookup for member codes (VEL-894210) |
| `users` | `{ referralCode: 1 }` | Unique / Sparse | Attribution lookup for referral signups |
| `users` | `{ referredBy: 1 }` | Standard | Referral tree aggregation |
| `wallets` | `{ user: 1 }` | Unique | Strict 1:1 user-to-wallet relationship |
| `withdrawals` | `{ requestId: 1 }` | Unique | Idempotent withdrawal lookups |
| `withdrawals` | `{ user: 1, createdAt: -1 }` | Compound | Fast user withdrawal history |
| `withdrawals` | `{ status: 1 }` | Standard | Administrative filtering of pending requests |
| `adimpressions` | `{ impressionToken: 1 }` | Unique | Replay attack prevention |
| `adimpressions` | `{ userId: 1, completedAt: -1 }` | Compound | Daily limit & cooldown calculations |
| `userachievements`| `{ user: 1, achievementCode: 1 }` | Unique Compound | Strict idempotency (never award XP twice) |
| `adminauditlogs` | `{ timestamp: -1 }` | Standard | Chronological audit stream |
| `adminauditlogs` | `{ entityType: 1, entityId: 1 }` | Compound | Target entity security audit trails |

---

## 4. Multi-Tenancy & Data Ownership

1. **Authentication Token as Single Source of Truth:**
   Protected profile routes never trust client-supplied user IDs in query parameters or request bodies. The owning user is strictly extracted from `req.user._id` via the signed JWT.
2. **Horizontal Privilege Escalation Defense:**
   Queries for wallet balances, achievements, check-ins, and withdrawal histories are scoped strictly to `{ user: req.user._id }`. User A can never inspect or alter User B's records.
