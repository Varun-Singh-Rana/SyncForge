document
  .getElementById("userInfoForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const sleepTime = document.getElementById("sleepTime").value;
    const wakeUpTime = document.getElementById("wakeUpTime").value;

    const userData = {
      name,
      sleepTime,
      wakeUpTime,
    };

    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
  });

window.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("/api/userinfo/status");
  const data = await res.json();
  if (data.stored === 1) {
    document.querySelector(".container").innerHTML = "<h2>Welcome back!</h2>";
    // After successful login
    window.location.href = "/pages/index.html";
  }
});
