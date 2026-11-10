# Step 2: REST API Fundamentals, Express Routes, and Controllers

Welcome to Step 2 of your backend development journey for **VELoop Rewards**!

In Step 1, we initialized our Node.js + Express backend and created a basic `/api/health` endpoint. In Step 2, we explore how real-world backends organize code using **Routes** and **Controllers**, how HTTP methods work, how data flows through requests and responses, and how status codes communicate outcomes.

---

> ### ⚠️ Critical Educational Notice: Temporary Learning Module Only
> - **In-Memory Storage Only:** All sample users created, edited, or deleted in `/api/learning/users` live purely inside server RAM (a JavaScript array). **When the server restarts or code changes, all data resets.**
> - **Pedagogical Purpose:** These endpoints exist strictly to teach you REST fundamentals and HTTP methods.
> - **Do NOT Connect to Production UI:** Never link this learning module to the real User Profile, Admin Dashboard, Wallet, or Rewards system.
> - **No Real Credentials:** No real user accounts, passwords, or token transactions are handled here.

---

## 1. Core Architecture Concepts

### What is a Route?
A **Route** is a traffic sign or URL mapping. It tells Express: *"When an incoming HTTP request arrives at this specific URL with this HTTP method, direct it to this specific handler function."*

In Express, routes are grouped into routers using `express.Router()`.
- Example file: `backend/routes/learningRoutes.js`
- Example:
  ```javascript
  router.get('/:id', learningController.getUserById);
  ```
  This tells Express: *"When someone sends a `GET` request to `/:id`, run the `getUserById` function."*

---

### What is a Controller?
A **Controller** is the brain that executes the business logic. It receives the incoming request, processes the data (validation, calculations, querying data), and constructs the HTTP response.

By separating routes and controllers:
- **Routes (`learningRoutes.js`)**: Keep the URL structure clean and readable.
- **Controllers (`learningController.js`)**: Keep the business logic isolated and testable.

---

### What are `req` and `res`?
Every Express route handler receives two primary objects:
1. **`req` (Request Object):** Represents the incoming HTTP request sent by the client (browser, mobile app, Postman, curl). It contains headers, URL parameters, query strings, and the request body.
2. **`res` (Response Object):** Represents the outgoing HTTP response that Express sends back to the client. It provides methods like:
   - `res.status(code)`: Sets the HTTP status code (e.g., 200, 201, 404).
   - `res.json(data)`: Serializes JavaScript objects into a JSON string and sets the `Content-Type: application/json` header.
   - `res.send()`: Sends a raw response.

---

### What is `req.params`?
**`req.params`** contains route parameters extracted from the path of the URL.
- When you define a route with a colon: `router.get('/:id', ...)`
- And a client visits: `GET /api/learning/users/42`
- Express parses the parameter into an object: `req.params = { id: "42" }`
- Notice that route parameters are strings, so we convert them to numbers: `parseInt(req.params.id, 10)`.

---

### What is `req.body`?
**`req.body`** contains the data sent by the client inside the HTTP request body (usually as JSON in `POST`, `PUT`, or `PATCH` requests).
- Example payload sent by client:
  ```json
  {
    "name": "Charlie Student",
    "email": "charlie@example.com"
  }
  ```
- Because we configured `app.use(express.json())` middleware in `server.js`, Express automatically parses the JSON text and populates `req.body`:
  ```javascript
  const { name, email } = req.body;
  ```

---

## 2. HTTP Methods (Verbs)

| HTTP Method | Purpose | Typical Use Case | Request Body? | Idempotent? |
| :--- | :--- | :--- | :---: | :---: |
| **`GET`** | Read / Retrieve data | Fetch all users, or fetch user by ID | No | Yes |
| **`POST`** | Create new resource | Add a new user to the list | Yes | No |
| **`PATCH`** | Partially update a resource | Update just a user's name or email | Yes | No |
| **`PUT`** | Completely replace a resource | Replace the entire user object | Yes | Yes |
| **`DELETE`** | Remove a resource | Delete a user by ID | No | Yes |

*Note: **Idempotent** means making the exact same request multiple times leaves the system in the same state.*

---

## 3. HTTP Status Codes

Status codes are 3-digit standardized numbers that inform the client about the result of their request:

| Status Code | Meaning | When to Use It |
| :--- | :--- | :--- |
| **`200 OK`** | Success | Request succeeded and data is returned (e.g., `GET`, `PATCH`). |
| **`201 Created`** | Resource Created | Request succeeded and a new resource was created (e.g., `POST`). |
| **`204 No Content`** | Action Completed | Request succeeded, but there is no body data to return (e.g., `DELETE`). |
| **`400 Bad Request`** | Client Input Error | The client sent invalid or missing data (e.g., missing name, invalid email format, malformed JSON). |
| **`404 Not Found`** | Resource Does Not Exist | The requested URL or resource ID was not found (e.g., user ID 999). |
| **`500 Internal Server Error`** | Server Crash / Bug | Something broke on the backend (unexpected exception, unhandled rejection). |

---

## 4. Why Temporary In-Memory Storage is NOT a Database

In this learning step, we stored users in a variable inside `learningController.js`:
```javascript
let learningUsers = [ ... ];
```

Here is why this is only suitable for learning, not production:
1. **Volatile Memory (RAM):** Variables live in Node's active process RAM. When the server process stops, reboots, or crashes, the RAM is cleared, and all added data is permanently lost.
2. **No Concurrency / Persistence:** Memory cannot scale across multiple server instances or clusters; each server instance would have its own separate memory copy.
3. **No ACID Guarantees:** There are no transaction guarantees, no indexing for fast searching among millions of records, and no relationships.
4. **Why Databases Exist:** Databases like **MongoDB** (which we will introduce in later steps) write data persistently to permanent storage (hard drive/SSD) and handle concurrent queries safely.

---

## 5. Step 2 Endpoints Reference

| Method | Endpoint | Description | Expected Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Preserved backend health check | `200` |
| `GET` | `/api/learning/users` | List all sample learning users | `200` |
| `GET` | `/api/learning/users/:id` | Get single user by numeric ID | `200`, `400`, `404` |
| `POST` | `/api/learning/users` | Create sample user (`name`, `email`) | `201`, `400` |
| `PATCH` | `/api/learning/users/:id` | Update user (`name` and/or `email`) | `200`, `400`, `404` |
| `DELETE`| `/api/learning/users/:id` | Delete user by numeric ID | `204`, `400`, `404` |

---

## 6. How to Run the Automated Tests

From the `backend` directory:
```bash
npm test
```
This executes Node's built-in test runner (`node --test`) with Supertest against `tests/learningApi.test.js`, testing all 5 HTTP methods, input validations, 404 handling, and malformed JSON errors.

