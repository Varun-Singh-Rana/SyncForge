async function fetchUserInfo() {
  try {
    const res = await fetch("/api/users");
    const users = await res.json();
    // If your API returns an array, pick the first user
    if (Array.isArray(users) && users.length > 0) {
      dashboardData.username = users[0].name || "User";
    } else if (users.name) {
      dashboardData.username = users.name;
    }
  } catch (e) {
    dashboardData.username = "User";
  }
}

async function fetchTasks() {
  try {
    const res = await fetch("/api/tasks");
    const tasks = await res.json();
    dashboardData.stats.totalTasks.value = tasks.length;
    dashboardData.myTasks = tasks.filter((t) => !t.completed);
    dashboardData.completedTasks = tasks.filter((t) => t.completed);
    dashboardData.stats.completed.value = dashboardData.completedTasks.length;
    dashboardData.stats.inProgress.value = dashboardData.myTasks.length;
    // Add overdue logic if you have due dates
    dashboardData.stats.overdue.value = tasks.filter((t) => t.overdue).length;
  } catch (e) {
    dashboardData.myTasks = [];
    dashboardData.completedTasks = [];
  }
}

async function loadData() {
  await fetchUserInfo();
  await fetchTasks();
}

const dashboardData = {
  username: "",
  pageTitle: "History Overview",
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

//
async function loadData() {
  await fetchUserInfo();
  await fetchTasks();
}

function initDashboard() {
  loadData().then(() => {
    populateHeader();
    populateStats();
    populateTasks();
  });
}

document.addEventListener("DOMContentLoaded", initDashboard);
