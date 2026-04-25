const provider = (process.env.DB_PROVIDER || "mysql").toLowerCase()

if (provider === "mongo") {
  module.exports = require("./mongo")
} else {
  module.exports = require("./mysql")
}
