# Coding Standards & Conventions

## 1. Project Organization & Directory Layout

The workspace is organized into a client-server structure:

```
Realtime-Chat-App/
├── client/                     # Frontend React application
│   ├── public/                 # Static assets and index.html
│   └── src/
│       ├── api/                # API communication clients (Axios services)
│       ├── assets/             # Global CSS and images
│       ├── components/         # Reusable structural components (Route wrappers)
│       ├── layouts/            # Page shell layouts (Minimal)
│       ├── store/              # Redux Toolkit store and slices (authSlice.js)
│       ├── views/              # Page view components (LogIn, Chat)
│       ├── App.js              # Theme provider & root session coordinator
│       └── Routes.js           # Route declarations and layout mappings
├── server/                     # Backend Node.js / Express application
│   ├── db/                     # Database adapters (index.js, mysql.js, mongo.js)
│   ├── routes/                 # Express route handlers (auth.js, chat.js, users.js)
│   └── server.js               # Express app bootstrap, CORS, and Socket.IO
├── .github/workflows/          # Deployment and CI/CD automation
└── README.md                   # Project documentation
```

---

## 2. Language & Module Standards

- **Server-Side:**
  - CommonJS module system (`require(...)`, `module.exports = ...`).
  - Asynchronous functions use native `async / await` or Promises (`.then().catch()`).
  - Node.js built-in APIs (`crypto`, `http`, `path`).
- **Client-Side:**
  - ES6 Module syntax (`import ... from '...'`, `export default ...`).
  - JSX syntax for React components.
  - Mix of Class Components (e.g. [client/src/App.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/App.js)) and Functional Components with React Hooks (e.g. [client/src/views/Chat/components/ChatScreen.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/Chat/components/ChatScreen.js)).

---

## 3. Formatting & Linting Rules

### 3.1 Prettier Rules ([client/.prettierrc](file:///w:/shubham/personal/Realtime-Chat-App/client/.prettierrc))
- Single quotes: `true` (`'string'`)
- Print width: `80`
- Tab width: `2` spaces (no hard tabs)
- Trailing commas: `'none'`
- Bracket spacing: `true` (`{ foo: bar }`)
- JSX bracket same line: `true`

### 3.2 ESLint Rules ([client/.eslintrc](file:///w:/shubham/personal/Realtime-Chat-App/client/.eslintrc))
- Indentation: `2` spaces with `SwitchCase: 1`
- Semicolons: `semi: 0` (optional/disabled, though semicolons are largely present in codebase)
- Console logging: `"no-console": "off"`
- Prop-types: `"react/prop-types": 1` (Component prop-types are declared using `prop-types`)
- JSX Quotes: Single quotes or default (`jsx-quotes: 1`)

---

## 4. Naming Conventions

| Category | Convention | Examples |
| :--- | :--- | :--- |
| **Component Files** | PascalCase | `ChatScreen.js`, `LogIn.js`, `RouteWithLayout.js` |
| **Utility & Config Files** | camelCase / kebab-case | `api-client.js`, `authSlice.js`, `server.js` |
| **Component Names** | PascalCase | `ChatScreen`, `MinimalLayout`, `PrivateRouteWithLayout` |
| **React Hooks / State** | camelCase with `get/set/handle` prefixes | `chatList`, `setChatList`, `handleSend`, `handleMsg` |
| **API Service Functions** | camelCase with `Api` or `API` suffix | `signInApi`, `sendMessageAPI`, `getAllChatAPI`, `deleteChatAPI` |
| **Database Models** | PascalCase | `User`, `Message` |
| **Database Fields (SQL)** | snake_case | `user_id`, `room_id`, `created_on`, `email_notification_flag` |
| **Database Fields (Mongo)**| snake_case (matching SQL convention) | `user_id`, `room_id`, `email_notification_flag` |
| **Socket Events** | camelCase or kebab-case | `joinRoom`, `room-message`, `message-deleted`, `stopTyping` |

---

## 5. Component & UI Architecture Patterns

### 5.1 Component Layout Wrappers
Views are wrapped using Higher-Order / Layout wrappers:
- [RouteWithLayout](file:///w:/shubham/personal/Realtime-Chat-App/client/src/components/RouteWithLayout/RouteWithLayout.js): Standard route wrapped in a layout container (such as `MinimalLayout`).
- [PrivateRouteWithLayout](file:///w:/shubham/personal/Realtime-Chat-App/client/src/components/PrivateRouteWithLayout/PrivateRouteWithLayout.js): Authenticated route that checks `auth.isLoggedIn` and redirects unauthenticated visitors to `/login` or `/login/:url`.

### 5.2 Material-UI Theming & Styling
- Styles are defined using the `makeStyles` Hook from `@material-ui/styles`.
- Colors and typography leverage theme tokens or modern Slate/Blue hex codes (`#2563eb`, `#0f172a`, `#64748b`, `#f8fafc`).
- Components use Backdrop / Modal patterns with inline overlay click handlers.

### 5.3 Redux State Slice Pattern
- Auth state is defined using Redux Toolkit `createSlice` in [client/src/store/authSlice.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/store/authSlice.js).
- State mutations are encapsulated inside standard reducers: `logIn`, `logOut`, and `setDetails` (which uses a generic `{ type, value }` payload pattern).

---

## 6. Error Handling & Response Patterns

### 6.1 Backend Error Handling Pattern
The backend wraps all endpoints in `.then().catch()` or `try / catch`, returning uniform JSON payloads:
```javascript
// Success
return res.send({
  err: false,
  msg: "Operation successful",
  data: result
});

// Error
return res.send({
  err: true,
  msg: err.sqlMessage || err.message || "Server Error",
  data: err
});
```

### 6.2 Frontend Optimistic UI Pattern
For high-responsiveness, chat messages are appended to local state immediately before the HTTP request completes:
1. Append an optimistic message with a temporary ID (`tmp-${Date.now()}`).
2. Dispatch `sendMessageAPI(...)`.
3. If successful, replace the optimistic message entry with the real server-returned ID.
4. If failed, remove the optimistic message from `chatList` and trigger an alert (`alert(res.msg)`).
