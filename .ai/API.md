# API Specification & Communication Protocols

## 1. Protocol Architecture & Conventions

The backend combines **HTTP REST endpoints** (Express) for persistence and query operations with **WebSocket events** (Socket.IO) for real-time broadcasts.

### 1.1 Base URL & Environment Configuration
- **Server Port:** `5000` (default, configurable via `PORT`).
- **Client Base URL:** Defined via `REACT_APP_API_URL` in [client/.env](file:///w:/shubham/personal/Realtime-Chat-App/client/.env).
- **CORS Allowed Origins:** Handled in [server/server.js](file:///w:/shubham/personal/Realtime-Chat-App/server/server.js#L18-L33) using `CLIENT_URL`, `SERVER_URL`, and comma-separated `ALLOWED_ORIGINS`.

### 1.2 Standard HTTP Response Format
All REST endpoints adhere to a unified response wrapper:
```json
{
  "err": false,
  "msg": "Action description / status message",
  "data": {}
}
```
*Note on Error Status Codes:* The backend returns an HTTP `200 OK` status for most application errors, conveying the failure inside the JSON body via `"err": true` and a human-readable `"msg"`.

---

## 2. REST Endpoints

### 2.1 Authentication (`/auth`)
Defined in [server/routes/auth.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/auth.js).

#### `POST /auth/login`
Logs in an existing user or creates a new user with a generated room URL token.

- **Authentication:** None.
- **Request Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "loginType": "userName",
    "userName": "johndoe",
    "room_id": "optional-room-id-if-joining-invite-link"
  }
  ```
- **Behavior:**
  - If `loginType !== "userName"`: Returns `{ err: true, msg: "Unsupported login type" }`.
  - If `room_id` is omitted and username already exists: Returns `{ err: true, msg: "Userame already exists" }`.
  - If `room_id` is omitted and username is new: Generates an AES-256 URL-safe token, creates user in DB, and issues JWT.
  - If `room_id` is supplied and username exists: Reuses existing user record, sets room to supplied `room_id`, and issues JWT.
- **Success Response (HTTP 200):**
  ```json
  {
    "err": false,
    "msg": "User Logged In Successfully!!",
    "data": "<jwt_token_string>",
    "chatURL": "yzqfLr-G8KSZnjRp9siHCn3asWXtgqexrKmdXABdp6Q"
  }
  ```

---

### 2.2 Chat Messaging (`/chat`)
Defined in [server/routes/chat.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/chat.js).

#### `POST /chat/insert`
Persists a message in the database, sends optional SMTP email alerts, and broadcasts the message to the room via Socket.IO.

- **Authentication:** Unauthenticated (Authorization header not checked).
- **Request Body:**
  ```json
  {
    "user_id": "58",
    "room_id": "yzqfLr-G8KSZnjRp9siHCn3asWXtgqexrKmdXABdp6Q",
    "message": "Hello everyone!",
    "attachment": "data:image/png;base64,iVBORw0KGgo...",
    "username": "johndoe",
    "emailAlertTo": "user@example.com",
    "enableEmailAlert": 1
  }
  ```
- **Success Response (HTTP 200):**
  ```json
  {
    "err": false,
    "msg": "Message Sent Successfully!!",
    "data": {
      "id": 43,
      "user_id": "58",
      "room_id": "yzqfLr-G8KSZnjRp9siHCn3asWXtgqexrKmdXABdp6Q",
      "message": "Hello everyone!",
      "attachment": "data:image/png;base64,..."
    }
  }
  ```
- **Real-time Side Effect:** Emits `room-message` to Socket.IO room `payload.room_id`.

#### `GET /chat/get-all`
Fetches all persistent chat messages for a specific room.

- **Authentication:** Unauthenticated.
- **Query Parameters:** `room_id` (string, required).
- **Success Response (HTTP 200):**
  ```json
  {
    "err": false,
    "msg": "Chat Fetched Successfully!!",
    "data": [
      {
        "id": 41,
        "user_id": 58,
        "room_id": "yzqfLr-G8KSZnjRp9siHCn3asWXtgqexrKmdXABdp6Q",
        "message": "hello, is anyone there?",
        "attachment": null,
        "created_on": "2025-05-17T08:04:03.000Z"
      }
    ]
  }
  ```

#### `DELETE /chat/delete`
Deletes a message from the database and broadcasts deletion event to room members.

- **Authentication:** Unauthenticated.
- **Request Body:**
  ```json
  {
    "id": "41",
    "user_id": "58",
    "room_id": "yzqfLr-G8KSZnjRp9siHCn3asWXtgqexrKmdXABdp6Q"
  }
  ```
- **Success Response (HTTP 200):**
  ```json
  {
    "err": false,
    "msg": "Message deleted successfully",
    "data": { "affectedRows": 1 }
  }
  ```
- **Real-time Side Effect:** Emits `message-deleted` to Socket.IO room `room_id`.

#### `DELETE /chat/delete-room`
Deletes all persistent messages for a specific room and broadcasts the `room-cleared` event to connected room members.

- **Authentication:** Unauthenticated.
- **Request Body or Query:**
  ```json
  {
    "room_id": "yzqfLr-G8KSZnjRp9siHCn3asWXtgqexrKmdXABdp6Q"
  }
  ```
- **Success Response (HTTP 200):**
  ```json
  {
    "err": false,
    "msg": "Chat room deleted successfully",
    "data": { "deletedCount": 14 }
  }
  ```
- **Real-time Side Effect:** Emits `room-cleared` with `{ roomName: room_id }` to Socket.IO room `room_id`.

#### `POST /chat/update-notification-email`
Updates notification settings and email address for a user.

- **Request Body:**
  ```json
  {
    "id": "58",
    "email": "user@example.com",
    "email_notification_flag": 1,
    "push_notification_flag": 1
  }
  ```
- **Success Response (HTTP 200):**
  ```json
  {
    "err": false,
    "msg": "Notification settings updated successfully",
    "data": {}
  }
  ```

---

### 2.3 User Management (`/users`)
Defined in [server/routes/users.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/users.js).

#### `GET /users/get-all`
Fetches users by ID filter. Used on client startup in [client/src/views/Chat/Chat.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/views/Chat/Chat.js#L26-L42).

- **Query Parameters:**
  - `userId` (optional): Filter for a specific user ID.
  - `ignoreUserId` (optional): Filter to exclude a specific user ID.
- **Success Response (HTTP 200):**
  ```json
  {
    "err": false,
    "msg": "Users Fetched Successfully!!",
    "data": [
      {
        "id": 58,
        "username": "user1",
        "chatURL": "yzqfLr-G8KSZnjRp9siHCn3asWXtgqexrKmdXABdp6Q",
        "email_notification_flag": 0,
        "push_notification_flag": 1
      }
    ]
  }
  ```

#### Secondary User Endpoints
- `POST /users/update-notification` &rarr; Updates notification flags.
- `POST /users/update-personal` &rarr; Updates username and email.
- `POST /users/update-password` &rarr; Updates plain-text password.
*(Note: These 3 endpoints are implemented in the server but not wired into any active UI screen in the client).*

---

## 3. Real-Time Socket.IO Protocol

Socket handlers are implemented in [server/server.js](file:///w:/shubham/personal/Realtime-Chat-App/server/server.js#L57-L107).

### 3.1 Client-to-Server Events

| Event Name | Payload | Handler Action |
| :--- | :--- | :--- |
| `joinRoom` | `{ roomName: string, username: string, userId?: string }` | Executes `socket.join(roomName)`, tracks socket in `roomUsers`, emits `roomJoined` and updated `room-users` presence to the room. |
| `leaveRoom` | `roomName: string` | Removes socket from `roomUsers`, calls `socket.leave(roomName)`, and broadcasts updated `room-users`. |
| `getRoomUsers` | `roomName: string` | Broadcasts current active user presence list for `roomName`. |
| `connected` | `username: string` | Broadcasts `connected` with the username to all clients. |
| `message` | `{ username: string, message: string }` | Broadcasts `room-message` to the socket's joined room or across all clients if unassigned. |
| `typing` | `{ roomName: string, username: string }` | Emits `typing` event to all other clients in `roomName`. |
| `stopTyping` | `{ roomName: string, username: string }` | Emits `stopTyping` event to all other clients in `roomName`. |
| `disconnect` | None | Automatically purges socket from active room user map and broadcasts updated `room-users`. |

### 3.2 Server-to-Client Events

| Event Name | Source | Payload | Description |
| :--- | :--- | :--- | :--- |
| `roomJoined` | Server (`joinRoom` handler) | `username: string` | Notifies room members that a new user entered. |
| `room-users` | Server (presence tracker) | `{ roomName: string, users: Array, count: number }` | Real-time presence payload containing active users in the room. |
| `connected` | Server (`connected` handler) | `username: string` | Broadcasts user connection. |
| `room-message` | REST controller `POST /chat/insert` | `{ roomName, username, message, attachment, messageId }` | Live message delivered to all connected room members. |
| `message-deleted` | REST controller `DELETE /chat/delete` | `{ messageId, roomName, user_id }` | Signals client to remove deleted message from local state. |
| `room-cleared` | REST controller `DELETE /chat/delete-room` | `{ roomName }` | Signals client to wipe message list for the cleared room. |
| `typing` | Server (`typing` handler) | `{ roomName, username }` | Triggers "User is typing..." UI state. |
| `stopTyping` | Server (`stopTyping` handler) | `{ roomName, username }` | Clears typing indicator UI state. |

---

## 4. Known Discrepancies & Dead Endpoints

1. **Dead `POST /auth/register`:**
   - In [client/src/api/auth.js](file:///w:/shubham/personal/Realtime-Chat-App/client/src/api/auth.js#L3-L5), `signUpApi` calls `POST /auth/register`. The backend has no such route; only `/auth/login` exists.
2. **Missing Token Validation Middleware:**
   - Client sends `Authorization` headers via Axios interceptor, but the Express server does not validate the JWT token on any endpoint.
3. **HTTP 200 on Failures:**
   - Endpoints catch errors and return HTTP 200 with `{ err: true, msg: "Server Error (...)" }`. Standard REST status codes (e.g., 400, 401, 404, 500) are not employed.
