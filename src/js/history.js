const dashboardData = {
  username: "User",
  pageTitle: "History Overview",
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

function renderHistoryDayTasks(selectedDate) {
  // Format to YYYY-MM-DD for comparison
  const dayStr =
    selectedDate.getFullYear() +
    "-" +
    String(selectedDate.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(selectedDate.getDate()).padStart(2, "0");

  // Filter all tasks for the selected day
  const dayTasks = [
    ...dashboardData.myTasks,
    ...dashboardData.completedTasks,
  ].filter((t) => {
    // If your task has dueDate as Date object or string
    const taskDate = t.dueDate
      ? (() => {
          const d = new Date(t.dueDate);
          return (
            d.getFullYear() +
            "-" +
            String(d.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(d.getDate()).padStart(2, "0")
          );
        })()
      : "";
    return taskDate === dayStr;
  });

  // Set the header label if you want
  const label = document.getElementById("selectedDayLabel");
  if (label) {
    label.textContent = selectedDate.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Render tasks
  const list = document.getElementById("dayTaskList");
  if (!list) return;

  if (dayTasks.length === 0) {
    list.innerHTML = `<div class="no-tasks">No tasks for this day.</div>`;
    return;
  }

  list.innerHTML = dayTasks
    .map(
      (t) => `
      <div class="day-task-card">
        <div class="day-task-title">
          ${t.taskName || t.title}
          ${
            t.priority
              ? `<span class="task-priority priority-${(
                  t.priority || ""
                ).toLowerCase()}">${t.priority}</span>`
              : ""
          }
        </div>
        <div class="day-task-meta">
          ${
            t.taskTime
              ? `<span><i class="far fa-clock"></i> ${t.taskTime}</span>`
              : ""
          }
          <span><i class="far fa-calendar"></i> ${
            t.dueDate
              ? new Date(t.dueDate).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : ""
          }</span>
          <span><i class="far fa-clock"></i> ${
            t.dueDate
              ? new Date(t.dueDate).toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""
          }</span>
        </div>
      </div>
    `
    )
    .join("");
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

let calMonth = new Date().getMonth();
let calYear = new Date().getFullYear();
let selectedDate = new Date();

function initCalendar() {
  document.getElementById("prevMonthBtn").onclick = () => {
    calMonth--;
    if (calMonth < 0) {
      calMonth = 11;
      calYear--;
    }
    renderCalendar();
  };
  document.getElementById("nextMonthBtn").onclick = () => {
    calMonth++;
    if (calMonth > 11) {
      calMonth = 0;
      calYear++;
    }
    renderCalendar();
  };
  renderCalendar();
}

function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  const header = document.getElementById("calendarMonthYear");
  header.textContent = new Date(calYear, calMonth).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  grid.innerHTML = "";
  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((d) => {
    const h = document.createElement("div");
    h.className = "calendar-day-header";
    h.textContent = d;
    grid.appendChild(h);
  });

  let firstDow = new Date(calYear, calMonth, 1).getDay(); // 0=Sun, 1=Mon, ...
  firstDow = (firstDow + 6) % 7;
  for (let i = 0; i < firstDow; i++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day inactive";
    grid.appendChild(cell);
  }

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  for (let date = 1; date <= daysInMonth; date++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day";
    cell.textContent = date;

    // highlight currently selected
    if (
      selectedDate.getFullYear() === calYear &&
      selectedDate.getMonth() === calMonth &&
      selectedDate.getDate() === date
    ) {
      cell.classList.add("selected");
    }

    cell.onclick = () => {
      selectedDate = new Date(calYear, calMonth, date);
      renderCalendar(); // re‐draw to update highlight
      renderHistoryDayTasks(selectedDate); // show tasks
    };
    grid.appendChild(cell);
  }
}
// Show today's tasks on page
document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
  initCalendar();
  renderHistoryDayTasks(selectedDate);
});
