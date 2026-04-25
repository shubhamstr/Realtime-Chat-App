const express = require("express")
const app = express()
const http = require("http").createServer(app)
const cors = require("cors")

require("dotenv").config()

const users = require("./routes/users")
const auth = require("./routes/auth")
const chat = require("./routes/chat")

const PORT = process.env.PORT || 5000
const CLIENT_URL = process.env.CLIENT_URL || process.env.REACT_APP_CLIENT_URL || "http://localhost:3000"
const allowedOrigins = new Set([
  CLIENT_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
])

app.use(express.static(__dirname + "/public"))
app.use(express.json({ limit: "20mb" }))
app.use(cors({
  origin: CLIENT_URL,
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

// socket io
io.on("connection", (socket) => {
  console.log("connected..")

  socket.on("joinRoom", (obj) => {
    console.log(obj)
    console.log(socket.rooms) // Set { <socket.id> }
    socket.join(obj.roomName)
    socket.data.roomName = obj.roomName
    console.log(socket.rooms) // Set { <socket.id>, "room1" }
    socket.broadcast.emit("roomJoined", obj.username)
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
})

// listen on port
http.listen(PORT, () => {
  console.log(`listening on ${PORT}`)
})
