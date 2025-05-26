const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: +process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  logger: true,
  debug: true,
});

async function sendTaskNotification(to, task) {
  console.log("→ Sending mail to", to, "about", task);
  try {
    const info = await transporter.sendMail({
      from: `"SyncForge" <${process.env.SMTP_USER}>`,
      to,
      subject: `Reminder: ${task.taskName} is due ${task.dueDate}`,
      html: `
      <p>Hi there,</p>
      <p>This is a reminder that your task <strong>${task.taskName}</strong> 
      is due on <em>${new Date(task.dueDate).toLocaleString()}</em>.</p>
      <p>Details: ${task.description || "No description"}</p>
      <p>— SyncForge</p>
    `,
    });
    console.log("✅ Email sent:", info.response);
  } catch (err) {
    console.error("❌ sendMail error:", err);
    throw err;
  }
}

module.exports = { sendTaskNotification };
