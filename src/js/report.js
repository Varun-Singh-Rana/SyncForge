const dashboardData = {
  username: "User",
  pageTitle: "Report Overview",
  stats: {
    totalTasks: { value: 0, change: "" },
    completed: { value: 0, change: "" },
    inProgress: { value: 0, change: "" },
    overdue: { value: 0, change: "" },
  },
  tasks: [],
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

async function fetchUserInfo() {
  try {
    const res = await fetch("/api/users");
    const users = await res.json();
    const u = Array.isArray(users) ? users[0] : users;
    dashboardData.username = u?.name || "User";
  } catch {
    dashboardData.username = "User";
  }
}

// Fetch tasks & compute stats
async function fetchTasks() {
  const res = await fetch("/api/tasks");
  const tasks = await res.json();

  dashboardData.stats.totalTasks.value = tasks.length;
  dashboardData.completedTasks = tasks.filter((t) => t.completed);
  dashboardData.myTasks = tasks.filter((t) => !t.completed);

  dashboardData.stats.completed.value = dashboardData.completedTasks.length;
  dashboardData.stats.inProgress.value = dashboardData.myTasks.length;
  dashboardData.stats.overdue.value = tasks.filter((t) => {
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

// fetch tasks and compute stats for dashboard
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

// Populate the four stat cards
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

// Render both charts
function renderCharts() {
  // Doughnut chart
  const pieCtx = document.getElementById("completionChart").getContext("2d");
  new Chart(pieCtx, {
    type: "doughnut",
    data: {
      labels: ["Completed", "In Progress", "Overdue"],
      datasets: [
        {
          data: [
            dashboardData.stats.completed,
            dashboardData.stats.inProgress,
            dashboardData.stats.overdue,
          ],
          backgroundColor: ["#4cc9f0", "#fdcb6e", "#e17055"],
        },
      ],
    },
    options: { plugins: { legend: { position: "bottom" } } },
  });

  // 7-day trend line
  const lineCtx = document.getElementById("trendChart").getContext("2d");
  const labels = [],
    comp = [],
    ip = [],
    ov = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dayKey = d.toISOString().split("T")[0];
    labels.push(
      d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    );

    // Completed: tasks completed on this day
    const completedCount = dashboardData.tasks.filter(
      (t) =>
        t.completed &&
        t.completedAt &&
        new Date(t.completedAt).toISOString().split("T")[0] === dayKey
    ).length;

    // In Progress: tasks due on this day, not completed
    const inProgressCount = dashboardData.tasks.filter(
      (t) =>
        !t.completed &&
        t.dueDate &&
        new Date(t.dueDate).toISOString().split("T")[0] === dayKey
    ).length;

    // Overdue: tasks due before this day, not completed
    const overdueCount = dashboardData.tasks.filter(
      (t) => !t.completed && t.dueDate && new Date(t.dueDate) < d
    ).length;

    comp.push(completedCount);
    ip.push(inProgressCount);
    ov.push(overdueCount);
  }

  new Chart(lineCtx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Completed",
          data: comp,
          borderColor: "#4cc9f0",
          fill: false,
          tension: 0.3,
        },
        {
          label: "In Progress",
          data: ip,
          borderColor: "#fdcb6e",
          fill: false,
          tension: 0.3,
        },
        {
          label: "Overdue",
          data: ov,
          borderColor: "#e17055",
          fill: false,
          tension: 0.3,
        },
      ],
    },
    options: {
      plugins: { legend: { position: "bottom" } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

document.addEventListener("DOMContentLoaded", () => {
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
  renderCharts();
}

async function loadData() {
  await fetchUserInfo();
  await fetchTasks();
}

function initDashboard() {
  loadData().then(() => {
    populateHeader();
    updateNotificationCount();
    //populateStats();
    populateTasks();
  });
}

document.addEventListener("DOMContentLoaded", initReport);
document.addEventListener("DOMContentLoaded", initDashboard);
