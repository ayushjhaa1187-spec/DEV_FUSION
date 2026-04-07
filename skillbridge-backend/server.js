require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { setIO } = require("./src/config/socket");

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: { 
    origin: process.env.CLIENT_URL || "http://localhost:3000", 
    credentials: true 
  }
});

io.on("connection", (socket) => {
  // Plan: userId is in handshake auth
  const userId = socket.handshake.auth?.userId;
  if (userId) {
    socket.join(`user:${userId}`);
    console.log(`User connected: ${userId}`);
  }

  socket.on("disconnect", () => {
    if (userId) console.log(`User disconnected: ${userId}`);
  });
});

// Inject IO into services
setIO(io);

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
