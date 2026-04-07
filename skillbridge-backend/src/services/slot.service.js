const MentorSlot = require("../models/MentorSlot");

async function generateSlots({ mentorId, date, durationMinutes = 30, startTime = "09:00", endTime = "17:00" }) {
  const slots = [];
  let current = new Date(`${date}T${startTime}:00`);
  const end = new Date(`${date}T${endTime}:00`);

  while (current < end) {
    const slotEnd = new Date(current.getTime() + durationMinutes * 60000);
    
    // Check if slot already exists
    const exists = await MentorSlot.exists({
        mentorId,
        startAt: current
    });

    if (!exists) {
        slots.push({
            mentorId,
            startAt: new Date(current),
            endAt: slotEnd,
            status: 'open'
        });
    }

    current = slotEnd;
  }

  if (slots.length > 0) {
    await MentorSlot.insertMany(slots);
  }
  return slots;
}

module.exports = { generateSlots };
