const mongoose = require("mongoose")

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/socket_chat"

mongoose
  .connect(mongoUri)
  .then(() => console.log("Connected to MongoDB!"))
  .catch((err) => {
    console.error("MongoDB connection error:", err)
    throw err
  })

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

const messageSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true },
    room_id: { type: String, required: true, index: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
)

const User = mongoose.models.User || mongoose.model("User", userSchema)
const Message = mongoose.models.Message || mongoose.model("Message", messageSchema)

const getUserByUsername = (username) => User.findOne({ username }).lean()
const getUserById = (id) => User.findById(id).lean()
const createUser = ({ username, chatURL }) => User.create({ username, chatURL })
const getAllUsers = () => User.find({}).lean()
const getUserByFilter = ({ userId, ignoreUserId }) => {
  if (userId) return User.findById(userId).lean().then((user) => (user ? [user] : []))
  if (ignoreUserId) return User.find({ _id: { $ne: ignoreUserId } }).lean()
  return getAllUsers()
}
const updateUser = (id, fields) => User.updateOne({ _id: id }, { $set: fields })
const createMessage = (payload) => Message.create(payload)
const getMessagesByRoomId = (roomId) => Message.find({ room_id: roomId }).lean()

module.exports = {
  getUserByUsername,
  getUserById,
  createUser,
  getAllUsers,
  getUserByFilter,
  updateUser,
  createMessage,
  getMessagesByRoomId,
}
