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
    div.textContent = task.taskName;
    myTasksList.appendChild(div);
  });

  dashboardData.completedTasks.forEach((task) => {
    const div = document.createElement("div");
    div.className = "task-item completed";
    div.textContent = task.taskName;
    teamTasksList.appendChild(div);
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

document.addEventListener("DOMContentLoaded", initDashboard);

//

const taskForm = document.getElementById("taskForm");
if (taskForm) {
  taskForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const taskName = document.getElementById("taskName").value;
    const description = document.getElementById("description").value;
    const taskTime = document.getElementById("taskTime").value;
    const endTime = document.getElementById("endTime").value;
    const dueDate = document.getElementById("dueDate").value;
    const priorityBtn = document.querySelector(".priority-option.active");
    const priority = priorityBtn ? priorityBtn.textContent.trim() : "Low";

    const taskData = {
      taskName,
      description,
      taskTime,
      endTime,
      dueDate,
      priority,
      completed: false,
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
