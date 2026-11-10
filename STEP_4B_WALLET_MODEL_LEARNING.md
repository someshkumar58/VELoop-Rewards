# Step 4B: Wallet Schema & Model Fundamentals

Welcome to Step 4B of your backend development journey for **VELoop Rewards**!

In Step 4A, we built the `User` model. In this step, we built the official **Wallet Schema and Model** (`backend/models/Wallet.js`) to manage the platform's 5 core reward assets: **VEs, SVEs, Gems, Tokens, and XP**.

---

> ### ⚠️ Educational Scope for Step 4B
> - **Schema & Model Only:** We have constructed the `Wallet` structure, validation rules, default zero balances, and one-to-one User reference.
> - **No Direct Balance Manipulation Yet:** Real rewards must be modified only via atomic transaction operations (Step 6+), never by unverified direct updates.
> - **No Plaintext Passwords or Auth Logic:** Authentication and JWT guards will be introduced in Step 5 before real wallet APIs are opened.
> - **Zero Atlas Records Modified:** Tests run purely in-memory using Mongoose's internal schema engine.

---

## 1. Why Wallet is Separate from User

In enterprise software and Web3/reward platforms, **Separation of Concerns** is critical:

| Concern | User Model (`User.js`) | Wallet Model (`Wallet.js`) |
| :--- | :--- | :--- |
| **Domain** | Identity & Profile Management | Financial & Rewards Accounting |
| **Frequency of Updates** | Infrequent (updating phone, email, avatar) | High frequency (daily spins, ad views, referrals, swaps) |
| **Security Risk Level** | Medium (profile privacy, email format) | Critical (direct monetary value, fraud targets) |
| **Auditing Requirements** | Standard profile audit logs | Strict double-entry ledger & transactional logs |

### Real-World Bug Prevention:
If balances were stored directly inside `User.js`, updating a user's phone number via `User.findByIdAndUpdate(id, { phone })` or a form submission could accidentally overwrite or zero-out their VEs balance if the frontend payload omitted balance fields. Separating the models makes this class of bugs architecturally impossible.

---

## 2. What `ObjectId` Means
In MongoDB, every document has a unique 12-byte identifier stored in `_id`.

In Mongoose:
```javascript
user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
}
```
An `ObjectId` is a 24-character hexadecimal string generated using:
1. A 4-byte Unix timestamp (when the record was created).
2. A 5-byte random value unique to the machine/process.
3. A 3-byte incrementing counter.

Because `ObjectId` includes a timestamp, it is globally unique and naturally sortable by creation time.

---

## 3. What `ref: 'User'` Means
`ref: 'User'` tells Mongoose which model this `ObjectId` points to.

Think of it like a **Foreign Key** in SQL:
- It establishes a relationship between documents across different collections (`wallets` and `users`).
- It enables Mongoose's **`.populate()`** feature:
  ```javascript
  // Fetch wallet and automatically hydrate the linked User details:
  const wallet = await Wallet.findOne({ user: userId }).populate('user', 'name email accountStatus');
  ```
  Instead of getting just the raw ID, `.populate()` replaces `wallet.user` with the full User document!

---

## 4. One-to-One Relationship Between User and Wallet
In VELoop Rewards, every participant has **exactly one** authoritative reward wallet:

```text
┌────────────────────────┐         1 : 1          ┌────────────────────────┐
│       User Model       │ ◄────────────────────► │      Wallet Model      │
├────────────────────────┤                        ├────────────────────────┤
│ _id: ObjectId("abc1")  │                        │ _id: ObjectId("wal1")  │
│ name: "Alexander"      │                        │ user: ObjectId("abc1") │
│ email: "alex@veloop.io"│                        │ vesBalance: 4850.50    │
└────────────────────────┘                        └────────────────────────┘
```

### How is One-to-One Enforced?
1. In `Wallet.js`:
   ```javascript
   user: {
     type: mongoose.Schema.Types.ObjectId,
     ref: 'User',
     required: true,
     unique: true // Guarantees no duplicate wallet can be created for this user
   }
   ```
2. When Mongoose connects to MongoDB Atlas, it creates a **Unique Index** on the `user` field in the `wallets` collection. If any code attempts to create a second wallet for the same user ID, MongoDB rejects it with:
   `MongoServerError: E11000 duplicate key error collection: veloop_rewards.wallets index: user_1 dup key`.

---

## 5. Default Balances and Validation

When a new user registers on VELoop, they start with clean accounts:

```javascript
vesBalance:    { type: Number, default: 0, min: [0, 'VEs balance cannot be negative'] }
svesBalance:   { type: Number, default: 0, min: [0, 'SVEs balance cannot be negative'] }
gemsBalance:   { type: Number, default: 0, min: [0, 'Gems balance cannot be negative'] }
tokensBalance: { type: Number, default: 0, min: [0, 'Tokens balance cannot be negative'] }
xpTotal:       { type: Number, default: 0, min: [0, 'XP total cannot be negative'] }
```

### Why Reject Negative Balances?
In consumer rewards, users should never have negative balances (unless an explicit overdraft or chargeback mechanism is specifically programmed). Setting `min: 0` ensures that faulty arithmetic or race conditions will fail validation rather than debiting a user into negative points.

---

## 6. Why Financial Balances Need Careful Numeric Representation

Computers use binary (base-2) floating point numbers (IEEE-754 standard). In binary, simple decimal fractions like `0.1` or `0.2` cannot be represented with infinite precision:

```javascript
console.log(0.1 + 0.2); // Output: 0.30000000000000004
```

If a rewards platform calculates:
`4850.50 - 50.10 - 0.20 = 4800.199999999999`
This causes rounding discrepancies, accounting errors, and visual display bugs on the frontend.

### Solutions in Real Backend Architectures:
1. **Decimal Precision / Fixed Rounding (Current Step):**
   Values match the frontend contract (`4850.50`), and all arithmetic calculations in upcoming steps will round to 2 decimal places (`Math.round(val * 100) / 100`) before saving.
2. **Integer Minor Units (Alternative):**
   Storing currency in the smallest unit (e.g. cents or basis points, storing `485050` instead of `4850.50`). *Note: We intentionally did not alter the existing contract to avoid breaking the existing React UI.*
3. **MongoDB Decimal128:**
   High-precision 128-bit decimal type (`mongoose.Schema.Types.Decimal128`) used in high-frequency trading and banking systems.

---

## 7. Difference Between a Wallet Balance and a Transaction History

| Feature | Wallet Balance (`Wallet.js`) | Transaction History (`Transaction.js` - Upcoming) |
| :--- | :--- | :--- |
| **What it is** | A single snapshot of *current* state | An immutable, chronological ledger of *every event* |
| **Example** | `vesBalance: 4850.50` | `+100 VEs (Referral Bonus)`, `-$45.00 (Withdrawal)` |
| **Mutability** | Mutated as balances change | Append-only (never edited or deleted) |
| **Auditing** | Cannot explain *how* the balance was reached | Every cent can be traced back to its origin |

In production, **a balance should always equal the sum of all historical transactions**.

---

## 8. Why Authorization and Atomic Updates are Required Before Real Reward Operations

Before any balance can be modified:
1. **Authentication & Authorization (Step 5):**
   - The user must prove their identity via JWT.
   - An ordinary user can only view their own wallet; only authorized admins can adjust user balances.
2. **Atomic Updates (`$inc`):**
   If two requests arrive at the exact same millisecond (e.g. daily bonus claimed simultaneously on phone and laptop):
   - **Bad (Race Condition):**
     `wallet.vesBalance = wallet.vesBalance + 10; await wallet.save();`
     (One update will overwrite and wipe out the other).
   - **Good (Atomic MongoDB Operation):**
     `await Wallet.updateOne({ user: userId }, { $inc: { vesBalance: 10 } });`
     (MongoDB safely increments the balance at the database engine level without collision).

