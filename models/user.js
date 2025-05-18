const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  sleepTime: String,
  wakeUpTime: String,
  stored: { type: Number, default: 0 },
});

module.exports = userSchema;
