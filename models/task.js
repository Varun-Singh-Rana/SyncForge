const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  taskName: { type: String, required: true },
  description: { type: String },
  taskTime: { type: String, required: true },
  dueDate: { type: String, required: true },
  priority: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = taskSchema;
