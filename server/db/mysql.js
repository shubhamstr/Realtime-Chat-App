const mysql = require("mysql")

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
})

db.connect(function (err) {
  if (err) throw err
  console.log("Connected to MySQL!")
})

const query = (sql) =>
  new Promise((resolve, reject) => {
    db.query(sql, (err, result) => {
      if (err) {
        return reject(err)
      }
      resolve(result)
    })
  })

const getUserByUsername = async (username) => {
  const rows = await query(
    `SELECT * FROM users WHERE username = ${mysql.escape(username)}`
  )
  return rows[0] || null
}

const getUserById = async (id) => {
  const rows = await query(`SELECT * FROM users WHERE id = ${mysql.escape(id)}`)
  return rows[0] || null
}

const createUser = async ({ username, chatURL }) => {
  const result = await query(
    `INSERT INTO users (username, chatURL) VALUES (${mysql.escape(username)}, ${mysql.escape(chatURL)})`
  )
  return { id: result.insertId }
}

const getAllUsers = async () => query("SELECT * FROM users")

const getUserByFilter = async ({ userId, ignoreUserId }) => {
  if (userId) {
    return query(`SELECT * FROM users WHERE id=${mysql.escape(userId)}`)
  }
  if (ignoreUserId) {
    return query(`SELECT * FROM users WHERE id!=${mysql.escape(ignoreUserId)}`)
  }
  return getAllUsers()
}

const updateUser = async (id, fields) => {
  const assignments = Object.entries(fields)
    .map(([key, value]) => `${key} = ${mysql.escape(value)}`)
    .join(", ")
  return query(`UPDATE users SET ${assignments} WHERE id = ${mysql.escape(id)}`)
}

const createMessage = async ({ user_id, room_id, message, attachment }) => {
  const result = await query(
    `INSERT INTO messages (user_id, room_id, message, attachment) VALUES (${mysql.escape(user_id)}, ${mysql.escape(room_id)}, ${mysql.escape(message)}, ${mysql.escape(attachment || "")})`
  )
  return { id: result.insertId }
}

const getMessagesByRoomId = async (roomId) =>
  query(`SELECT * FROM messages WHERE room_id = ${mysql.escape(roomId)}`)

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
