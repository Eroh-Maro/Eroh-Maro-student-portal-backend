import nodemailer from "nodemailer";

export const sendOTP = async (to, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: "Student Portal Verification Code",
      text: `Your OTP code is: ${otp}`,
    });

    console.log("📧 OTP email sent to:", to);
  } catch (err) {
    console.error("❌ Email send error:", err.message);
    throw err; // let route handle it
  }
};