import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify SMTP only when the application is actually running,
// not when Jest imports the module.
if (process.env.NODE_ENV !== "test") {
  transporter.verify((error) => {
    if (error) {
      console.error("❌ SMTP connection failed:", error);
    } else {
      console.log("✅ SMTP server ready");
    }
  });
}