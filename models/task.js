const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" }, // Reference to user_info
  taskName: { type: String, required: true },
  taskTime: { type: String, required: true },
  dueDate: { type: Date, required: true },
  priority: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = taskSchema;
