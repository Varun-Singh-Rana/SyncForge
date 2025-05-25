let currentUserId = null;

async function fetchUserInfo() {
  const res = await fetch("/api/users");
  const users = await res.json();
  let user = Array.isArray(users) ? users[0] : users;
  if (user && user._id) {
    currentUserId = user._id;
    document.getElementById("name").value = user.name || "";
    document.getElementById("email").value = user.email || "";
    document.getElementById("sleepTime").value = user.sleepTime || "";
    document.getElementById("wakeUpTime").value = user.wakeUpTime || "";
  }
}

document
  .getElementById("userInfoForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const userData = {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      sleepTime: document.getElementById("sleepTime").value,
      wakeUpTime: document.getElementById("wakeUpTime").value,
    };
    if (currentUserId) {
      // Update existing user
      const response = await fetch(`/api/users/${currentUserId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      if (response.ok) {
        alert("User info updated!");
      } else {
        alert("Failed to update user info.");
      }
    }
  });

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
