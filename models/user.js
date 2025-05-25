const e = require("express");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  sleepTime: String,
  wakeUpTime: String,
  stored: { type: Number, default: 0 },
});

module.exports = userSchema;
