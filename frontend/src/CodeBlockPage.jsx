import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import MonacoEditor from "@monaco-editor/react";
import axios from "axios";

const CodeBlockPage = () => {
  const { id } = useParams(); // Get the code block ID from the URL parameters
  const navigate = useNavigate();
  const socketRef = useRef(null); // Reference to the socket connection

  if (!id) {
    // If no ID is provided, show an error message and a link to return to the lobby
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        Invalid code block. Please return to the <a href="/">lobby</a>.
      </div>
    );
  }

  const [role, setRole] = useState("");
  const [userCount, setUserCount] = useState(0);
  const [code, setCode] = useState(""); 
  const [solution, setSolution] = useState("");
  const [showSmiley, setShowSmiley] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(null);

  useEffect(() => {
    // Fetch the initial code block data from the server
    axios
      .get(`http://localhost:3001/code-block/${id}`)
      .then((res) => {
        const { initial_code, solution: fetchedSolution } = res.data;
        setCode(initial_code || ""); 
        setSolution(fetchedSolution || ""); 
        setStartTime(Date.now()); // Set the start time for the coding session
      })
      .catch((err) => {
        console.error("Error fetching the code block:", err);
        alert("Failed to load code block. Returning to the lobby...");
        navigate("/");
      });

    // Establish a socket connection to the server
    const socket = io("http://localhost:3001"); 
    socketRef.current = socket;

    // Join the specific code block room
    socket.emit("join-room", { blockId: id });

    // Listen for role assignment from the server
    socket.on("role", (assignedRole) => {
      setRole(assignedRole);
    });

    // Listen for updates on the number of users in the room
    socket.on("user-count", (count) => {
      setUserCount(count);
    });

    // Listen for code updates from other users
    socket.on("update-code", (newCode) => {
      setCode(newCode);
    });

    // Handle the event when the mentor leaves the room
    socket.on("mentor-left", () => {
      alert("The mentor has left the room. Redirecting to the lobby...");
      navigate("/");
    });

    return () => {
      // Clean up socket event listeners and disconnect on component unmount
      socket.off("role");
      socket.off("user-count");
      socket.off("update-code");
      socket.off("mentor-left");
      socket.disconnect();
    };
  }, [id, navigate]);

  // Normalize code by removing whitespace and trimming
  const normalizeCode = (code) => {
    return code.replace(/\s+/g, "").trim(); 
  };

  // Handle code changes in the editor
  const handleCodeChange = (newCode) => {
    setCode(newCode);

    if (socketRef.current) {
      // Emit the code change to the server
      socketRef.current.emit("code-change", { blockId: id, newCode });

      // Check if the new code matches the solution
      if (normalizeCode(newCode) === normalizeCode(solution)) {
        setShowSmiley(true);
        setElapsedTime(((Date.now() - startTime) / 1000).toFixed(2)); // Calculate elapsed time in seconds
      } else {
        setShowSmiley(false);
      }
    }
  };

  return (
    <div style={{ position: "relative", height: "100vh", width: "100vw" }}>
      <h1>Code Block #{id}</h1>
      <p>
        <strong>Role:</strong> {role || "Loading role..."}
      </p>
      <p>
        <strong>Users in Room:</strong> {userCount}
      </p>

      <div style={{ margin: "20px 0", height: "calc(100% - 160px)" }}>
        <MonacoEditor
          height="100%"
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
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "100px",
            textAlign: "center",
            color: "green",
            zIndex: 10, 
          }}
        >
          😊
          <p style={{ fontSize: "20px" }}>Time taken: {elapsedTime} seconds</p>
        </div>
      )}
    </div>
  );
};

export default CodeBlockPage;