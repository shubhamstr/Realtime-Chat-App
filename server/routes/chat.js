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
        msg: err.sqlMessage ? err.sqlMessage : "Server Error (insert)",
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
          msg: "Server Error (get-all)",
          data: err,
        })
      })
  } else {
    return res.send({
      err: true,
      msg: "Server Error (get-all)",
      data: "",
    })
  }
})

router.delete("/delete", (req, res) => {
  const id = req.body?.id?.toString()
  const user_id = req.body?.user_id?.toString()
  const room_id = req.body?.room_id?.toString()

  if (!id || !room_id || !user_id) {
    return res.send({
      err: true,
      msg: "Missing message information",
      data: "",
    })
  }

  db.deleteMessage({ id, user_id, room_id })
    .then((result) => {
      let isError = !result;
      // console.log(process.env.DB_PROVIDER, 'process.env.DB_PROVIDER')
      if (process.env.DB_PROVIDER === "mongo") {
        isError = result.deletedCount === 0;
      } else {
        isError = !result.affectedRows;
      }
      // console.log(isError, 'isError')
      if (isError) {
        return res.send({
          err: true,
          msg: "Message not found or you do not have permission to delete it",
          data: result,
        })
      }

      return res.send({
        err: false,
        msg: "Message deleted successfully",
        data: result,
      })
    })
    .catch((err) => {
      console.log(err)
      return res.send({
        err: true,
        msg: err.sqlMessage ? err.sqlMessage : "Server Error (delete)",
        data: err,
      })
    })
})

module.exports = router
