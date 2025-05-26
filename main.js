const express = require("express");
const mongoose = require("mongoose");
const { sendTaskNotification } = require("./src/js/reminder");

const app = express();
app.use(express.json());
app.use(express.static("src"));

// Two connections
const userInfoConn = mongoose.createConnection(
  "mongodb://localhost:27017/userinfo"
);
const userTaskConn = mongoose.createConnection(
  "mongodb://localhost:27017/usertask"
);

// Import schemas
const userSchema = require("./models/user");
const taskSchema = require("./models/task");

// Create models
const User = userInfoConn.model("user", userSchema);
const Task = userTaskConn.model("task", taskSchema);

// Route to check if user info is stored
app.get("/api/userinfo/status", async (req, res) => {
  const user = await User.findOne();
  res.json({ stored: user && user.stored === 1 ? 1 : 0 });
});

// To save user info
app.post("/api/users", async (req, res) => {
  try {
    const { name, email, sleepTime, wakeUpTime } = req.body;
    const user = new User({ name, email, sleepTime, wakeUpTime, stored: 1 });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// To get user info
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// To update user info
app.put("/api/users/:id", async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// To save user tasks
app.post("/api/tasks", async (req, res) => {
  try {
    // 1) Create & save the task
    const taskData = {
      taskName: req.body.taskName,
      description: req.body.description,
      taskStartTime: req.body.taskStartTime,
      taskEndTime: req.body.taskEndTime,
      dueDate: req.body.dueDate,
      priority: req.body.priority,
      completed: false,
      userId: req.body.userId,
    };
    const newTask = new Task(taskData);
    await newTask.save();

    // To Send notification
    const user = await User.findById(taskData.userId);
    if (user?.email) {
      sendTaskNotification(user.email, {
        taskName: newTask.taskName,
        dueDate: newTask.dueDate,
        description: newTask.description,
        userName: user.name,
      }).catch(console.error);
    }
    res.status(201).json(newTask);
  } catch (err) {
    console.error("Error saving task:", err);
    res.status(400).json({ error: err.message });
  }
});

// To get user tasks
app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
