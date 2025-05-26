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

function renderHistoryDayTasks(selectedDate) {
  // Format to YYYY-MM-DD for comparison
  const dayStr = selectedDate.toISOString().split("T")[0];

  // Filter all tasks for the selected day
  const dayTasks = [
    ...dashboardData.myTasks,
    ...dashboardData.completedTasks,
  ].filter((t) => {
    // If your task has dueDate as Date object or string
    const taskDate = t.dueDate
      ? new Date(t.dueDate).toISOString().split("T")[0]
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
            t.dueDate ? new Date(t.dueDate).toLocaleDateString() : ""
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
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((d) => {
    const h = document.createElement("div");
    h.className = "calendar-day-header";
    h.textContent = d;
    grid.appendChild(h);
  });

  const firstDow = new Date(calYear, calMonth, 1).getDay();
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
