import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import MonacoEditor from "@monaco-editor/react";
import axios from "axios";

const CodeBlockPage = () => {
  const { id } = useParams(); // Get ID from URL
  const navigate = useNavigate();
  const socketRef = useRef(null); // Store socket instance in a ref

  // Check if the ID is valid
  if (!id) {
    return (
      <div>
        Invalid code block. Please return to the <a href="/">lobby</a>.
      </div>
    );
  }

  // State variables
  const [role, setRole] = useState("");
  const [userCount, setUserCount] = useState(0);
  const [code, setCode] = useState(""); // Updated to fetch and display initial_code
  const [solution, setSolution] = useState("");
  const [showSmiley, setShowSmiley] = useState(false);

  useEffect(() => {
    // Fetch the code block data, including initial_code and the solution
    axios
      .get(`http://localhost:3001/code-block/${id}`)
      .then((res) => {
        const { initial_code, solution: fetchedSolution } = res.data;
        setCode(initial_code || ""); // Set the editor's initial code
        setSolution(fetchedSolution || ""); // Set the solution
      })
      .catch((err) => {
        console.error("Error fetching the code block:", err);
        alert("Failed to load code block. Returning to the lobby...");
        navigate("/");
      });

    const socket = io("http://localhost:3001"); // Initialize socket instance
    socketRef.current = socket; // Assign to ref for global access

    // Join room and listen for updates
    socket.emit("join-room", { blockId: id });

    socket.on("role", (assignedRole) => {
      setRole(assignedRole);
      console.log(`Assigned role: ${assignedRole}`);
    });

    socket.on("user-count", (count) => {
      setUserCount(count);
    });

    socket.on("update-code", (newCode) => {
      setCode(newCode);
    });

    // Listen for mentor leaving the room
    socket.on("mentor-left", () => {
      alert("The mentor has left the room. Redirecting to the lobby...");
      navigate("/");
    });

    return () => {
      // Cleanup: disconnect and remove listeners
      socket.off("role");
      socket.off("user-count");
      socket.off("update-code");
      socket.off("mentor-left");
      socket.disconnect();
      console.log("Disconnected from the server.", socket.id);
    };
  }, [id, navigate]);

  // Normalize code for consistent comparison
  const normalizeCode = (code) => {
    return code.replace(/\s+/g, "").trim(); // Remove extra whitespace
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);

    // Access socket from ref and emit code changes
    if (socketRef.current) {
      socketRef.current.emit("code-change", { blockId: id, newCode });

      // Compare normalized code
      if (normalizeCode(newCode) === normalizeCode(solution)) {
        setShowSmiley(true);
      } else {
        setShowSmiley(false);
      }
    }
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <h1>Code Block #{id}</h1>
      <p>
        <strong>Role:</strong> {role || "Loading role..."}
      </p>
      <p>
        <strong>Users in Room:</strong> {userCount}
      </p>

      <div style={{ margin: "20px 0" }}>
        <MonacoEditor
          height="400px"
          language="javascript"
          value={code} // Use the fetched initial code
          onChange={handleCodeChange}
          options={{
            readOnly: role === "mentor",
            theme: "vs-dark",
          }}
        />
      </div>

      {showSmiley && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "100px",
            textAlign: "center",
            color: "green",
            zIndex: 10, // Ensure it stays on top
          }}
        >
          😊
        </div>
      )}
    </div>
  );
};

export default CodeBlockPage;