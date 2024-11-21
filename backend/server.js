const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Dynamic frontend URL
    methods: ["GET", "POST"],
  },
});

const sessions = {}; // Tracks users in each room
const pool = require("./db"); // Database pool setup
const codeBlocks = {};

// Initialize code blocks from the database
(async () => {
  try {
    const result = await pool.query("SELECT id, initial_code FROM code_blocks");
    result.rows.forEach((row) => {
      codeBlocks[row.id] = { code: row.initial_code };
    });
    console.log("Code blocks initialized:", codeBlocks);
  } catch (err) {
    console.error("Error initializing code blocks:", err.message);
  }
})();

// Use CORS and parse JSON requests
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Dynamic frontend URL
  })
);
app.use(express.json());

// Fetch all code blocks from the PostgreSQL database
app.get("/code-blocks", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM code_blocks");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Fetch a specific code block from the PostgreSQL database
app.get("/code-block/:id", async (req, res) => {
  const blockId = req.params.id;
  try {
    const result = await pool.query("SELECT * FROM code_blocks WHERE id = $1", [
      blockId,
    ]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).send("Code block not found");
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// WebSocket logic
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join-room", ({ blockId }) => {
    // Initialize room if it doesn't exist
    if (!sessions[blockId]) {
      sessions[blockId] = [];
    }

    // Assign role
    socket.role = sessions[blockId].length === 0 ? "mentor" : "student";

    sessions[blockId].push(socket.id);
    socket.join(`room-${blockId}`);

    // Send role to the client
    socket.emit("role", socket.role);
    console.log(`Assigned role: ${socket.role} to socket ${socket.id}`);

    // Broadcast user count to the room
    io.to(`room-${blockId}`).emit("user-count", sessions[blockId].length);
  });

  socket.on("code-change", ({ blockId, newCode }) => {
    if (!codeBlocks[blockId]) {
      codeBlocks[blockId] = { code: "" }; // Initialize block if it doesn't exist
    }

    codeBlocks[blockId].code = newCode; // Update the code in memory
    io.to(`room-${blockId}`).emit("update-code", newCode); // Broadcast to all users in the room
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    for (const blockId in sessions) {
      sessions[blockId] = sessions[blockId].filter((id) => id !== socket.id);

      // Clean up empty room
      if (sessions[blockId].length === 0) {
        delete sessions[blockId];
      } else {
        io.to(`room-${blockId}`).emit("user-count", sessions[blockId].length);
      }
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3001; // Use dynamic port for deployment
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
