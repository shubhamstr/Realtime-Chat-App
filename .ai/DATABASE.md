# Database Architecture & Schemas

## 1. Overview & Provider Architecture

The database layer uses an adapter abstraction defined in [server/db/index.js](file:///w:/shubham/personal/Realtime-Chat-App/server/db/index.js). The active database provider is selected at runtime using the `DB_PROVIDER` environment variable:

- `DB_PROVIDER=mysql` &rarr; Loads [server/db/mysql.js](file:///w:/shubham/personal/Realtime-Chat-App/server/db/mysql.js) (default if unset).
- `DB_PROVIDER=mongo` &rarr; Loads [server/db/mongo.js](file:///w:/shubham/personal/Realtime-Chat-App/server/db/mongo.js).

Both adapters expose a standardized asynchronous JavaScript interface for user and chat message operations.

---

## 2. MySQL Database Schema

The relational schema is defined in [server/db/socket_chat.sql](file:///w:/shubham/personal/Realtime-Chat-App/server/db/socket_chat.sql). It contains two primary tables: `users` and `messages`.

### 2.1 Table: `users`

| Column | Type | Nullable | Default | Description / Usage |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT(11)` | NO | Auto Increment | Primary Key |
| `username` | `VARCHAR(100)` | NO | *None* | Unique user handle used to sign in |
| `password` | `VARCHAR(100)` | YES | `NULL` | Plain text password (unused in current login) |
| `image` | `VARCHAR(100)` | YES | `NULL` | Profile avatar URL / filename |
| `chatURL` | `TEXT` | NO | *None* | Assigned encrypted room URL token |
| `isAdmin` | `INT(11)` | NO | `0` | Administrator flag (1 = admin, 0 = user) |
| `email_notification_flag` | `TINYINT(4)` | NO | `0` | Email notification enabled flag (1/0) |
| `push_notification_flag` | `TINYINT(4)` | NO | `1` | Browser notification enabled flag (1/0) |
| `email_message_flag` | `TINYINT(4)` | NO | `0` | Legacy email message toggle |
| `push_message_flag` | `TINYINT(4)` | NO | `1` | Legacy push message toggle |
| `is_active` | `TINYINT(4)` | NO | `1` | Account status flag |
| `created_on` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Account creation timestamp |
| `updated_on` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Last updated timestamp |

- **Indexes:** Primary key on `id`.
- *Note:* In MySQL, the `username` column does not have a formal `UNIQUE` constraint at the database table level in [socket_chat.sql](file:///w:/shubham/personal/Realtime-Chat-App/server/db/socket_chat.sql), but uniqueness is enforced application-side in [server/routes/auth.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/auth.js#L53-L68).

### 2.2 Table: `messages`

| Column | Type | Nullable | Default | Description / Usage |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT(11)` | NO | Auto Increment | Primary Key |
| `user_id` | `INT(11)` | NO | *None* | Foreign user identifier |
| `room_id` | `TEXT` | NO | *None* | Room token / string identifier |
| `message` | `TEXT` | YES | `NULL` | Message content string |
| `attachment` | `TEXT` | YES | `NULL` | Base64 encoded image Data URL |
| `read_flag` | `TINYINT(4)` | NO | `0` | Read receipt flag (unused in current UI) |
| `is_deleted` | `TINYINT(4)` | NO | `0` | Soft delete flag (unused: code performs hard `DELETE`) |
| `created_on` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Message creation timestamp |
| `updated_on` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Message update timestamp |

- **Indexes:** Primary key on `id`. No composite index exists on `room_id`.

---

## 3. MongoDB Schemas (Mongoose)

Defined in [server/db/mongo.js](file:///w:/shubham/personal/Realtime-Chat-App/server/db/mongo.js).

### 3.1 Model: `User` (Collection: `users`)
```javascript
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    chatURL: { type: String, default: "" },
    email_notification_flag: { type: Number, default: 1 },
    push_notification_flag: { type: Number, default: 1 },
    email_message_flag: { type: Number, default: 1 },
    push_message_flag: { type: Number, default: 1 },
    email: { type: String, default: "" },
    password: { type: String, default: "" },
  },
  { timestamps: true }
)
```
- **Indexes:** Automatic `_id` index; unique index on `username`.
- **Differences from SQL:** Notice that in MongoDB defaults for `email_notification_flag` and `email_message_flag` are `1`, whereas in MySQL defaults are `0`. Also, the `email` field is explicitly defined in Mongoose schema, whereas in MySQL `socket_chat.sql` the `email` column was omitted from the original table definition.

### 3.2 Model: `Message` (Collection: `messages`)
```javascript
const messageSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true },
    room_id: { type: String, required: true, index: true },
    message: { type: String, default: "" },
    attachment: { type: String, default: "" },
  },
  { timestamps: true }
)
```
- **Indexes:** Automatic `_id` index; explicit index on `room_id`.

---

## 4. Query Contract & Adapter Methods

The table below summarizes how each operation is implemented across providers:

| Method | MySQL Implementation ([mysql.js](file:///w:/shubham/personal/Realtime-Chat-App/server/db/mysql.js)) | MongoDB Implementation ([mongo.js](file:///w:/shubham/personal/Realtime-Chat-App/server/db/mongo.js)) |
| :--- | :--- | :--- |
| `getUserByUsername` | `SELECT * FROM users WHERE username = ${mysql.escape(username)}` | `User.findOne({ username }).lean()` |
| `getUserById` | `SELECT * FROM users WHERE id = ${mysql.escape(id)}` | `User.findById(id).lean()` |
| `createUser` | `INSERT INTO users (username, chatURL) VALUES (...)` &rarr; returns `{ id: result.insertId }` | `User.create({ username, chatURL })` &rarr; returns created Document |
| `getAllUsers` | `SELECT * FROM users` | `User.find({}).lean()` |
| `getUserByFilter` | `SELECT * FROM users WHERE id=...` or `WHERE id!=...` | `User.findById(...)` or `User.find({ _id: { $ne: ignoreUserId } }).lean()` |
| `updateUser` | Dynamically constructed `UPDATE users SET field = ... WHERE id = ...` | `User.updateOne({ _id: id }, { $set: fields })` |
| `createMessage` | `INSERT INTO messages (user_id, room_id, message, attachment) VALUES (...)` &rarr; `{ id: insertId }` | `Message.create(payload)` &rarr; returns created Document |
| `getMessagesByRoomId`| `SELECT * FROM messages WHERE room_id = ${mysql.escape(roomId)}` | `Message.find({ room_id: roomId }).lean()` |
| `deleteMessage` | `DELETE FROM messages WHERE id = ... AND user_id = ... AND room_id = ...` &rarr; `{ affectedRows }` | `Message.deleteOne(filter)` &rarr; returns `{ deletedCount }` |

---

## 5. Architectural Discrepancies & Technical Debt

1. **Identifier Type Mismatch (`id` vs `_id`):**
   - MySQL records use numeric auto-increment IDs (`id: 42`).
   - MongoDB documents use 24-character hexadecimal ObjectId strings (`_id: ObjectId("...")`).
   - The frontend contains defensive fallback code across components to accommodate this discrepancy (e.g. `chat.id || chat._id`, `userDetails.id || userDetails._id`).
2. **Missing `email` Column in `socket_chat.sql`:**
   - In [server/routes/users.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/users.js#L52) and [server/routes/chat.js](file:///w:/shubham/personal/Realtime-Chat-App/server/routes/chat.js#L108), the code updates `email`. However, the dumped SQL schema in [server/db/socket_chat.sql](file:///w:/shubham/personal/Realtime-Chat-App/server/db/socket_chat.sql) does NOT include an `email` column in the `users` table! Executing `updateUser` against this schema will trigger an `Unknown column 'email'` SQL error.
3. **Hard Deletion vs Soft Deletion:**
   - The MySQL schema defines an `is_deleted` column. However, [server/db/mysql.js](file:///w:/shubham/personal/Realtime-Chat-App/server/db/mysql.js#L86) executes a hard SQL `DELETE FROM messages`, ignoring the soft delete schema design.
4. **Base64 Payload Storage in Database:**
   - Image attachments are stored directly as raw Base64 data strings inside the `attachment` column/field. For large images (up to 2MB encoded into ~2.7MB of Base64 text), this causes database bloat and performance degradation on bulk message retrieval.
