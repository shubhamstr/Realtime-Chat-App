const express = require("express")
const router = express.Router()
const db = require("../db")
const dotenv = require("dotenv")

// Set up Global configuration access
dotenv.config()

router.post("/insert", (req, res) => {
  db.createMessage({
    user_id: req.body?.user_id?.toString(),
    room_id: req.body?.room_id?.toString(),
    message: req.body.message || "",
    attachment: req.body.attachment || "",
  })
    .then(() => {
      return res.send({
        err: false,
        msg: "Message Sent Successfully!!",
      })
    })
    .catch((err) => {
      return res.send({
        err: true,
        msg: err.sqlMessage ? err.sqlMessage : "Server Error",
        data: err,
      })
    })
})

router.get("/get-all", (req, res) => {
  if (req.query.room_id) {
    db.getMessagesByRoomId(req.query.room_id)
      .then((result) => {
        return res.send({
          err: false,
          msg: "Chat Fetched Successfully!!",
          data: result,
        })
      })
      .catch((err) => {
        return res.send({
          err: true,
          msg: "Server Error",
          data: err,
        })
      })
  } else {
    return res.send({
      err: true,
      msg: "Server Error",
      data: "",
    })
  }
})

module.exports = router
