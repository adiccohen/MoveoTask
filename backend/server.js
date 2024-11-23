const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const pool = require("./db"); // Ensure this file correctly initializes your database connection

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://moveofront.vercel.app", // Your frontend URL
    methods: ["GET", "POST"],
    credentials: true, // Optional: For cookies/auth headers
  },
});

// Store sessions and code blocks in memory
const sessions = {};
const codeBlocks = {};

// Middleware
app.use(cors({ 
  origin: "https://moveofront.vercel.app", // Allow frontend origin
  methods: ["GET", "POST"],
  credentials: true,
}));
app.use(express.json());

// Initialize code blocks from database
(async () => {
  try {
    const result = await pool.query("SELECT id, initial_code FROM code_blocks");
    result.rows.forEach((row) => {
      codeBlocks[row.id] = { code: row.initial_code }; // Use initial_code here
    });
    console.log("Code blocks initialized:", codeBlocks);
  } catch (err) {
    console.error("Error initializing code blocks:", err.message);
  }
})();

// API Routes
app.get("/code-blocks", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM code_blocks");
    res.json(result.rows); // Send all code blocks
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

app.get("/code-block/:id", async (req, res) => {
  const blockId = req.params.id;
  try {
    const result = await pool.query("SELECT * FROM code_blocks WHERE id = $1", [
      blockId,
    ]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]); // Send specific code block
    } else {
      res.status(404).send("Code block not found");
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// WebSocket Logic
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join-room", ({ blockId }) => {
    if (!sessions[blockId]) {
      sessions[blockId] = [];
    }

    socket.role = sessions[blockId].length === 0 ? "mentor" : "student";
    sessions[blockId].push(socket.id);
    socket.join(`room-${blockId}`);

    socket.emit("role", socket.role);
    io.to(`room-${blockId}`).emit("user-count", sessions[blockId].length);
  });

  socket.on("code-change", ({ blockId, newCode }) => {
    if (!codeBlocks[blockId]) {
      codeBlocks[blockId] = { code: "" };
    }

    codeBlocks[blockId].code = newCode;
    io.to(`room-${blockId}`).emit("update-code", newCode);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    for (const blockId in sessions) {
      sessions[blockId] = sessions[blockId].filter((id) => id !== socket.id);

      if (sessions[blockId].length === 0) {
        delete sessions[blockId];
      } else {
        io.to(`room-${blockId}`).emit("user-count", sessions[blockId].length);
      }
    }
  });
});

// Start Server
const PORT = process.env.PORT || 3001; // Use Railway's dynamic port or default to 3001
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
