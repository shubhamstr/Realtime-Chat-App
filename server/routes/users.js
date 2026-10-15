const express = require("express")
const router = express.Router()
const db = require("../db")

router.get("/get-all", (req, res) => {
  db.getUserByFilter({
    userId: req.query.userId,
    ignoreUserId: req.query.ignoreUserId,
  })
    .then((result) => {
      return res.send({
        err: false,
        msg: "Users Fetched Successfully!!",
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
})

router.post("/update-notification", (req, res) => {
  db.updateUser(req.body.id, {
    email_notification_flag: Number(req.body.email_notification_flag),
    push_notification_flag: Number(req.body.push_notification_flag),
    email_message_flag: Number(req.body.email_message_flag),
    push_message_flag: Number(req.body.push_message_flag),
  })
    .then((result) => {
      return res.send({
        err: false,
        msg: "User Notification Updated Successfully!!",
        data: result,
      })
    })
    .catch((err) => {
      return res.send({
        err: true,
        msg: "Server Error (update-notification)",
        data: err,
      })
    })
})

router.post("/update-personal", (req, res) => {
  db.updateUser(req.body.id, {
    username: req.body.userName,
    email: req.body.email,
  })
    .then((result) => {
      return res.send({
        err: false,
        msg: "User Details Updated Successfully!!",
        data: result,
      })
    })
    .catch((err) => {
      return res.send({
        err: true,
        msg: "Server Error (update-personal)",
        data: err,
      })
    })
})

router.post("/update-password", (req, res) => {
  db.updateUser(req.body.id, {
    password: req.body.newPassword,
  })
    .then((result) => {
      return res.send({
        err: false,
        msg: "User Password Updated Successfully!!",
        data: result,
      })
    })
    .catch((err) => {
      return res.send({
        err: true,
        msg: "Server Error (update-password)",
        data: err,
      })
    })
})

module.exports = router
