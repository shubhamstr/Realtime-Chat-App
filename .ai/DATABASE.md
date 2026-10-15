# Database Architecture & Schemas

## 1. Overview & Architecture

The application uses **MongoDB** via **Mongoose** as its sole database for data persistence. The database layer is defined in [server/db/mongo.js](file:///w:/shubham/personal/Realtime-Chat-App/server/db/mongo.js) and exported via [server/db/index.js](file:///w:/shubham/personal/Realtime-Chat-App/server/db/index.js).

The database connection is established at server startup using `process.env.MONGO_URI` (defaulting to `mongodb://127.0.0.1:27017/socket_chat`).

---

## 2. MongoDB Schemas (Mongoose)

Defined in [server/db/mongo.js](file:///w:/shubham/personal/Realtime-Chat-App/server/db/mongo.js).

### 2.1 Model: `User` (Collection: `users`)
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
- **Default Flags:** Email and push notification flags default to `1` (enabled).

### 2.2 Model: `Message` (Collection: `messages`)
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

## 3. Query Contract & Database Methods

The database layer provides standardized asynchronous methods:

| Method | MongoDB Implementation ([mongo.js](file:///w:/shubham/personal/Realtime-Chat-App/server/db/mongo.js)) | Return Value |
| :--- | :--- | :--- |
| `getUserByUsername` | `User.findOne({ username }).lean()` | User document or `null` |
| `getUserById` | `User.findById(id).lean()` | User document or `null` |
| `createUser` | `User.create({ username, chatURL })` | Created User document |
| `getAllUsers` | `User.find({}).lean()` | Array of User documents |
| `getUserByFilter` | `User.findById(...)` or `User.find({ _id: { $ne: ignoreUserId } }).lean()` | Array of User documents |
| `updateUser` | `User.updateOne({ _id: id }, { $set: fields })` | Mongoose update result (`acknowledged`, `modifiedCount`) |
| `createMessage` | `Message.create(payload)` | Created Message document |
| `getMessagesByRoomId`| `Message.find({ room_id: roomId }).lean()` | Array of Message documents |
| `deleteMessage` | `Message.deleteOne(filter)` | Object with `{ deletedCount }` (or `{ deletedCount: 0, invalidId: true }` if ObjectId is invalid) |
| `updateMessage` | `Message.updateOne({ _id: id }, { $set: fields })` | Mongoose update result |

---

## 4. Architectural Notes

1. **Identifiers (`_id`):**
   - MongoDB documents use 24-character hexadecimal ObjectId strings (`_id`).
   - The frontend accepts both `_id` and `id` defensively (e.g. `item._id || item.id`).
2. **Base64 Payload Storage:**
   - Image attachments are stored directly as Base64 data strings in the `attachment` field (up to 20MB express JSON limit).
