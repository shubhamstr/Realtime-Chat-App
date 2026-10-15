# Security Assessment & Vulnerabilities

## 1. Authentication & Token Management

### 1.1 Unprotected Backend Endpoints (Missing Auth Middleware)
- **Current Behavior:** Although the client sends an `Authorization: <token>` header on REST requests (configured via [client/src/App.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/App.js#L28)), the Express backend does not implement or mount any JWT verification middleware.
- **Impact:** Any client can directly call `/chat/insert`, `/chat/delete`, `/chat/get-all`, or `/users/get-all` without a valid token.
- **Risk Level:** **Critical**

### 1.2 JWT Expiration & Secret Key
- **Current Behavior:** In [server/routes/auth.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/auth.js#L25), `jwt.sign(data, jwtSecretKey)` is called without an `expiresIn` option. Tokens are valid indefinitely.
- **Hardcoded Secrets:** The fallback JWT secret in both code and deployment workflows ([.github/workflows/oci-deploy-server.yml](file:///w:/shubham/personal/Realtime-Chat-App/.github/workflows/oci-deploy-server.yml#L34)) is hardcoded as `socket_secret_chat`.
- **Risk Level:** **High**

---

## 2. Authorization & Data Access

### 2.1 Insecure Direct Object References (IDOR) & User Spoofing
- **Message Insertion:** In `POST /chat/insert` ([server/routes/chat.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/chat.js#L44-L50)), `user_id` and `username` are taken directly from the unverified request body rather than from a validated session. Any user can impersonate another user ID or name.
- **Message Deletion:** In `DELETE /chat/delete` ([server/routes/chat.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/chat.js#L154-L167)), `user_id` is passed in the request body. A malicious user can send any `user_id` matching the author of a message to delete another person's message.
- **Unrestricted Room History Access:** `GET /chat/get-all?room_id=<id>` returns all messages for any room ID without verifying if the requesting user belongs to the room.
- **Risk Level:** **Critical**

---

## 3. Cryptography & Session Continuity

### 3.1 Ephemeral AES Encryption Key
- **Current Behavior:** In [server/routes/auth.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/auth.js#L12-L13):
  ```javascript
  const secretKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  ```
  These encryption parameters are generated in memory each time the Node.js server process starts.
- **Impact:**
  - Encrypted room URLs created before a server restart or in a multi-instance/clustered environment cannot be verified or matched.
  - While room IDs are treated simply as string identifiers in the DB, this prevents deterministic URL re-encryption.
- **Risk Level:** **Medium**

---

## 4. Database & Credential Security

### 4.1 Plaintext Passwords
- **Current Behavior:** The database schema has a `password` field, and [server/routes/users.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/users.js#L72) allows updating passwords without hashing (no bcrypt, Argon2, or PBKDF2).
- **Risk Level:** **High** (if password authentication is enabled in future releases).

---

## 5. Input Validation & Denial of Service (DoS)

### 5.1 Large Payload Limits & Unvalidated Attachments
- **Current Behavior:** [server/server.js](file:///w:/shubham/personal/Realtime-Chat-App/server/server.js#L29) sets `express.json({ limit: "20mb" })` to allow large Base64 images.
- **Vulnerabilities:**
  - The backend performs no MIME-type sniffing or image header verification; any arbitrary Base64 data can be stored in the database.
  - Large Base64 images directly stored in the database cause memory spikes on both the database server and backend during `GET /chat/get-all`.
- **Risk Level:** **Medium**

---

## 6. DevOps & Infrastructure Security

### 6.1 Secret Exposure in CI/CD Logs
- In [.github/workflows/oci-deploy-server.yml](file:///w:/shubham/personal/Realtime-Chat-App/.github/workflows/oci-deploy-server.yml#L46), the workflow executes:
  ```bash
  cat ./server/.env
  ```
  This dumps database credentials (`MONGO_URI`) directly into execution logs.
- In [oci-deploy-server.yml](file:///w:/shubham/personal/Realtime-Chat-App/.github/workflows/oci-deploy-server.yml#L74) and [oci-deploy-client.yml](file:///w:/shubham/personal/Realtime-Chat-App/.github/workflows/oci-deploy-client.yml#L70), the workflow executes `docker exec <container> cat .env`.
- **Risk Level:** **Critical**

---

## 7. Recommended Security Remediations

1. **Implement JWT Auth Middleware:** Create an Express middleware that validates `req.headers.authorization`, verifies the signature using `process.env.JWT_SECRET_KEY`, and attaches `req.user = decodedToken`.
2. **Derive Identity Server-Side:** In `/chat/insert` and `/chat/delete`, extract `user_id` strictly from `req.user.userId` instead of `req.body.user_id`.
3. **Remove `cat .env` from CI/CD:** Delete the debugging lines echoing credentials into workflow run logs.
4. **Use Docker Internal Networks:** Stop exposing database ports (`27017`) to `0.0.0.0`; connect services via Docker bridge networks.
5. **Secure Database Credentials:** Set strong authentication for MongoDB in production.
