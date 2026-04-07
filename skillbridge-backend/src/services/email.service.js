const EmailQueue = require("../models/EmailQueue");

async function queueEmail({ to, subject, html, scheduledAt = new Date() }) {
  return await EmailQueue.create({ to, subject, html, scheduledAt });
}

// Templates
function doubtAnsweredEmail({ doubtTitle, answerAuthor, doubtLink }) {
  return {
    subject: `Your doubt got an answer 🎓`,
    html: `<p>Hi,</p><p><strong>${answerAuthor}</strong> answered your doubt: <em>${doubtTitle}</em>.</p>
           <p><a href="${doubtLink}">View the answer</a></p>`
  };
}

function bookingConfirmedEmail({ mentorName, date, time, meetingLink }) {
  return {
    subject: `Session confirmed with ${mentorName}`,
    html: `<p>Your session with <strong>${mentorName}</strong> is confirmed for <strong>${date} at ${time}</strong>.</p>
           <p>Meeting link: <a href="${meetingLink}">${meetingLink}</a></p>`
  };
}

module.exports = { queueEmail, doubtAnsweredEmail, bookingConfirmedEmail };
