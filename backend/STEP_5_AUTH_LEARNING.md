# Step 5: Authentication, Password Hashing & Role-Based Authorization

Welcome to Step 5 of your backend development journey for **VELoop Rewards**!

In Step 4A and Step 4B, we designed our data models (`User` and `Wallet`). Now in Step 5, we implement the security gateway of our application: **User Registration, Login with bcrypt Password Hashing, JSON Web Tokens (JWT), and Protected Role-Based Middleware**.

---

> ### ⚠️ Security First Principles
> 1. **Never Store Plaintext Passwords:** Passwords must always be hashed with a one-way salt using `bcryptjs` before reaching the database.
> 2. **Never Return Hashes or Credentials in Responses:** Responses to the client must exclude `passwordHash` (configured via `{ select: false }` in Mongoose and sanitized in controllers).
> 3. **Never Hardcode JWT Secrets:** `JWT_SECRET` must live strictly in `.env`.
> 4. **Never Trust Client Claims for Roles:** Roles must come from verified server-signed tokens, never from unauthenticated request bodies.

---

## 1. Authentication versus Authorization

Although they sound similar, they perform completely different functions:

| Concept | Simple Question | Real-Life Analogy | VELoop Rewards Example |
| :--- | :--- | :--- | :--- |
| **Authentication** (AuthN) | *"Who are you?"* | Showing your national ID or passport at airport security | Entering your email and password to log in and receive a JWT |
| **Authorization** (AuthZ) | *"What are you allowed to do?"* | Showing a VIP boarding pass to enter the First Class Lounge | Checking whether `user.role === 'admin'` before allowing access to `/api/admin/users` |

- **Authentication** verifies your identity.
- **Authorization** verifies your permissions.

---

## 2. Why Passwords Must Never Be Stored as Plain Text

If a company stores passwords in plaintext (e.g., `user.password = "mySecret123"`):
1. **Database Leaks:** If a database backup is compromised or an employee inspects records, every customer password is exposed.
2. **Credential Stuffing:** Because people often reuse passwords across services (email, bank, social media), a breach on one site exposes accounts everywhere.

---

## 3. Password Hashing with bcrypt & Why It Is NOT Encryption

A common misconception among beginners is thinking hashing is "encryption".

| Concept | Nature | Reversible? | Primary Use Case |
| :--- | :--- | :--- | :--- |
| **Encryption** | Two-way mathematical function | **YES** (with a decryption key) | Encrypting a file or message so the recipient can decrypt and read it |
| **Hashing** | One-way irreversible cryptographic digest | **NO** (impossible to reverse mathematically) | Storing passwords safely |

### How bcrypt Works:
1. **One-Way Digest:** You pass `Password123` into bcrypt; it outputs an irreversible 60-character string:
   ```text
   $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
   ```
   Even the server developer or database administrator cannot reverse this string back into `Password123`.
2. **Cryptographic Salt:** bcrypt automatically generates a random "salt" (random bytes prepended to the password before hashing). This prevents "Rainbow Table" attacks (precomputed dictionaries of common password hashes).
3. **Adaptive Work Factor (Cost Factor):** bcrypt deliberately takes a small fraction of time (~100ms with salt rounds = 10) to compute. This makes brute-force dictionary attacks computationally prohibitive for attackers.

### How Verification Works on Login:
When the user types their password to log in, bcrypt takes the entered password and the stored salt, recomputes the hash, and checks if the outputs match:
```javascript
const isMatch = await bcrypt.compare(enteredPassword, user.passwordHash);
```

---

## 4. How Registration and Login Work

```text
======================= USER REGISTRATION FLOW =======================
Client                              Backend                             Database
  │                                    │                                    │
  │── POST /api/auth/register ────────>│                                    │
  │   { name, email, password }        │ 1. Validate inputs                 │
  │                                    │ 2. Check duplicate email           │
  │                                    │ 3. Hash password:                  │
  │                                    │    hash = await bcrypt.hash(...)   │
  │                                    │ 4. Save User with passwordHash ───>│
  │                                    │                                    │
  │<── HTTP 201 Created ───────────────│                                    │
  │   { success, token, user }         │ (Never returns passwordHash!)      │

========================== USER LOGIN FLOW ==========================
Client                              Backend                             Database
  │                                    │                                    │
  │── POST /api/auth/login ───────────>│                                    │
  │   { email, password }              │ 1. Find user by email ────────────>│
  │                                    │    (retrieve +passwordHash)        │
  │                                    │ 2. Compare passwords:              │
  │                                    │    bcrypt.compare(password, hash)  │
  │                                    │ 3. Generate signed JWT:            │
  │                                    │    jwt.sign({ id, role }, secret)  │
  │<── HTTP 200 OK ────────────────────│                                    │
  │   { success, token, user }         │                                    │
```

---

## 5. What a JWT Is & How Bearer Tokens Work

A **JSON Web Token (JWT)** is a compact, URL-safe, digitally signed string that securely transmits claims between the client and the server.

A JWT consists of three parts separated by dots (`.`):
```text
header.payload.signature
```

1. **Header:** The signing algorithm (e.g., `HS256`).
2. **Payload:** The token claims (e.g., `{ id: "6724...", role: "user", exp: 1730000000 }`).
3. **Signature:** Created by taking the encoded header, payload, and the server's private `JWT_SECRET`:
   `HMACSHA256(base64(header) + "." + base64(payload), JWT_SECRET)`

### How Bearer Tokens Work in HTTP:
After logging in, the frontend saves the token in `localStorage` (`veloop_auth_token` or `veloop_admin_token`).
On every subsequent API request, the frontend sends the token in the standard HTTP `Authorization` header:
```http
GET /api/profile/me HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 6. How Authentication Middleware Protects an API Endpoint

Express middleware runs between the incoming request and your controller:

```javascript
const protect = async (req, res, next) => {
  // 1. Read Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  // 2. Extract token
  const token = authHeader.split(' ')[1];

  try {
    // 3. Verify digital signature using server secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Attach verified user identity to request object
    req.user = await User.findById(decoded.id).select('-passwordHash');
    next(); // Pass control to the controller
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
  }
};
```

---

## 7. Role-Based Authorization (RBAC)

To protect administrative endpoints (like `/api/admin/users` or `/api/admin/rewards/adjust`), we use role-authorization middleware:

```javascript
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user?.role}' is not authorized to access this resource`
      });
    }
    next();
  };
};
```

- If a normal user (`role: 'user'`) attempts to access an admin route, they receive **HTTP 403 Forbidden**.
- If an administrator (`role: 'admin'`) makes the request, they are granted access.

---

## 8. Why JWT Secrets Belong in Environment Variables

The `JWT_SECRET` is the cryptographic key used to sign and verify tokens.
- **If the secret is committed to GitHub:** Anyone who inspects the repository can forge legitimate-looking administrator tokens and hijack any account.
- **Keeping it in `.env`:** Ensures the secret stays strictly on your local machine or hosting server.

---

## 9. Illustrative Request & Response Examples

### Register User (Illustrative Example)
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Sarah Student",
  "email": "sarah@veloop.edu",
  "password": "Password123!"
}
```

**Response (HTTP 201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "672728f1e8a2b3c4d5e6f7a1",
    "name": "Sarah Student",
    "email": "sarah@veloop.edu",
    "role": "user",
    "accountStatus": "Active",
    "level": 1
  }
}
```
*(Notice: `passwordHash` is never returned).*

### Admin Login (Illustrative Example)
```http
POST /api/admin/auth/login
Content-Type: application/json

{
  "email": "admin@veloop.io",
  "password": "AdminPassword123"
}
```

**Response (HTTP 200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "admin": {
    "id": "672728f1e8a2b3c4d5e6f7a2",
    "name": "Platform Administrator",
    "email": "admin@veloop.io",
    "role": "admin"
  }
}
```

---

## 10. Registration & Wallet Provisioning Plan (Step 4B/5 Integration)

Currently, `User` and `Wallet` are distinct Mongoose models.

### The Risk of Non-Atomic Provisioning:
In a naive registration controller:
```javascript
const user = await User.create({ name, email, passwordHash });
// If the server crashes or network hiccups right here:
const wallet = await Wallet.create({ user: user._id }); // Fails!
```
The user is left in the database without an authoritative wallet! Any subsequent reward operations for this user will crash.

### MongoDB Atlas Multi-Document ACID Transactions:
Because our MongoDB Atlas deployment (`Cluster0`) is a 3-node **Replica Set**, it fully supports multi-document ACID transactions via Mongoose sessions:

```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  const user = await User.create([{ name, email, passwordHash }], { session });
  const wallet = await Wallet.create([{ user: user[0]._id }], { session });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```
In upcoming integration steps, this atomic session pattern will ensure that every user is guaranteed a valid wallet upon account creation.

