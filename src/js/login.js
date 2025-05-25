document
  .getElementById("userInfoForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const sleepTime = document.getElementById("sleepTime").value;
    const wakeUpTime = document.getElementById("wakeUpTime").value;

    const userData = {
      name,
      email,
      sleepTime,
      wakeUpTime,
    };

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      if (response.ok) {
        // If the data was saved successfully, redirect to index.html
        window.location.href = "/pages/index.html";
      } else {
        // Handle server errors (e.g., display a message)
        alert("Failed to save user information. Please try again.");
        console.error("Failed to save user info:", await response.text());
      }
    } catch (error) {
      // Handle network errors
      alert("An error occurred. Please check your connection and try again.");
      console.error("Error during fetch:", error);
    }
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
