# Feature Inventory & Implementation Map

## 1. Feature Status Overview

| Feature | Status | Client Location | Server Location | Database Operations |
| :--- | :--- | :--- | :--- | :--- |
| **Username Login & Room Creation** | Active | [LogIn.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/LogIn/LogIn.js) | [routes/auth.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/auth.js) | `getUserByUsername`, `createUser` |
| **Join Existing Room (Invite Link)** | Active | [Routes.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/Routes.js), [LogIn.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/LogIn/LogIn.js) | [routes/auth.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/auth.js) | `getUserByUsername`, `getUserById` |
| **Real-time Room Chat** | Active | [ChatScreen.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/Chat/components/ChatScreen.js) | [server.js](file:///w:/shubham/personal/Realtime-Chat-App/server/server.js), [routes/chat.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/chat.js) | `createMessage` |
| **Message History Retrieval** | Active | [ChatScreen.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/Chat/components/ChatScreen.js) | [routes/chat.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/chat.js) | `getMessagesByRoomId` |
| **Image Attachments (Base64)** | Active | [ChatScreen.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/Chat/components/ChatScreen.js) | [routes/chat.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/chat.js) | `createMessage` (`attachment`) |
| **Message Deletion & Sync** | Active | [ChatScreen.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/Chat/components/ChatScreen.js) | [routes/chat.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/chat.js) | `deleteMessage` |
| **Typing Indicators** | Active | [ChatScreen.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/Chat/components/ChatScreen.js) | [server.js](file:///w:/shubham/personal/Realtime-Chat-App/server/server.js) | None (In-memory socket broadcast) |
| **Browser Web Notifications** | Active | [ChatScreen.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/Chat/components/ChatScreen.js) | None (Client-side HTML5 API) | None |
| **Email Message Alerts (SMTP)** | Active | [ChatScreen.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/Chat/components/ChatScreen.js) | [routes/chat.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/chat.js) | `updateUser` (`email`, flags) |
| **Share Link Copying** | Active | [ChatScreen.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/Chat/components/ChatScreen.js) | None (Clipboard API) | None |
| **Dual Database Switching** | Active | None (Transparent) | [db/index.js](file:///w:/shubham/personal/Realtime-Chat-App/server/db/index.js) | `mysql.js` or `mongo.js` |
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

### 2.4 Feature: Message Deletion & Sync
- **Description:** Users can right-click their own outgoing messages to trigger a context menu with a "Delete" action.
- **Client Implementation:** [client/src/views/Chat/components/ChatScreen.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/Chat/components/ChatScreen.js#L516-L566).
- **Server Implementation:** [server/routes/chat.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/chat.js#L154-L208).
- **Realtime Sync:** Server emits `message-deleted` with `{ messageId, roomName, user_id }`, which all clients in the room handle by filtering out the item from local `chatList` state.

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

### 2.6 Feature: Notifications (Browser Push & SMTP Email)
- **Description:** Dual alert mechanisms for incoming messages:
  1. **Browser Push:** When a message arrives from another user and the window is idle, native `new window.Notification(title, { body })` triggers a popup.
  2. **SMTP Email:** Users can enter an email address in the Notifications modal. When sending messages, `POST /chat/insert` invokes `sendEmailAlert` if `enableEmailAlert` is set.
- **Client Implementation:** [client/src/views/Chat/components/ChatScreen.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/Chat/components/ChatScreen.js#L292-L354, #L459-L485).
- **Server Implementation:** [server/routes/chat.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/chat.js#L10-L41, #L96-L126).
- **Dependencies:** HTML5 Notification API, Nodemailer.
