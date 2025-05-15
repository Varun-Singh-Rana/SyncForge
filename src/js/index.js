// Example: Fetch or define your data here
const dashboardData = {
  username: "",
  pageTitle: "Dashboard Overview",
  notifications: 0,
  stats: {
    totalTasks: { value: "", change: "", positive: true },
    completed: { value: "", change: "", positive: true },
    inProgress: { value: "", change: "", positive: false },
    overdue: { value: "", change: "", positive: false },
  },
  myTasks: [],
  completedTasks: [],
};

// Utility to set text content
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// Populate stats
function populateStats() {
  setText("totalTasksVal", dashboardData.stats.totalTasks.value);
  setText("completedTasksVal", dashboardData.stats.completed.value);
  setText("inProgressTasksVal", dashboardData.stats.inProgress.value);
  setText("overdueTasksVal", dashboardData.stats.overdue.value);

  setChange("totalTasksChange", dashboardData.stats.totalTasks);
  setChange("completedTasksChange", dashboardData.stats.completed);
  setChange("inProgressTasksChange", dashboardData.stats.inProgress);
  setChange("overdueTasksChange", dashboardData.stats.overdue);
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
  const teamTasksList = document.getElementById("teamTasksList");
  myTasksList.innerHTML = "";
  teamTasksList.innerHTML = "";

  dashboardData.myTasks.forEach((task) => {
    const div = document.createElement("div");
    div.className = "task-item";
    div.textContent = task.title;
    myTasksList.appendChild(div);
  });

  dashboardData.completedTasks.forEach((task) => {
    const div = document.createElement("div");
    div.className = "task-item completed";
    div.textContent = task.title;
    teamTasksList.appendChild(div);
  });
}

// Example: Load data (replace with real fetch or user input)
function loadData() {
  // Example: prompt for username if not set
  if (!dashboardData.username) {
    dashboardData.username = prompt("Enter your username:") || "User";
  }
  // Example: set stats and tasks (empty by default)
  dashboardData.stats.totalTasks.value = "";
  dashboardData.stats.totalTasks.change = "";
  dashboardData.stats.completed.value = "";
  dashboardData.stats.completed.change = "";
  dashboardData.stats.inProgress.value = "";
  dashboardData.stats.inProgress.change = "";
  dashboardData.stats.overdue.value = "";
  dashboardData.stats.overdue.change = "";

  dashboardData.myTasks = [];
  dashboardData.completedTasks = [];
}

// Initialize dashboard
function initDashboard() {
  loadData();
  populateHeader();
  populateStats();
  populateTasks();
}

document.addEventListener("DOMContentLoaded", initDashboard);
