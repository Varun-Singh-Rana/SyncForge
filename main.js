const express = require("express");
const mongoose = require("mongoose");
const app = express();
app.use(express.json());

// Two connections
const userInfoConn = mongoose.createConnection(
  "mongodb://localhost:27017/userinfo"
);
const userTaskConn = mongoose.createConnection(
  "mongodb://localhost:27017/usertask"
);

// Import schemas
const userSchema = require("models/user");
const taskSchema = require("models/task");

// Create models
const User = userInfoConn.model("user", userSchema);
const Task = userTaskConn.model("task", taskSchema);

// Route to check if user info is stored
app.get("/api/userinfo/status", async (req, res) => {
  const user = await User.findOne();
  res.json({ stored: user && user.stored === 1 ? 1 : 0 });
});

// Route to save user info
app.post("/api/users", async (req, res) => {
  try {
    const { name, sleepTime, wakeUpTime } = req.body;
    const user = new User({ name, sleepTime, wakeUpTime, stored: 1 });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/tasks", async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
