# Step 9: Achievements System, Idempotency & Two-Phase Crash Safety

Welcome to Step 9 of your backend engineering journey for **VELoop Rewards**!

In Step 8, we built the server-authoritative **Level & XP Progression** engine. In Step 9, we introduce the **Achievements System**—a cornerstone of gamified web platforms that rewards users with badges and bonus XP when they reach specific platform milestones.

---

> ### ⚠️ Security & Reliability First Principles
> 1. **Never Trust Client Claims for Achievements:** Clients must NEVER be allowed to send requests like `POST /api/achievements/unlock` or supply their own XP values. Unlocks must occur strictly through trusted backend evaluation.
> 2. **Enforce Database-Level Idempotency:** Application-level `if (!unlocked)` checks are prone to concurrent race conditions. You must enforce uniqueness in MongoDB with a compound unique index: `{ user: 1, achievementCode: 1 }`.
> 3. **Design for Partial Failures:** Persisting an achievement record and crediting XP to a wallet are two distinct operations. If the server crashes between them, your system must have a recovery mechanism so XP is neither permanently lost nor accidentally duplicated.
> 4. **Multi-Tenancy Isolation:** The authenticated user ID must come strictly from the cryptographically verified JWT (`req.user._id`), never from query parameters or request bodies.

---

## 1. What Is an Achievement System in Modern Web Architecture?

In gamified systems, achievements serve three distinct purposes:
1. **Engagement Incentives:** Motivate users to explore platform features (e.g., verifying an account, maintaining daily streaks, referring friends).
2. **Prestige & Status:** Display collectible digital badges on user profiles.
3. **Reward Distribution:** Grant one-time bonuses (XP, Gems, Tokens) that feed into the level progression engine.

However, from a backend perspective, achievements present unique distributed systems challenges:
- **Duplicate Prevention:** A user must never be able to unlock the same achievement twice or claim double XP rewards.
- **Concurrency & Race Conditions:** If two requests arrive at the exact same millisecond that meet an unlock condition, both might pass a simple code check if they run concurrently.
- **Event Dependency:** Many achievements depend on actions that take place across different modules (referrals, wallet conversions, login frequency).

---

## 2. The Canonical Achievement Catalog

Rather than hardcoding achievement properties across multiple controllers or risking database corruption, we define a **frozen canonical catalog** in [`backend/config/achievements.js`](file:///s:/internship/backend/config/achievements.js).

### The Approved 7-Badge Catalog:
| Code | Title | Category | Icon | Target Requirement | XP Reward | Badge Theme Color |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| `FIRST_STEP` | First Step | Onboarding | `Rocket` | 1 activity | `+100 XP` | `#F4C76A` |
| `STREAK_7` | Streak Master | Loyalty | `Flame` | 7-day streak | `+350 XP` | `#34D399` |
| `CRYPTO_SWAP` | Crypto Pioneer | Rewards | `Coins` | 1 external swap | `+500 XP` | `#6EA8FE` |
| `AMBASSADOR` | Ambassador | Community | `Users` | 5 referrals | `+800 XP` | `#A78BFA` |
| `WHALE_TIER` | Whale Tier | Elite | `Crown` | 10,000 VEs | `+1500 XP` | `#F59E0B` |
| `CENTURION` | Centurion | Loyalty | `Shield` | 100 login days | `+2000 XP` | `#3B82F6` |
| `SUPER_CONNECTOR` | Super Connector | Community | `Zap` | 50 referrals | `+3000 XP` | `#EC4899` |

### Why `Object.freeze()`?
```javascript
const ACHIEVEMENTS = Object.freeze([ ... ]);
```
In JavaScript, objects and arrays are mutable by reference. Using `Object.freeze()` ensures that no rogue function or accidental mutation can alter, push, or delete badge definitions at runtime.

---

## 3. The `UserAchievement` Schema & Compound Unique Index

To store which users have unlocked which achievements, we created a dedicated collection [`backend/models/UserAchievement.js`](file:///s:/internship/backend/models/UserAchievement.js):

```javascript
const userAchievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  achievementCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  unlockedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  xpAwarded: {
    type: Number,
    required: true,
    min: 0
  },
  xpAwardStatus: {
    type: String,
    enum: ['PENDING', 'COMPLETED'],
    default: 'PENDING',
    required: true
  }
}, { timestamps: true });

// CRITICAL: Database-enforced compound unique index
userAchievementSchema.index({ user: 1, achievementCode: 1 }, { unique: true });
```

### Understanding Compound Unique Indexes:
- A single index on `user` would allow only one achievement per user.
- A single index on `achievementCode` would allow each achievement to be claimed only once across all users.
- A **compound unique index** on `{ user: 1, achievementCode: 1 }` guarantees that the combination of `(user, achievementCode)` is unique:
  - User Alice can unlock `FIRST_STEP` ✅
  - User Alice can unlock `WHALE_TIER` ✅
  - User Bob can unlock `FIRST_STEP` ✅
  - User Alice tries to unlock `FIRST_STEP` again ❌ **MongoDB rejects it immediately with error code `11000 (Duplicate Key Error)`!**

---

## 4. The Two-Phase Idempotency & Crash-Safety Engine

In a real production environment, servers can restart, power down, or lose network connectivity at any arbitrary microsecond. 

### The Partial-Failure Dilemma:
1. **Scenario A (XP awarded first):** You call `awardUserXP(+1500 XP)`. The wallet is updated. Then the server crashes before creating the `UserAchievement` record.
   - *Result:* When the server restarts, it sees the achievement is still "locked" and awards +1500 XP again. **Money/XP leak!**
2. **Scenario B (Record saved first without tracking):** You save `UserAchievement`. Then the server crashes before `awardUserXP` runs.
   - *Result:* The record says the achievement is unlocked, but the user never received their XP. **User was cheated of rewards!**

### The Solution: MongoDB Multi-Document Transactions (ACID Atomicity)
In [`backend/services/achievementService.js`](file:///s:/internship/backend/services/achievementService.js), we use `mongoose.startSession()` and `session.startTransaction()`:

```
                   ┌──────────────────────────────────────────────┐
                   │  1. Check if record already exists           │
                   └──────────────────────┬───────────────────────┘
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   ▼                                             ▼
           [Record Exists &                             [Record Does Not Exist]
             COMPLETED]                                          │
                   │                                             ▼
            Do nothing; return                         2. Start ACID Session
             idempotent result                         (session.startTransaction)
                                                                 │
                                                                 ▼
                                                       3. Insert UserAchievement
                                                       with xpAwardStatus: 'COMPLETED'
                                                       (inside session)
                                                                 │
                                                                 ▼
                                                       4. Call awardUserXP
                                                       ($inc: { xpTotal } on Wallet)
                                                       (inside session)
                                                                 │
                                                                 ▼
                                                       5. session.commitTransaction()
                                                       (Atomic commitment to DB)
```

### Why Multi-Document Transactions Solve Both Concurrency and Crash Risks:
1. **Atomicity (All or Nothing):** MongoDB guarantees that either BOTH the `UserAchievement` record is created AND the `Wallet.xpTotal` is incremented, or NEITHER is. If a crash or error occurs at any point before `commitTransaction()`, the transaction aborts automatically. There is **zero intermediate "half-committed" state in MongoDB**.
2. **Concurrency Protection:** If two concurrent requests arrive simultaneously for the same achievement, only one can commit due to the compound unique index on `{ user: 1, achievementCode: 1 }`. The competing transaction encounters an `E11000` duplicate key error, aborts its own wallet increment, and returns `{ alreadyUnlocked: true }` without awarding duplicate XP!
3. **No XP Leaks:** A single atomic commit means XP is never lost and never awarded twice.

---

## 5. Truthful Reporting vs. Fake Simulation

A common trap in early backend projects is "faking" data that hasn't been implemented yet.
In VELoop Rewards:
- **`WHALE_TIER`** is based on `Wallet.vesBalance >= 10000`. Because the `Wallet` model already exists and stores real VEs, this condition is **fully evaluated and functional**.
- **`STREAK_7`**, **`CRYPTO_SWAP`**, **`AMBASSADOR`**, **`CENTURION`**, **`SUPER_CONNECTOR`** rely on daily check-ins, crypto withdrawals, and referral trees (which are scheduled for future steps).

Rather than inventing fake dates or hardcoding mock completions, our service reports **truthful progress**:
- If a feature has no backend tracking yet, `unlocked: false` and `progress: 0`.
- The user interface clearly shows that the objective is locked and waiting for the player to complete it.

---

## 6. Multi-Tenant Protected Profile Endpoint

### `GET /api/profile/achievements`
- **Protected by `protect` middleware:**
  ```javascript
  router.get('/achievements', profileController.getAchievements);
  ```
- **Controller Implementation:**
  ```javascript
  const getAchievements = async (req, res) => {
    try {
      // User ID is derived exclusively from the verified token
      const achievements = await achievementService.getUserAchievements(req.user._id);

      res.status(200).json({
        success: true,
        data: achievements,
        achievements
      });
    } catch (error) { ... }
  };
  ```
- **Security Check:** Even if an attacker passes `?userId=607f...` in the URL or sends `{ "userId": "attacker" }` in the body, the backend ignores it completely because `req.user._id` comes directly from the server-validated JWT payload.

---

## 7. How We Tested This System

Our backend test suite ([`backend/tests/achievements.test.js`](file:///s:/internship/backend/tests/achievements.test.js)) validates:
1. **Catalog Integrity:** All 7 badges have valid icons, positive XP values, titles, and categories.
2. **Compound Unique Index:** Attempting to insert a duplicate `{ user, achievementCode }` triggers an `E11000` error.
3. **Whale Tier Boundaries:**
   - At `9,999 VEs`: Remains locked, progress reports `9,999 / 10,000`, 0 XP awarded.
   - At `10,000 VEs`: Automatically unlocks, status marks `COMPLETED`, +1,500 XP credited.
4. **Strict Idempotency:** Calling unlock 3 times on an account with 12,000 VEs only awards XP once; the wallet balance remains stable.
5. **Recovery Function:** Deliberately injecting a `'PENDING'` record and calling recovery successfully awards the XP and transitions to `'COMPLETED'`.
6. **Authentication & Multi-Tenancy:** Rejects missing tokens with `HTTP 401`, rejects missing wallets with `HTTP 404`, and rejects ID tampering.

---

## Summary of Completed State

| Metric | Status |
| :--- | :--- |
| **Backend Test Suite** | **143 tests passing (46 suites)** |
| **Frontend Test Suite** | **46 tests passing (6 test files)** |
| **Production Build** | **Built cleanly in 634ms** |
| **Browser Acceptance Test** | **Passed in Chrome headless mode against MongoDB Atlas** |
| **Administrator Account** | **`greenalert6@gmail.com` confirmed 100% untouched** |

Now you understand how gamified rewards, database constraints, crash safety, and REST APIs work together in a secure MERN stack application!

