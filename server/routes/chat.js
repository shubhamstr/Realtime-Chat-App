const express = require("express")
const router = express.Router()
const db = require("../db")
const dotenv = require("dotenv")
const nodemailer = require("nodemailer")

// Set up Global configuration access
dotenv.config()

const createMailer = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

const sendEmailAlert = async ({ to, subject, text }) => {
  if (!to) return

  const mailer = createMailer()
  if (!mailer) {
    console.log("Email alert skipped: SMTP settings missing")
    return
  }

  await mailer.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
  })
}

router.post("/insert", (req, res) => {
  const payload = {
    user_id: req.body?.user_id?.toString(),
    room_id: req.body?.room_id?.toString(),
    message: req.body.message || "",
    attachment: req.body.attachment || "",
  }

  db.createMessage(payload)
    .then(async (result) => {
      const io = req.app.get("io")
      try {
        const email = req.body.emailAlertTo || req.body.email || ""
        const shouldEmail = String(req.body.enableEmailAlert || req.body.email_notification_flag || "") === "1"
        if (shouldEmail && email) {
          const textParts = []
          if (req.body.message) textParts.push(req.body.message)
          if (req.body.attachment) textParts.push("[attachment included]")
          await sendEmailAlert({
            to: email,
            subject: `New chat message in room ${payload.room_id}`,
            text: textParts.length ? textParts.join("\n") : "You received a new chat message.",
          })
        }
      } catch (emailErr) {
        console.log("Email alert failed:", emailErr.message || emailErr)
      }

      if (io && payload.room_id) {
        io.to(payload.room_id).emit("room-message", {
          roomName: payload.room_id,
          username: req.body.username || "Someone",
          message: payload.message,
          attachment: payload.attachment,
          messageId: result?._id || result?.insertId || "",
        })
      }

      return res.send({
        err: false,
        msg: "Message Sent Successfully!!",
        data: result,
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

router.post("/update-notification-email", (req, res) => {
  const id = req.body?.id?.toString()

  if (!id) {
    return res.send({
      err: true,
      msg: "Missing user id",
      data: "",
    })
  }

  db.updateUser(id, {
    email: req.body.email || "",
    email_notification_flag: Number(req.body.email_notification_flag || 0),
    push_notification_flag: Number(req.body.push_notification_flag || 0),
  })
    .then((result) => {
      return res.send({
        err: false,
        msg: "Notification settings updated successfully",
        data: result,
      })
    })
    .catch((err) => {
      return res.send({
        err: true,
        msg: err.sqlMessage ? err.sqlMessage : "Server Error (update-notification-email)",
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

      const io = req.app.get("io")
      if (io && room_id) {
        io.to(room_id).emit("message-deleted", {
          messageId: id,
          roomName: room_id,
          user_id,
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
