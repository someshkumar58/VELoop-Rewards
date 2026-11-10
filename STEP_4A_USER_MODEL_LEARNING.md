# Step 4A: User Schema and Mongoose Model

Welcome to Step 4A of your backend development journey for **VELoop Rewards**!

In Step 3, we successfully connected Express to MongoDB Atlas using Mongoose. In this step, we built the official **User Schema and Model** (`backend/models/User.js`) based directly on the frontend contract.

---

> ### ⚠️ Educational Scope for Step 4A
> - **Schema & Model Only:** We have constructed and validated the User structure in Mongoose.
> - **No Real Data Operations Yet:** We have not created registration, login, JWT issuance, or database seeding.
> - **No Plaintext Passwords:** Plaintext passwords must never be stored. The schema includes an optional, protected `passwordHash` field prepared for Step 5 (Authentication with bcrypt).
> - **Separation of Concerns:** Financial balances (`ves`, `sves`, `tokens`, `gems`, `xp`) are deliberately kept off the User model; they belong in a dedicated `Wallet` model to protect accounting integrity.

---

## 1. Database vs. Collection vs. Document

To understand MongoDB, think of an analogy with traditional filing systems or spreadsheets:

| Concept | Spreadsheet Analogy | MongoDB Concept | VELoop Rewards Example |
| :--- | :--- | :--- | :--- |
| **Database** | Entire Workbook file (.xlsx) | Database container | `veloop_rewards` |
| **Collection** | An individual worksheet / tab | Group of related records | `users` (or `wallets`, `transactions`) |
| **Document** | A single row in a worksheet | A single JSON/BSON object | `{ _id: ..., name: "Alexander Wright", email: "alex@veloop.io" }` |

- A **Database** holds multiple collections.
- A **Collection** holds multiple documents.
- A **Document** is a self-contained record with key-value pairs.

---

## 2. What is a Schema?
A **Schema** is the architectural blueprint for documents in a collection.

While raw MongoDB is "schemaless" (meaning MongoDB by itself would let you save anything, even inconsistent or corrupted records), **Mongoose Schemas** give your Node.js application structure, validation, type-casting, and safety rules before data is written to disk.

In `backend/models/User.js`, our schema defines:
- What fields are allowed (`name`, `email`, `role`, `accountStatus`, etc.).
- What data types they must be (`String`, `Number`, `Boolean`).
- What validation constraints apply (required, minlength, regular expressions).

---

## 3. What is a Model?
If the **Schema** is the architectural blueprint of a house, the **Model** is the construction company and manager.

A **Model** is a compiled, active Mongoose constructor class that provides an interface to query, insert, update, and delete documents in the MongoDB collection:
```javascript
const User = mongoose.model('User', userSchema);
```

When you call `mongoose.model('User', userSchema)`:
1. Mongoose automatically looks for the lowercase, pluralized collection name in MongoDB: `'users'`.
2. The `User` model gives you methods like `User.find()`, `User.findOne()`, `User.create()`, and `user.save()`.

---

## 4. What Does `mongoose.Schema` Do?
`new mongoose.Schema(definition, options)` configures the schema definition and its behavior:
- **Type Casting:** If someone sends `"level": "4"` as a string, Mongoose automatically casts it to the number `4`.
- **Validation Rules:** Executes validators (`required`, `minlength`, `enum`, `match`) during `user.validate()` and before `.save()`.
- **Getters & Setters:** Transforms data when set (e.g., our `accountStatus` setter capitalizes `'active'` to `'Active'`).
- **Aliases & Virtuals:** Creates aliases (like `fullName` aliased to `name`) so your backend seamlessly matches frontend conventions.
- **Middleware Hooks:** Allows attaching lifecycle hooks (e.g., pre-save password hashing in Step 5).

---

## 5. What Do `required`, `unique`, `default`, and `enum` Mean?

### `required`
Ensures that a field cannot be null, undefined, or empty.
```javascript
name: {
  type: String,
  required: [true, 'Name is required']
}
```
If a client attempts to save a user without a name, validation immediately throws a descriptive error.

### `unique`
Tells Mongoose to create a **Unique Index** on that field in MongoDB.
```javascript
email: {
  type: String,
  unique: true
}
```
This guarantees that no two documents in the `users` collection can have the same email address.

### `default`
Supplies a fallback value if no value was provided when creating a new document.
```javascript
level: {
  type: Number,
  default: 1
}
```
When a new user registers on VELoop, they automatically start at Level 1 without requiring manual input.

### `enum`
Restricts the allowed values of a string to a predefined whitelist.
```javascript
role: {
  type: String,
  enum: ['user', 'admin'],
  default: 'user'
}
```
If someone passes `role: "superadmin"` or `role: "hacker"`, validation rejects it immediately.

---

## 6. What Are `createdAt` and `updatedAt`?
When you enable `{ timestamps: true }` in the schema options:
```javascript
const userSchema = new mongoose.Schema({ ... }, { timestamps: true });
```
Mongoose automatically manages two `Date` fields:
1. **`createdAt`:** Recorded once when the document is first created in the database. In the frontend, this provides the basis for `"Member Since: March 15, 2024"`.
2. **`updatedAt`:** Automatically updated whenever any field in the document is modified and saved.

---

## 7. Difference Between Schema Validation and Database Indexes

This is one of the most important concepts for beginners to understand:

| Feature | Schema Validation (`validate()` / `validateSync()`) | Database Indexes (`unique: true`) |
| :--- | :--- | :--- |
| **Where it runs** | Locally in Node.js process memory | Inside the MongoDB Atlas storage engine (wiredTiger) |
| **Checks performed** | Types, regex, min/max length, required, enums | Fast searching, ordering, duplicate key prevention |
| **Does it touch network?** | No network call required | Maintained on disk/RAM across all database replica sets |
| **Unique email check** | ❌ Cannot check uniqueness in memory alone | ✅ Enforces uniqueness cluster-wide via B-tree index |

**Why `validate()` alone cannot check uniqueness:**
When `user.validate()` runs on your laptop, it examines only that single `user` object in JavaScript memory. It cannot know what other users exist across the internet in MongoDB Atlas without querying the database. Uniqueness is enforced when MongoDB attempts to write to the unique index; if the email exists, MongoDB aborts the write with error code `E11000 duplicate key error`.

---

## 8. How Will `User` Relate to `Wallet` in a Later Step?

In modern financial and reward architectures (like VELoop Rewards), user identity and monetary assets are kept in separate models:

```text
┌────────────────────────┐              ┌────────────────────────┐
│       User Model       │              │      Wallet Model      │
├────────────────────────┤              ├────────────────────────┤
│ _id: ObjectId("...")   │ ◄──────────┐ │ _id: ObjectId("...")   │
│ name: "Alexander"      │            └─┼ user: ObjectId("...")  │
│ email: "alex@veloop.io"│              │ vesBalance: 4850.50    │
│ role: "user"           │              │ tokensBalance: 85.00   │
│ level: 4               │              │ gemsBalance: 345       │
│ createdAt: 2024-03-15  │              │ xpTotal: 12450         │
└────────────────────────┘              └────────────────────────┘
```

### Why Separate User and Wallet?
1. **Security & Auditing:** Updating a profile (e.g. changing phone number or avatar) must never accidentally touch or overwrite balance fields.
2. **Double-Entry Bookkeeping:** Balances in `Wallet` will be updated through atomic database transactions tied to a `Transaction` ledger.
3. **Mongoose Population:** Using `ref: 'User'` in the `Wallet` model allows Mongoose to link them seamlessly:
   ```javascript
   const wallet = await Wallet.findOne({ user: userId }).populate('user', 'name email');
   ```

