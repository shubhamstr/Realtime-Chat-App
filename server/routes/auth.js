const express = require("express")
const router = express.Router()
const db = require("../db")
const jwt = require("jsonwebtoken")
const dotenv = require("dotenv")
const crypto = require("crypto")

// Set up Global configuration access
dotenv.config()

// Configuration
const secretKey = crypto.randomBytes(32) // Or a constant key for decryption later
const iv = crypto.randomBytes(16) // Initialization Vector

const generateToken = (result) => {
  let jwtSecretKey = process.env.JWT_SECRET_KEY
  const currentUser = result[0] || {}
  // console.log(jwtSecretKey)
  let data = {
    time: Date(),
    userId: currentUser.id || currentUser._id,
    userType: "user",
  }
  // console.log(data)
  const token = jwt.sign(data, jwtSecretKey)
  return token
}

function generateEncryptedURL(name) {
  const uniqueData = `${name}-${Date.now()}` // name + timestamp for uniqueness

  // Encrypt
  const cipher = crypto.createCipheriv("aes-256-cbc", secretKey, iv)
  let encrypted = cipher.update(uniqueData, "utf8", "base64")
  encrypted += cipher.final("base64")

  // Convert to URL-safe Base64 (replacing +, / and =)
  const urlSafe = encrypted
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")

  return urlSafe
}

router.post("/login", async (req, res) => {
  if (req.body.loginType !== "userName") {
    return res.send({ err: true, msg: "Unsupported login type" })
  }

  try {
    let encryptedUrlToken = req.body.room_id || generateEncryptedURL(req.body.userName)
    const existingUser = await db.getUserByUsername(req.body.userName)

    let user
    if (!existingUser) {
      user = await db.createUser({
        username: req.body.userName,
        chatURL: encryptedUrlToken,
      })
    } else if (req.body.room_id) {
      user = existingUser
    } else {
      return res.send({
        err: true,
        msg: "Userame already exists",
      })
    }

    const userId = user.id || user._id
    const currentUser = await db.getUserById(userId)
    if (!currentUser) {
      return res.send({
        err: true,
        msg: "Server Error",
      })
    }

    let token = generateToken([currentUser])
    return res.send({
      err: false,
      msg: "User Logged In Successfully!!",
      data: token,
      chatURL: encryptedUrlToken,
    })
  } catch (error) {
    return res.send({
      err: true,
      msg: error.message || "Server Error",
    })
  }
})

module.exports = router
