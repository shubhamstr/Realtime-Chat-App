const express = require("express")
const app = express()
const http = require("http").createServer(app)
const io = require("socket.io")(http)
const cors = require("cors")

require("dotenv").config()

const users = require("./routes/users")
const auth = require("./routes/auth")
const chat = require("./routes/chat")

const PORT = process.env.PORT || 5000

app.use(express.static(__dirname + "/public"))
app.use(express.json())
app.use(cors())

app.get("/", (req, res) => {
  res.send("server is running on " + PORT)
})

app.get("/html", (req, res) => {
  res.sendFile(__dirname + "/index.html")
})

app.use("/users", users)
app.use("/auth", auth)
app.use("/chat", chat)

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
      socket.to(socket.data.roomName).emit("message", msg)
      return
    }

    socket.broadcast.emit("message", msg)
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
