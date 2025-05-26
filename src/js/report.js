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
  dashboardData.stats.inProgress = tasks.filter((t) => !t.completed).length;
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

    const dayTasks = dashboardData.tasks.filter((t) =>
      t.dueDate?.startsWith(dayKey)
    );
    const c = dayTasks.filter((t) => t.completed).length;
    const over = dayTasks.filter(
      (t) => !t.completed && new Date(t.dueDate) < now
    ).length;
    const inProg = dayTasks.length - c - over;

    comp.push(c);
    ip.push(inProg);
    ov.push(over);
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
    populateStats();
    populateTasks();
  });
}

document.addEventListener("DOMContentLoaded", initReport);
document.addEventListener("DOMContentLoaded", initDashboard);
