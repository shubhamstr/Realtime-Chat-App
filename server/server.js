const express = require("express")
const app = express()
const http = require("http").createServer(app)
const cors = require("cors")

require("dotenv").config()

const users = require("./routes/users")
const auth = require("./routes/auth")
const chat = require("./routes/chat")

const PORT = process.env.PORT || 5000
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000"
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`

const normalizeOrigin = (url) => String(url || "").trim().replace(/\/$/, "")

const allowedOrigins = new Set(
  [
    CLIENT_URL,
    SERVER_URL,
    ...(process.env.ALLOWED_ORIGINS || "").split(","),
  ]
    .map(normalizeOrigin)
    .filter(Boolean)
)

app.use(express.static(__dirname + "/public"))
app.use(express.json({ limit: "20mb" }))
app.use(cors({
  origin: Array.from(allowedOrigins),
  credentials: true,
}))

const io = require("socket.io")(http, {
  cors: {
    origin: Array.from(allowedOrigins),
    methods: ["GET", "POST"],
    credentials: false,
  },
})

app.get("/", (req, res) => {
  res.send("server is running on " + PORT)
})

app.get("/html", (req, res) => {
  res.sendFile(__dirname + "/index.html")
})

app.use("/users", users)
app.use("/auth", auth)
app.use("/chat", chat)
app.set("io", io)

// socket io presence tracking
const roomUsers = new Map()

const broadcastRoomUsers = (roomName) => {
  if (!roomName) return
  const usersMap = roomUsers.get(roomName)
  const usersList = usersMap ? Array.from(usersMap.values()) : []
  io.to(roomName).emit("room-users", {
    roomName,
    users: usersList,
    count: usersList.length,
  })
}

io.on("connection", (socket) => {
  console.log("connected..", socket.id)

  socket.on("joinRoom", (obj) => {
    if (!obj || !obj.roomName) return
    const roomName = obj.roomName
    const username = obj.username || "Guest"
    const userId = obj.userId || ""

    socket.join(roomName)
    socket.data.roomName = roomName
    socket.data.username = username
    socket.data.userId = userId

    if (!roomUsers.has(roomName)) {
      roomUsers.set(roomName, new Map())
    }
    roomUsers.get(roomName).set(socket.id, { username, userId, socketId: socket.id })

    socket.broadcast.emit("roomJoined", username)
    broadcastRoomUsers(roomName)
  })

  socket.on("getRoomUsers", (roomName) => {
    broadcastRoomUsers(roomName || socket.data.roomName)
  })

  socket.on("leaveRoom", (roomName) => {
    const targetRoom = roomName || socket.data.roomName
    if (targetRoom && roomUsers.has(targetRoom)) {
      roomUsers.get(targetRoom).delete(socket.id)
      if (roomUsers.get(targetRoom).size === 0) {
        roomUsers.delete(targetRoom)
      }
      socket.leave(targetRoom)
      broadcastRoomUsers(targetRoom)
    }
  })

  socket.on("connected", (username) => {
    console.log("socket connected", username)
    socket.broadcast.emit("connected", username)
  })

  socket.on("message", (msg) => {
    console.log("socket message", msg)
    if (socket.data.roomName) {
      socket.to(socket.data.roomName).emit("room-message", {
        roomName: socket.data.roomName,
        username: msg?.username || "Someone",
        message: msg?.message || "",
      })
      return
    }

    socket.broadcast.emit("room-message", {
      roomName: socket.data.roomName || "",
      username: msg?.username || "Someone",
      message: msg?.message || "",
    })
  })

  socket.on("typing", (data) => {
    if (!socket.data.roomName) {
      return
    }

    socket.to(socket.data.roomName).emit("typing", data)
  })

  socket.on("stopTyping", (data) => {
    if (!socket.data.roomName) {
      return
    }

    socket.to(socket.data.roomName).emit("stopTyping", data)
  })

  socket.on("disconnect", () => {
    const roomName = socket.data.roomName
    if (roomName && roomUsers.has(roomName)) {
      const roomMap = roomUsers.get(roomName)
      roomMap.delete(socket.id)
      if (roomMap.size === 0) {
        roomUsers.delete(roomName)
      }
      broadcastRoomUsers(roomName)
    }
  })
})

// listen on port
http.listen(PORT, () => {
  console.log(`listening on ${PORT}`)
})
