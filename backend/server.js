const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const sessions = {};
const pool = require("./db");
const codeBlocks = {};

// Initialize code blocks from the database
(async () => {
  try {
    const result = await pool.query("SELECT id, initial_code FROM code_blocks");
    result.rows.forEach((row) => {
      codeBlocks[row.id] = { code: row.initial_code };
    });
  } catch (err) {
    console.error("Error initializing code blocks:", err.message);
  }
})();

app.use(cors());
app.use(express.json());

// Endpoint to get all code blocks
app.get("/code-blocks", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM code_blocks");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Endpoint to get a specific code block by ID
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

io.on("connection", (socket) => {
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
    for (const blockId in sessions) {
      const userIndex = sessions[blockId].indexOf(socket.id);

      if (userIndex !== -1) {
        const wasMentor = socket.role === "mentor";
        sessions[blockId].splice(userIndex, 1);

        if (wasMentor) {
          io.to(`room-${blockId}`).emit("mentor-left");
          delete sessions[blockId];
        } else {
          io.to(`room-${blockId}`).emit("user-count", sessions[blockId].length);
        }
        break;
      }
    }
  });
});

const PORT = 3001;
server.listen(PORT);
