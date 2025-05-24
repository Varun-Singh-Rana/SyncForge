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

const dashboardData = {
  username: "",
  pageTitle: "Settings Overview",
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

//
async function loadData() {
  await fetchUserInfo();
}

function initDashboard() {
  loadData().then(() => {
    populateHeader();
    populateStats();
    populateTasks();
  });
}

document.addEventListener("DOMContentLoaded", initDashboard);
