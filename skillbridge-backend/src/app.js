const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { errorHandler } = require("./middleware/error.middleware");

// Routes
const authRoutes = require("./routes/auth.routes");
const doubtRoutes = require("./routes/doubt.routes");
const answerRoutes = require("./routes/answer.routes");
const mentorRoutes = require("./routes/mentor.routes");
const bookingRoutes = require("./routes/booking.routes");
const aiRoutes = require("./routes/ai.routes");
const testRoutes = require("./routes/test.routes");

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/doubts", doubtRoutes);
app.use("/api/answers", answerRoutes);
app.use("/api/mentors", mentorRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/tests", testRoutes);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Error handling
app.use(errorHandler);

module.exports = app;
