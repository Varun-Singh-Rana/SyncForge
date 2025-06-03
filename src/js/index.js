async function fetchUserInfo() {
  try {
    const res = await fetch("/api/users");
    const users = await res.json();
    const u = Array.isArray(users) ? users[0] : users;
    dashboardData.username = u?.name || "User";
    currentUserId = u?._id || null;
  } catch (e) {
    dashboardData.username = "User";
  }
}

async function fetchTasks() {
  const res = await fetch("/api/tasks");
  const tasks = await res.json();

  dashboardData.stats.total = tasks.length;
  dashboardData.completedTasks = tasks.filter((t) => t.completed);
  dashboardData.myTasks = tasks.filter((t) => !t.completed);

  dashboardData.stats.completed = dashboardData.completedTasks.length;
  dashboardData.stats.inProgress = dashboardData.myTasks.length;
  dashboardData.stats.overdue = tasks.filter((t) => {
    if (!t.completed && t.dueDate) {
      const due = new Date(t.dueDate);
      due.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return due < today;
    }
    return false;
  }).length;
}

async function fetchAndComputeTasks() {
  const res = await fetch("/api/tasks");
  const tasks = await res.json();
  dashboardData.tasks = tasks;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  dashboardData.stats.total = tasks.length;
  dashboardData.stats.completed = tasks.filter((t) => t.completed).length;

  dashboardData.stats.inProgress = tasks.filter((t) => {
    if (t.completed) return false;
    if (t.dueDate) {
      const d = new Date(t.dueDate);
      d.setHours(0, 0, 0, 0);
      return d >= today;
    }
    return true;
  }).length;
  dashboardData.stats.overdue = tasks.filter((t) => {
    if (!t.completed && t.dueDate) {
      const d = new Date(t.dueDate);
      d.setHours(0, 0, 0, 0);
      return d < today;
    }
    return false;
  }).length;
}

function populateHeaderAndStats() {
  document.getElementById("usernameDisplay").textContent =
    dashboardData.username;
  document.getElementById("pageTitle").textContent = dashboardData.pageTitle;

  document.getElementById("totalTasksVal").textContent =
    dashboardData.stats.total;
  document.getElementById("completedTasksVal").textContent =
    dashboardData.stats.completed;
  document.getElementById("inProgressTasksVal").textContent =
    dashboardData.stats.inProgress;
  document.getElementById("overdueTasksVal").textContent =
    dashboardData.stats.overdue;
}

const dashboardData = {
  username: "",
  pageTitle: "Dashboard Overview",
  notifications: 0,
  stats: {
    totalTasks: { value: 0, change: "", positive: true },
    completed: { value: 0, change: "", positive: true },
    inProgress: { value: 0, change: "", positive: false },
    overdue: { value: 0, change: "", positive: false },
  },
  myTasks: [],
  completedTasks: [],
};

// Utility to set text content
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setChange(id, stat) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = stat.change
    ? `<i class="fas fa-arrow-${stat.positive ? "up" : "down"}"></i> ${
        stat.change
      }`
    : "";
  el.className = "card-change" + (stat.positive ? " positive" : " negative");
}

// Populate username and page title
function populateHeader() {
  setText("usernameDisplay", dashboardData.username);
  setText("pageTitle", dashboardData.pageTitle);
  setText(
    "notifybell",
    dashboardData.notifications ? dashboardData.notifications : ""
  );
}

// Populate tasks
function populateTasks() {
  const myTasksList = document.getElementById("myTasksList");
  myTasksList.innerHTML = "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Filter tasks for today and tomorrow
  const filteredTasks = dashboardData.myTasks.filter((task) => {
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return (
      dueDate.getTime() === today.getTime() ||
      dueDate.getTime() === tomorrow.getTime()
    );
  });

  if (filteredTasks.length === 0) {
    myTasksList.innerHTML = `<div class="no-task-msg">No tasks for today or tomorrow.</div>`;
    return;
  }

  filteredTasks.forEach((task) => {
    const dueDate = new Date(task.dueDate);
    let dueLabel = "";
    const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) dueLabel = "Due tomorrow";
    else if (diffDays === 0) dueLabel = "Due today";

    const priorityClass = task.priority ? task.priority.toLowerCase() : "low";
    const timeRange =
      task.taskTime && task.endTime
        ? `${task.taskTime}–${task.endTime}`
        : task.taskTime || "";

    const div = document.createElement("div");
    div.className = "task-card";
    div.innerHTML = `
      <div class="task-header">
        <span class="task-badge">${
          dueLabel === "Due tomorrow" ? "Tomorrow's Task" : "Today's Task"
        }</span>
        <span class="task-priority ${priorityClass}">${task.priority}</span>
      </div>
      <div class="task-body">
        <label class="task-checkbox">
          <input type="checkbox" ${task.completed ? "checked" : ""} />
        </label>
        <div class="task-info">
          <div class="task-title">${task.taskName}</div>
          <div class="task-meta">
            <span class="task-time"><i class="fas fa-clock"></i> ${timeRange}</span>
            <span class="task-due"><i class="fas fa-calendar-alt"></i> ${dueLabel}</span>
          </div>
        </div>
      </div>
    `;
    myTasksList.appendChild(div);
  });
}

function showModal() {
  document.getElementById("taskModal").classList.add("active");
}
function hideModal() {
  document.getElementById("taskModal").classList.remove("active");
}

// Priority Buttons Stay Colored
document.querySelectorAll(".priority-option").forEach((btn) => {
  btn.addEventListener("click", function () {
    document
      .querySelectorAll(".priority-option")
      .forEach((b) => b.classList.remove("active"));
    this.classList.add("active");
  });
});

// Handle Add Task button (My Tasks)
document.addEventListener("DOMContentLoaded", () => {
  // Add Task button
  const addTaskBtn = document.getElementById("addTaskBtn");
  if (addTaskBtn) {
    addTaskBtn.addEventListener("click", showModal);
  }

  // Quick Task button (header)
  const quickTaskBtn = document.querySelector(".quick-add");
  if (quickTaskBtn) {
    quickTaskBtn.addEventListener("click", async () => {
      const title = prompt("Quick Task Title:");
      if (title) {
        await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, completed: false }),
        });
        //
      }
    });
  }

  // 3-dot button in Completed tab
  const completedMenuBtn = document.getElementById("assignTaskBtn");
  if (completedMenuBtn) {
    completedMenuBtn.addEventListener("click", () => {
      alert("Completed menu options coming soon!");
    });
  }

  // Modal close
  const closeModalBtn = document.getElementById("closeModal");
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", hideModal);
  }
});

//
async function initReport() {
  await fetchUserInfo();
  await fetchAndComputeTasks();
  populateHeaderAndStats();
}

async function loadData() {
  await fetchUserInfo();
  await fetchTasks();
}

function initDashboard() {
  loadData().then(() => {
    populateHeader();
    //populateStats();
    populateTasks();
  });
}

document.addEventListener("DOMContentLoaded", initReport);
document.addEventListener("DOMContentLoaded", initDashboard);

//

const taskForm = document.getElementById("taskForm");
if (taskForm) {
  taskForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const taskName = document.getElementById("taskName").value;
    const description = document.getElementById("description").value;
    const taskStartTime = document.getElementById("startTime").value;
    const taskEndTime = document.getElementById("endTime").value;
    const dueDate = document.getElementById("dueDate").value;
    const priorityBtn = document.querySelector(".priority-option.active");
    const priority = priorityBtn ? priorityBtn.textContent.trim() : "Low";

    const taskData = {
      taskName,
      description,
      taskStartTime,
      taskEndTime,
      dueDate,
      priority,
      userId: currentUserId,
    };

    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });

    if (response.ok) {
      hideModal();
      await loadData();
      populateTasks();
      taskForm.reset();
      // Remove active state from priority buttons
      taskForm
        .querySelectorAll(".priority-option")
        .forEach((btn) => btn.classList.remove("active"));
    } else {
      alert("Failed to create task.");
    }
  });
}
