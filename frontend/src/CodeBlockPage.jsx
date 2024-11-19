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
    return <div>Invalid code block. Please return to the <a href="/">lobby</a>.</div>;
  }

  // State variables
  const [role, setRole] = useState("");
  const [userCount, setUserCount] = useState(0);
  const [code, setCode] = useState("");
  const [solution, setSolution] = useState("");
  const [showSmiley, setShowSmiley] = useState(false);

  useEffect(() => {
    // Fetch the code block data, including the solution
    axios.get(`http://localhost:3001/code-block/${id}`)
      .then((res) => {
        setSolution(res.data.solution); // Assuming the solution is stored in the "solution" column
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

    return () => {
      // Cleanup: disconnect and remove listeners
      socket.off("role");
      socket.off("user-count");
      socket.off("update-code");
      socket.disconnect();
      console.log("Disconnected from the server.", socket.id);
    };
  }, [id, navigate]);

  // Redirect students if mentor leaves
  useEffect(() => {
    if (role === "student" && userCount === 1) {
      alert("Mentor has left the room. Redirecting to the lobby...");
      navigate("/");
    }
  }, [userCount, role, navigate]);

  const handleCodeChange = (newCode) => {
    setCode(newCode);

    // Access socket from ref and emit code changes
    if (socketRef.current) {
      socketRef.current.emit("code-change", { blockId: id, newCode });

      if (newCode.trim() === solution.trim()) {
        setShowSmiley(true);
      } else {
        setShowSmiley(false);
      }
    }
  };

  return (
    <div>
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
          value={code}
          onChange={handleCodeChange}
          options={{
            readOnly: role === "mentor",
            theme: "vs-dark",
          }}
        />
      </div>

      {showSmiley && (
        <div style={{ fontSize: "100px", textAlign: "center", color: "green" }}>
          😊
        </div>
      )}
    </div>
  );
};

export default CodeBlockPage;
