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

function isTaskTimePassed(task) {
  if (!task.taskEndTime) return false; // If no end time, always show
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  // Parse end time (assume "HH:mm" 24h format)
  const [endHour, endMinute] = task.taskEndTime.split(":").map(Number);
  dueDate.setHours(endHour, endMinute, 0, 0);
  return now > dueDate;
}

function updateNotificationCount() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tasks = dashboardData.tasks || [];
  const count = tasks.filter((task) => {
    if (!task.dueDate || task.completed) return false;
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === today.getTime() && !isTaskTimePassed(task);
  }).length;

  const badge = document.getElementById("notifybell");
  if (badge) {
    badge.style.display = count > 0 ? "flex" : "none";
    badge.textContent = count > 0 ? count : "";
  }
}

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

function getMondayOfThisWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function populateCompletedTasks() {
  const completedList = document.getElementById("teamTasksList");
  completedList.innerHTML = "";

  // Only show tasks completed since this week's Monday
  const monday = getMondayOfThisWeek();
  const recentCompleted = dashboardData.completedTasks.filter((task) => {
    if (!task.completedAt) return false;
    const completedAt = new Date(task.completedAt);
    // Compare only the date part to avoid timezone issues
    const completedDate = new Date(
      completedAt.getFullYear(),
      completedAt.getMonth(),
      completedAt.getDate()
    );
    const mondayDate = new Date(
      monday.getFullYear(),
      monday.getMonth(),
      monday.getDate()
    );
    return completedDate >= mondayDate;
  });

  if (!recentCompleted.length) {
    completedList.innerHTML = `<div class="no-task-msg">No tasks completed.</div>`;
    return;
  }

  recentCompleted.forEach((task) => {
    const completedAt = task.completedAt ? new Date(task.completedAt) : null;
    const priorityClass = task.priority ? task.priority.toLowerCase() : "low";
    completedList.innerHTML += `
    <div class="task-card completed">
      <div class="task-title-row">
        <span class="task-title">${task.taskName}</span>
        <span class="task-priority ${priorityClass}">${
      task.priority || "Low"
    }</span>
      </div>
      <div class="task-meta">
        <span>
          <i class="fas fa-calendar-check"></i>
          Completed: ${
            completedAt
              ? completedAt.toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "—"
          }
          ${
            completedAt
              ? completedAt.toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""
          }
        </span>
      </div>
    </div>
  `;
  });
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

  // Sort: today's first, then tomorrow's
  filteredTasks.sort((a, b) => {
    const aDate = new Date(a.dueDate);
    aDate.setHours(0, 0, 0, 0);
    const bDate = new Date(b.dueDate);
    bDate.setHours(0, 0, 0, 0);
    return aDate - bDate;
  });

  if (filteredTasks.length === 0) {
    myTasksList.innerHTML = `<div class="no-task-msg">No tasks for today or tomorrow.</div>`;
    teamTasksList.innerHTML = `<div class="no-task-msg">No tasks is Completed.</div>`;
    return;
  }

  filteredTasks.forEach((task) => {
    const dueDate = new Date(task.dueDate);
    let dueLabel = "";
    const diffDays = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) dueLabel = "Due tomorrow";
    else if (diffDays === 0) dueLabel = "Due today";

    const priorityClass = task.priority ? task.priority.toLowerCase() : "low";

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
        <input type="checkbox" data-task-id="${task._id}" ${
      task.completed ? "checked" : ""
    } />
      </label>
      <div class="task-info">
        <div class="task-title">${task.taskName}</div>
        <div class="task-meta">
          <span class="task-time">
            <i class="fas fa-clock"></i>
            ${dueDate.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span class="task-date">
            <i class="fas fa-calendar-alt"></i>
            ${dueDate.toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span class="task-due">${dueLabel}</span>
        </div>
      </div>
    </div>
  `;
    // ...inside filteredTasks.forEach...
    myTasksList.appendChild(div);

    // Add event listener for the checkbox
    const checkbox = div.querySelector('input[type="checkbox"]');
    if (checkbox) {
      checkbox.addEventListener("change", async function () {
        if (checkbox.checked) {
          // Show confirmation dialog
          const confirmed = await showCompleteTaskDialog();
          if (confirmed) {
            // Update in MongoDB
            await fetch(`/api/tasks/${task._id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                completed: true,
                completedAt: new Date(),
              }),
            });
            // Force reload of all data and both lists
            await loadData();
            populateTasks();
            populateCompletedTasks();
          } else {
            checkbox.checked = false;
          }
        }
      });
    }
  });
}

console.log("Task marked as completed, data reloaded:", dashboardData);

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

  const bellBtn = document.querySelector(".notification");
  const dropdown = document.getElementById("notificationDropdown");
  const dropdownList = document.getElementById("notificationTaskList");

  if (bellBtn && dropdown && dropdownList) {
    bellBtn.addEventListener("click", () => {
      // Toggle dropdown
      dropdown.style.display =
        dropdown.style.display === "none" ? "block" : "none";
      if (dropdown.style.display === "block") {
        showTodayTasksInDropdown();
      }
    });

    // Hide dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!bellBtn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = "none";
      }
    });
  }
});

function showTodayTasksInDropdown() {
  const dropdownList = document.getElementById("notificationTaskList");
  dropdownList.innerHTML = "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tasks = dashboardData.myTasks.filter((task) => {
    if (!task.dueDate || task.completed) return false;
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    // Only today's tasks and not overdue
    return dueDate.getTime() === today.getTime() && !isTaskTimePassed(task);
  });

  if (tasks.length === 0) {
    dropdownList.innerHTML = `<div class="dropdown-task">No tasks for today.</div>`;
    return;
  }

  tasks.forEach((task) => {
    dropdownList.innerHTML += `
      <div class="dropdown-task">
        <div class="dropdown-task-title">${task.taskName}</div>
        <div class="dropdown-task-meta">
          ${
            task.taskStartTime
              ? `<i class="fas fa-clock"></i> ${task.taskStartTime}`
              : ""
          }
          ${task.description ? `<br>${task.description}` : ""}
        </div>
      </div>
    `;
  });
}

//
async function initReport() {
  await fetchUserInfo();
  await fetchAndComputeTasks();
  populateHeaderAndStats();
}

async function loadData() {
  await fetchUserInfo();
  await fetchTasks();
  updateNotificationCount();
  populateTasks();
  populateCompletedTasks();
}

function initDashboard() {
  loadData().then(() => {
    populateHeader();
    updateNotificationCount();
    //populateStats();
    //populateTasks();
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
      populateCompletedTasks();
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

async function showCompleteTaskDialog() {
  return new Promise((resolve) => {
    // Create modal
    const modal = document.createElement("div");
    modal.className = "custom-modal";
    modal.innerHTML = `
      <div class="custom-modal-content">
        <h2>Complete Task</h2>
        <p>Did you complete this task?</p>
        <button id="modalYesBtn">Yes</button>
        <button id="modalNoBtn">No</button>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector("#modalYesBtn").onclick = () => {
      document.body.removeChild(modal);
      resolve(true);
    };
    modal.querySelector("#modalNoBtn").onclick = () => {
      document.body.removeChild(modal);
      resolve(false);
    };
  });
}
