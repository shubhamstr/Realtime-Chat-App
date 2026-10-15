# AI Coding Rules & Engineering Guidelines

> **Permanent instructions for AI coding agents working on the Realtime Chat App codebase.**
> 
> All AI agents modifying or generating code in this repository MUST strictly follow these rules. Conventions are grounded in the active codebase (`client/` and `server/`). Where existing practices present security or reliability risks, this document clearly delineates **Existing Conventions** from **Recommended Improvements & Requirements**.

---

## 1. Core Operating Principles

1. **Grounded Implementation:** Never invent patterns, abstractions, or libraries that do not exist in this project.
2. **Minimal & Surgical Changes:** Prefer the smallest, cleanest diff that solves the problem. Never touch unrelated files or refactor code outside the immediate scope of the task.
3. **Reuse Before Creating:** Before creating any new component, utility, route, API client, or database query, search the codebase for an existing solution to reuse or extend.
4. **Dual Database Requirement:** Any feature touching data persistence **MUST** be implemented identically for both **MySQL** ([server/db/mysql.js](file:///w:/shubham/personal/Realtime-Chat-App/server/db/mysql.js)) and **MongoDB** ([server/db/mongo.js](file:///w:/shubham/personal/Realtime-Chat-App/server/db/mongo.js)).
5. **No Secrets or Hardcoded Config:** Never hardcode credentials, URLs, ports, or secrets. Always consume configurations from environment variables.
6. **Preserve Public APIs:** Maintain backward compatibility for all existing REST endpoints, Socket.IO events, and database adapter method signatures unless explicitly instructed.
7. **Documentation Synchronization:** Whenever architecture, APIs, database schemas, or workflows change, the corresponding documentation under `.ai/` (e.g. `API.md`, `DATABASE.md`, `ARCHITECTURE.md`) **must** be updated in the same pull request.

---

## 2. Architecture & Design Patterns

### 2.1 Monorepo Structure
The repository is split into two independent workspaces:
- `client/`: React 16.8 SPA initialized with Create React App, styled with Material-UI v4 and `@chatscope/chat-ui-kit-react`.
- `server/`: Node.js Express 4 server integrated with Socket.IO 4 and dual database adapters (MySQL / MongoDB).

### 2.2 Communication Architecture
- **REST Endpoints:** Used for transactional persistence (auth, message storage, message deletion, user lookups, notification settings updates).
- **Socket.IO:** Used for duplex real-time broadcasts (`room-message`, `message-deleted`, `typing`, `stopTyping`).
- **REST & Socket Bridge:** Express routes broadcast to rooms using `req.app.get("io").to(roomId).emit(...)`.

### 2.3 Database Adapter Pattern
- [server/db/index.js](file:///w:/shubham/personal/Realtime-Chat-App/server/db/index.js) dynamically loads the adapter based on `process.env.DB_PROVIDER` (`'mysql'` vs `'mongo'`).
- Both adapters must export the exact same async function signatures and return compatible data structures.

---

## 3. Folder Structure & Code Placement

```
Realtime-Chat-App/
├── .ai/                       # AI context, architecture, API, and rule documentation
├── .github/workflows/         # CI/CD pipelines (OCI Docker deployments, DB deploy)
├── client/
│   ├── public/                # Static assets, favicon, index.html
│   └── src/
│       ├── api/               # Axios API wrappers (api-client.js, auth.js, chat.js, user.js)
│       ├── assets/            # Global stylesheets (scss/css) and images
│       ├── components/        # Shared layout helpers (RouteWithLayout, PrivateRouteWithLayout)
│       ├── layouts/           # Structural layouts (Minimal)
│       ├── store/             # Redux Toolkit store (store.js) and slices (authSlice.js)
│       ├── theme/             # Material-UI theme configurations
│       ├── views/             # Page-level components & subcomponents (LogIn, Chat)
│       ├── App.js             # Root container, auth bootstrapping, theme provider
│       └── Routes.js          # React Router v5 route definitions
└── server/
    ├── db/                    # Database abstraction layer
    │   ├── index.js           # Dynamic provider selector
    │   ├── mysql.js           # MySQL raw queries (mysql driver)
    │   ├── mongo.js           # Mongoose schemas & queries
    │   └── socket_chat.sql    # Relational SQL schema dump
    ├── routes/                # Express router modules (auth.js, chat.js, users.js)
    └── server.js              # Application entry point, HTTP server, CORS, Socket.IO
```

### Placement Rules:
- **New Frontend Views:** Place in `client/src/views/<ViewName>/<ViewName>.js`. Subcomponents belong in `client/src/views/<ViewName>/components/`.
- **New Shared Components:** Place in `client/src/components/<ComponentName>/`.
- **New API Clients:** Place in `client/src/api/<resource>.js`, importing the base instance from `client/src/api/api-client.js`.
- **New Server Routes:** Place in `server/routes/<resource>.js` and mount in `server/server.js`.
- **New Database Queries:** Add method to both `server/db/mysql.js` AND `server/db/mongo.js`. Do not write database queries inside route handlers.

---

## 4. Naming Conventions

| Entity | Pattern | Existing Project Examples |
| :--- | :--- | :--- |
| **Component Files** | `PascalCase.js` | `ChatScreen.js`, `LogIn.js`, `RouteWithLayout.js` |
| **Component Names** | `PascalCase` | `ChatScreen`, `MinimalLayout`, `LogIn` |
| **API Client Files** | `camelCase.js` or `kebab-case.js` | `chat.js`, `auth.js`, `api-client.js` |
| **API Client Functions** | `camelCase` with `API` / `Api` suffix | `sendMessageAPI`, `getAllChatAPI`, `signInApi` |
| **Redux Slices** | `camelCaseSlice.js` | `authSlice.js` |
| **Route Handler Files** | `camelCase.js` | `auth.js`, `chat.js`, `users.js` |
| **SQL Columns** | `snake_case` | `user_id`, `room_id`, `email_notification_flag` |
| **Mongoose Fields** | `snake_case` (mirrors SQL) | `user_id`, `room_id`, `email_notification_flag` |
| **Socket.IO Events** | `camelCase` or `kebab-case` | `joinRoom`, `room-message`, `message-deleted`, `stopTyping` |
| **Environment Variables** | `UPPER_SNAKE_CASE` | `DB_PROVIDER`, `JWT_SECRET_KEY`, `REACT_APP_API_URL` |

---

## 5. TypeScript & JavaScript Conventions

1. **Client-Side:**
   - ES6+ Modules (`import` / `export`).
   - JSX syntax in `.js` files.
   - Indentation: 2 spaces. Single quotes `'...'`. No trailing commas (per [client/.prettierrc](file:///w:/shubham/personal/Realtime-Chat-App/client/.prettierrc)).
   - Do NOT mix TypeScript (`.ts`/`.tsx`) into the client unless an explicit migration is commissioned.
2. **Server-Side:**
   - CommonJS syntax (`require(...)` and `module.exports`).
   - `async / await` preferred over `.then().catch()` chains for readability, though existing `.then().catch()` patterns may be maintained for local consistency.
   - Native Node.js modules: use built-in `crypto`, `http`, `path`. Do not import third-party stubs when built-ins exist.

---

## 6. React Conventions

1. **Component Styles:**
   - Use React Functional Components with Hooks (`useState`, `useEffect`, `useRef`, `useCallback`) for new components.
   - Respect existing class components (e.g. `App.js`), but do NOT create new class components.
2. **Prop Validation:**
   - Define `propTypes` for all component props using `prop-types` (required by `.eslintrc`).
3. **Styling & Theming:**
   - Use Material-UI v4 `makeStyles(theme => ({ ... }))` or inline chatscope styling.
   - Do NOT introduce TailwindCSS, Bootstrap, or styled-components.
   - For interactive chat UI, reuse `@chatscope/chat-ui-kit-react` elements (`ChatContainer`, `MessageList`, `Message`, `MessageInput`).
4. **State Management:**
   - Local state for UI toggles, modals, inputs, and optimistic data.
   - Redux Toolkit (`authSlice`) for session and global user details.
   - Use `useSelector` and `useDispatch` hooks.

---

## 7. Backend Conventions

1. **Express Routing:**
   - Use `express.Router()`.
   - Never write database logic directly in router files; delegate to `server/db`.
2. **Real-time Event Emission:**
   - Access the Socket.IO instance via `const io = req.app.get("io")`.
   - Always emit to the targeted room: `io.to(room_id).emit(eventName, payload)`.
3. **Dual Adapter Compliance:**
   - When writing DB methods, ensure MySQL methods return `{ insertId }` or normalized objects, and Mongo methods return lean documents (`.lean()`).
   - Note ID discrepancy: MySQL uses numeric `id`, MongoDB uses string/ObjectId `_id`. The client relies on `item.id || item._id`. Ensure new endpoints maintain this compatibility.

---

## 8. API Development & Standards

### 8.1 Unified Response Envelope
All REST API endpoints MUST return JSON with the following structure:
```json
// Success Response (HTTP 200)
{
  "err": false,
  "msg": "Descriptive success message",
  "data": { ... }
}

// Error Response (HTTP 200 or 4xx/5xx)
{
  "err": true,
  "msg": "Descriptive human-readable error message",
  "data": null
}
```

### 8.2 Endpoint Standards
- **Existing Convention:** The current backend returns HTTP `200` with `"err": true` on business or validation logic failures.
- **Rules for New Endpoints:** Maintain the `{ err, msg, data }` envelope. Do not return raw unwrapped data arrays or strings.
- **Query & Param Sanitization:** Always parse and validate query parameters (`req.query.room_id`) and body payloads (`req.body`).

---

## 9. Database Evolution Rules

1. **Dual Schema Maintenance:**
   - If adding a field to `messages` or `users`, add it to:
     1. [server/db/socket_chat.sql](file:///w:/shubham/personal/Realtime-Chat-App/server/db/socket_chat.sql) (or migration script).
     2. Mongoose Schemas in [server/db/mongo.js](file:///w:/shubham/personal/Realtime-Chat-App/server/db/mongo.js).
     3. Query builders in [server/db/mysql.js](file:///w:/shubham/personal/Realtime-Chat-App/server/db/mysql.js).
2. **Preventing SQL Injections:**
   - Current codebase uses `mysql.escape(value)`.
   - For all new MySQL queries, use parameterized prepared statements: `db.query('SELECT * FROM users WHERE id = ?', [id])`.
3. **Indexing:**
   - Ensure foreign keys and filter fields (`room_id`, `user_id`) have indexes in both schemas.

---

## 10. Authentication & Authorization

1. **Current State:**
   - Login issues a JWT signed with `process.env.JWT_SECRET_KEY`.
   - Client stores token in `localStorage.getItem("token")` and injects `Authorization: <token>` in [client/src/App.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/App.js).
   - *Vulnerability in current codebase:* Server endpoints currently lack active JWT verification middleware.
2. **Required Rules for Agents:**
   - Whenever touching protected endpoints (`/chat/insert`, `/chat/delete`, `/chat/update-notification-email`), verify authentication.
   - **Identity Derivation:** Never trust `user_id` or `username` passed in `req.body` or `req.query` without verifying against the authenticated user's session token.
   - Do not log or echo tokens into server logs.

---

## 11. Validation & Error Handling

1. **Frontend Validation:**
   - Form validation should use `validate.js` matching patterns in [client/src/views/LogIn/LogIn.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/LogIn/LogIn.js).
   - Validate presence and lengths before dispatching API requests.
2. **Backend Validation:**
   - Validate presence of mandatory fields (`room_id`, `user_id`, `message`/`attachment`) at the start of route controllers.
   - Reject invalid payloads immediately with `{ err: true, msg: "Missing required fields", data: null }`.
3. **Frontend Optimistic UI:**
   - Chat interactions use optimistic local state updates (temporary ID `tmp-${Date.now()}`).
   - If API call succeeds, swap the temp ID for the server ID.
   - If API call fails, revert the optimistic entry and alert the user.

---

## 12. Security Guidelines

1. **Zero Secret Leaks:**
   - Never commit `.env` files.
   - Never echo `.env` or sensitive variables into terminal output or CI/CD workflow steps (do not run `cat .env`).
2. **File & Attachment Limits:**
   - Express has a 20MB payload limit for Base64 attachments.
   - When handling attachments, validate size and ensure client restricts image types to `image/*`.
3. **CORS:**
   - Keep dynamic origin validation restricted to `CLIENT_URL`, `SERVER_URL`, and `ALLOWED_ORIGINS`. Never allow wildcard `*` with credentials.

---

## 13. Logging & Debugging

- **Development:** Console logs (`console.log`, `console.error`) are permitted for development debugging.
- **Production Cleanliness:** Remove ad-hoc debug logs (`// console.log(...)`) before committing.
- **No Sensitive Data:** Never log JWTs, database passwords, SMTP credentials, or raw message payloads containing personal identifiable information (PII).

---

## 14. Testing Guidelines

1. **Current State:**
   - The repository currently lacks formal automated test suites (Create React App provides default `npm test` via Jest).
2. **Rules for Agents:**
   - If writing unit tests, place frontend tests alongside components (e.g. `ChatScreen.test.js`) using `@testing-library/react`.
   - If writing backend tests, use Jest or Mocha/Supertest targeting endpoints.
   - Always verify manual end-to-end functionality (login &rarr; join room &rarr; send message &rarr; receive real-time event &rarr; delete message).

---

## 15. Git Practices & Workflows

1. **Commit Messages:**
   - Keep commit messages concise, descriptive, and imperative (e.g., `fix: resolve cors whitelist issue`, `feat: add email notification settings`).
2. **Branching & Pull Requests:**
   - Work on feature branches. Never push untested code directly to `main`.
3. **CI/CD Triggers:**
   - Changes under `server/**` trigger Oracle Cloud Server deployment ([oci-deploy-server.yml](file:///w:/shubham/personal/Realtime-Chat-App/.github/workflows/oci-deploy-server.yml)).
   - Changes under `client/**` trigger Oracle Cloud Client deployment ([oci-deploy-client.yml](file:///w:/shubham/personal/Realtime-Chat-App/.github/workflows/oci-deploy-client.yml)).
   - Avoid touching both workspaces unnecessarily if a feature is strictly client-side or server-side.

---

## 16. Environment Variables Management

1. **Client Variables:**
   - Must be prefixed with `REACT_APP_` (Create React App requirement).
   - Document any new client variables in [client/.env.example](file:///w:/shubham/personal/Realtime-Chat-App/client/.env.example).
2. **Server Variables:**
   - Loaded via `dotenv.config()`.
   - Document any new server variables in [server/.env.example](file:///w:/shubham/personal/Realtime-Chat-App/server/.env.example).
3. **Default Fallbacks:**
   - Provide safe development fallbacks (e.g. `process.env.PORT || 5000`), but require strict presence for security keys in production.

---

## 17. Dependency Management

1. **Check Existing Dependencies First:**
   - Do NOT add a new npm package without verifying if an installed dependency or Node.js built-in already accomplishes the task.
   - *Example:* Node.js built-in `crypto` handles random bytes and AES ciphers. Do not install third-party crypto packages.
   - *Example:* `validate.js` is already in `client/package.json`. Do not install Yup or Zod unless requested.
2. **Unused / Legacy Packages:**
   - Be aware of unused packages (`chart.js`, `react-chartjs-2`, `moment`). Do not add new features depending on these legacy packages.

---

## 18. Refactoring & Backward Compatibility

1. **Conservative Scope:**
   - Refactor only what is strictly required to implement the requested feature.
   - Do not reformat entire legacy files or convert Class Components to Functional Components unless directly asked.
2. **Contract Preservation:**
   - Do NOT alter existing API endpoint URLs or response schemas (`{ err, msg, data }`).
   - Do NOT alter Socket.IO event payload formats. Other connected clients or mobile apps could depend on them.
3. **Database Field Compatibility:**
   - Never delete or rename database columns without a multi-phase migration strategy. Keep legacy fields nullable.

---

## 19. Existing Conventions vs. Recommended Improvements

| Area | Existing Codebase Convention | Recommended Practice for New Code |
| :--- | :--- | :--- |
| **Backend Auth** | Token sent in headers but ignored by Express routes | Implement/use JWT verification middleware on protected routes |
| **User Identity** | `user_id` passed in request body (`req.body.user_id`) | Derive user ID strictly from validated JWT claims (`req.user.id`) |
| **SQL Queries** | String interpolation with `mysql.escape()` | Parameterized queries with prepared statements (`?` placeholders) |
| **Error Handling** | Returns HTTP 200 with `{ err: true }` | Keep `{ err, msg, data }` format; use meaningful HTTP status codes where appropriate |
| **Attachments** | Full Base64 data strings stored directly in database | Accept Base64 in prototype, but recommend S3/object storage for scale |
| **Database Providers** | Handled via manual dual-adapter functions in `db/` | Retain dual-adapter consistency across every query change |
| **React Components** | Mix of Class components and Hooks | Use Hooks and Functional Components exclusively for all new code |
| **Dependencies** | Legacy leftover packages (`moment`, `chart.js`) | Avoid adding new dependencies; use native JS / installed tools |
