# Technology Stack

## 1. Overview & Technology Matrix

| Layer | Technology | Version | Purpose in Codebase |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | `^16.8.6` | Component-based UI library (hooks and class components) |
| **Frontend DOM** | React DOM | `^16.8.6` | DOM rendering layer for React |
| **Frontend Bundler / Build** | Create React App (`react-scripts`) | `^5.0.1` | Build tooling, webpack packaging, and dev server |
| **Frontend Routing** | React Router DOM | `^5.0.1` | Client-side routing with layout wrappers (`Switch`, `Route`, `Redirect`) |
| **History Library** | history | `^4.9.0` | Browser history management for React Router v5 |
| **UI Component Library** | Material-UI (v4) Core | `^4.12.4` | Layout components, inputs, buttons, theme provider |
| **UI Icons** | Material-UI Icons | `^4.11.3` | Material icons (partially commented in favor of chatscope icons) |
| **UI Styling** | `@material-ui/styles` | `^4.11.5` | JSS styling via `makeStyles` |
| **Chat Component Kit** | `@chatscope/chat-ui-kit-react` | `^2.0.3` | Out-of-the-box conversation header, message bubble, composer, avatar |
| **Chat Component Styles** | `@chatscope/chat-ui-kit-styles` | `^1.4.0` | Default theme stylesheet for Chatscope UI kit |
| **Global State Management** | Redux Toolkit | `^2.2.3` | Simplified Redux state management using `createSlice` |
| **Redux React Binding** | React Redux | `^8.1.3` | React hooks (`useSelector`, `useDispatch`) and `connect` HOC |
| **HTTP Client** | Axios | `^1.7.2` | REST API communication with backend |
| **Token Decoder** | jwt-decode | `^4.0.0` | Client-side parsing of JWT claims (userId, time) |
| **Validation** | validate.js | `^0.13.1` | Form validation schema for Login input |
| **Realtime Client** | socket.io-client | `^4.7.5` | WebSocket client for duplex room messaging and typing events |
| **CSS Preprocessor** | Sass | `^1.75.0` | SCSS compilation support in build toolchain |
| **Backend Runtime** | Node.js | `>=18` (Docker: `18-alpine`) | Server-side JavaScript runtime |
| **Backend Framework** | Express | `^4.18.1` | HTTP web server, routing, and JSON middleware |
| **Realtime Server** | Socket.IO | `^4.5.1` | WebSocket server managing rooms and broadcasting messages |
| **Authentication Token** | jsonwebtoken | `^9.0.2` | Generates HS256-signed JWTs upon user login |
| **Cryptography** | Node.js `crypto` (built-in) | Native | AES-256-CBC cipher generation for room tokens |
| **CORS Middleware** | cors | `^2.8.5` | Cross-origin resource sharing configuration |
| **Config / Environment** | dotenv | `^16.4.5` | Loading environment variables from `.env` files |
| **Email Transport** | nodemailer | `^6.9.15` | SMTP email dispatch for chat notifications |
| **Document Database** | MongoDB (Driver: `mongoose`) | `^8.23.1` (DB: Mongo `7.0`) | NoSQL storage engine for users and messages |
| **Containerization** | Docker & Docker Compose | Compose `v3.9` | Containerization for client, server, and MongoDB |
| **Web Server / Reverse Proxy**| Nginx (Alpine) | `nginx:alpine` | Production static asset server and SPA routing for client |
| **CI / CD** | GitHub Actions | `v4` / `v5` actions | Automated building, container pushing to Amazon ECR, and EC2 SSH deployment |

---

## 2. Rationale & Analysis of Key Selections

### 2.1 Backend Runtime & Libraries
- **Node.js + Express:** Standard minimalist JavaScript backend suitable for JSON APIs and fast asynchronous I/O.
- **Socket.IO:** Simplifies room-based multiplexing with automatic fallback, reconnection handling, and room isolation (`socket.join(roomName)`).
- **Mongoose / MongoDB:** Modern cloud document database with high performance, indexing, and flexible schema handling for realtime messaging.
- **Nodemailer:** Simple zero-dependency SMTP client for dispatching optional asynchronous message notifications to recipient email addresses.

### 2.2 Frontend Framework & UI
- **React 16.8.6:** Provides foundational Hook support (`useState`, `useEffect`, `useRef`).
- **Material-UI v4 (`@material-ui/core`):** Used for theming (`createMuiTheme`), login screen layout, modals, menus, and typography.
- **`@chatscope/chat-ui-kit-react`:** Provides pre-built chat components (`ChatContainer`, `MessageList`, `Message`, `MessageInput`, `Avatar`), avoiding the need to build a complex virtualized chat UI from scratch.
- **Redux Toolkit:** Centralizes session data (`isLoggedIn`, `userDetails`, `tokenDetails`) across routes.

---

## 3. Legacy, Unused & Deprecated Dependencies

The frontend [client/package.json](file:///w:/shubham/personal/Realtime-Chat-App/client/package.json) retains several dependencies inherited from the upstream Devias Material Dashboard template that are currently not utilized in the active application code:

1. **`chart.js` (`^2.8.0`) & `react-chartjs-2` (`^2.7.6`):**
   - *Status:* Unused.
   - *Reason:* Leftover from dashboard analytics views removed during chat app customization.
2. **`moment` (`^2.24.0`):**
   - *Status:* Unused. Active code relies on `new Date().toISOString()` or native timestamps.
3. **`clsx` (`^1.0.4`):**
   - *Status:* Unused in active views.
4. **`crypto` in [server/package.json](file:///w:/shubham/personal/Realtime-Chat-App/server/package.json) (`^1.0.1`):**
   - *Status:* Deprecated / Redundant.
   - *Reason:* Node.js has a built-in `crypto` module. The `crypto` npm package is a deprecated stub.
