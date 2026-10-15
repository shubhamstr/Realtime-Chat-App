# Feature Inventory & Implementation Map

## 1. Feature Status Overview

| Feature | Status | Client Location | Server Location | Database Operations |
| :--- | :--- | :--- | :--- | :--- |
| **Username Login & Room Creation** | Active | [LogIn.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/LogIn/LogIn.js) | [routes/auth.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/auth.js) | `getUserByUsername`, `createUser` |
| **Saved Chats (LocalStorage with 30-Day Auto-Purge)** | Active | [chatStorage.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/utils/chatStorage.js), [LogIn.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/LogIn/LogIn.js) | None (Browser LocalStorage) | None |
| **Join Existing Room (Invite Link)** | Active | [Routes.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/Routes.js), [LogIn.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/LogIn/LogIn.js) | [routes/auth.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/auth.js) | `getUserByUsername`, `getUserById` |
| **Real-time Room Chat** | Active | [ChatScreen.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/Chat/components/ChatScreen.js) | [server.js](file:///w:/shubham/personal/Realtime-Chat-App/server/server.js), [routes/chat.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/chat.js) | `createMessage` |
| **Message History Retrieval** | Active | [ChatScreen.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/Chat/components/ChatScreen.js) | [routes/chat.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/chat.js) | `getMessagesByRoomId` |
| **Image Attachments (Base64)** | Active | [ChatScreen.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/Chat/components/ChatScreen.js) | [routes/chat.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/chat.js) | `createMessage` (`attachment`) |
| **Message & Room Deletion** | Removed | None | None | None |
| **Typing Indicators** | Active | [ChatScreen.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/Chat/components/ChatScreen.js) | [server.js](file:///w:/shubham/personal/Realtime-Chat-App/server/server.js) | None (In-memory socket broadcast) |
| **Real-time Online Presence Tracking** | Active | [ChatScreen.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/Chat/components/ChatScreen.js) | [server.js](file:///w:/shubham/personal/Realtime-Chat-App/server/server.js) | None (In-memory socket tracking) |
| **In-App Notification Counts** | Active | [ChatScreen.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/Chat/components/ChatScreen.js) | None (Tab title & header badge) | None |
| **Email Message Alerts (SMTP)** | Active | [ChatScreen.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/Chat/components/ChatScreen.js) | [routes/chat.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/chat.js) | `updateUser` (`email`, flags) |
| **Share Link Copying** | Active | [ChatScreen.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/Chat/components/ChatScreen.js) | None (Clipboard API) | None |
| **MongoDB Persistence & 30-Day TTL** | Active | None (Transparent) | [db/index.js](file:///w:/shubham/personal/Realtime-Chat-App/server/db/index.js) | `mongo.js` (TTL index) |
| **User Profile / Password Update**| Stubbed/Dead| [api/users.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/api/users.js) | [routes/users.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/users.js) | `updateUser` |
| **User Registration Endpoint** | Broken/Dead | [api/auth.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/api/auth.js) (`signUpApi`)| Missing on server | None |

---

## 2. Detailed Feature Descriptions & Dependencies

### 2.1 Feature: Username Login & Room Generation
- **Description:** Allows entry with just a username. If no room ID is present in the current URL, a new AES-encrypted URL-safe room token is minted.
- **Client Implementation:** [client/src/views/LogIn/LogIn.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/LogIn/LogIn.js#L103-L138).
- **Server Implementation:** [server/routes/auth.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/auth.js#L46-L92).
- **Flow:**
  1. User inputs `userName` in text field.
  2. Submits to `POST /auth/login` with `loginType: "userName"`.
  3. Server creates user record, generates encrypted token, and signs JWT.
  4. Client stores JWT in `localStorage.setItem('chatToken', ...)`, updates Redux, and redirects to `/chat/:chatURL`.
- **Dependencies:** Redux Toolkit `authSlice`, `jwt-decode`, `validate.js`.

---

### 2.2 Feature: Real-time Room Chat
- **Description:** Real-time bi-directional messaging between users joined in the same room.
- **Client Implementation:** [client/src/views/Chat/components/ChatScreen.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/Chat/components/ChatScreen.js#L396-L457).
- **Server Implementation:** [server/routes/chat.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/chat.js#L43-L94) and [server/server.js](file:///w:/shubham/personal/Realtime-Chat-App/server/server.js#L60-L67).
- **Socket Events:**
  - `joinRoom`: Fired on component mount when socket connects.
  - `room-message`: Broadcast by server when `POST /chat/insert` completes.
- **Dependencies:** `socket.io-client`, Express, Socket.IO.

---

### 2.3 Feature: Image Attachment Sharing
- **Description:** Users can attach an image file (< 2MB) alongside or in place of text messages.
- **Client Implementation:** [client/src/views/Chat/components/ChatScreen.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/Chat/components/ChatScreen.js#L487-L512).
- **Flow:**
  1. User clicks the attachment icon, triggering hidden file input (`accept="image/*"`).
  2. Validates image type and `size <= 2 * 1024 * 1024` bytes.
  3. `FileReader.readAsDataURL` transforms image into a base64 string preview.
  4. Sent as part of the `attachment` field in `POST /chat/insert`.
  5. Rendered via `<Message.CustomContent>` inside the `@chatscope` Message component.

---

### 2.4 Feature: Message Deletion & Sync (Removed)
- **Status:** Removed completely from client and backend to prevent message tampering and retain permanent room history.

---

### 2.5 Feature: Typing Indicators
- **Description:** Shows "User is typing..." in the room header when other participants type in the composer.
- **Client Implementation:** [client/src/views/Chat/components/ChatScreen.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/Chat/components/ChatScreen.js#L363-L394).
- **Server Implementation:** [server/server.js](file:///w:/shubham/personal/Realtime-Chat-App/server/server.js#L92-L106).
- **Flow:**
  - Typing in the input triggers `socket.emit('typing', { roomName, username })`.
  - Debounce timer (1200ms) automatically fires `socket.emit('stopTyping', ...)` when typing pauses.
  - Sending a message or clearing input immediately emits `stopTyping`.

---

### 2.6 Feature: In-App Notification Counts & Email Alerts
- **Description:** Non-intrusive notification mechanisms:
  1. **In-App Notification Count:** When new messages arrive while the window/tab is blurred or hidden, unread count is incremented. The browser tab header updates dynamically (`(N) Realtime Chat App`) and an in-app unread pill badge is displayed in the conversation header. Notification count resets immediately when the user focuses the window or reads the chat. Browser popups (`new Notification`) are completely eliminated.
  2. **SMTP Email:** Users can enter an email address in the Email Alerts modal. When sending messages, `POST /chat/insert` invokes `sendEmailAlert` if `enableEmailAlert` is set.
- **Client Implementation:** [client/src/views/Chat/components/ChatScreen.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/Chat/components/ChatScreen.js).
- **Server Implementation:** [server/routes/chat.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/chat.js).

---

### 2.7 Feature: Saved Chats LocalStorage & 30-Day Auto-Purge
- **Description:** All visited and created chats/chatbots are persisted in browser `localStorage` (`saved_chats`) with `roomId`, `title`, `username`, and `lastUsed` timestamps. Whenever the chat list is retrieved on login or startup, any chat unused for more than 30 days (1 month) is automatically purged from `localStorage`. The modern Login screen lists all saved chatbots and allows users to launch and open them directly with a single click. The user's nickname is remembered across sessions (`saved_username`) and auto-prefilled.
- **Client Implementation:** [client/src/utils/chatStorage.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/utils/chatStorage.js) and [client/src/views/LogIn/LogIn.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/LogIn/LogIn.js).
- **Database TTL:** MongoDB messages also feature a 30-day TTL index on `createdAt` (`expireAfterSeconds: 2592000`).

---

### 2.8 Feature: Real-time Online Presence Tracking
- **Description:** Server tracks active sockets per room in memory. When users join (`joinRoom`) or disconnect (`disconnect`), the server emits `room-users` to all participants in that room. Clients render active presence indicators (green `available` badge on Avatar, "Online (N active)" status text in header).
- **Client Implementation:** [client/src/views/Chat/components/ChatScreen.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/Chat/components/ChatScreen.js).
- **Server Implementation:** [server/server.js](file:///w:/shubham/personal/Realtime-Chat-App/server/server.js).

---

### 2.9 Feature: Message & Room Deletion (Removed)
- **Status:** Removed completely from client and backend. Chat history is preserved and deletion endpoints are eliminated.
