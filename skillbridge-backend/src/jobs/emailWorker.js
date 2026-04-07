require("dotenv").config();
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const EmailQueue = require("../models/EmailQueue");
const connectDB = require("../config/db");

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

async function processQueue() {
  const emails = await EmailQueue.find({
    status: 'pending',
    scheduledAt: { $lte: new Date() },
    retries: { $lt: 3 }
  }).limit(10);

  for (const email of emails) {
    try {
      await transporter.sendMail({ 
        from: '"SkillBridge" <no-reply@skillbridge.edu>',
        to: email.to, 
        subject: email.subject, 
        html: email.html 
      });
      await EmailQueue.findByIdAndUpdate(email._id, { 
        status: 'sent', 
        sentAt: new Date() 
      });
      console.log(`Email sent to ${email.to}`);
    } catch (err) {
      console.error(`Email failed to ${email.to}:`, err.message);
      await EmailQueue.findByIdAndUpdate(email._id, { 
        $inc: { retries: 1 }, 
        status: email.retries >= 2 ? 'failed' : 'pending' 
      });
    }
  }
}

connectDB().then(() => {
    console.log("Email Worker Started...");
    setInterval(processQueue, 30000);
});
