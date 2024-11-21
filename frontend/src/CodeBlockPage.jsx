import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import MonacoEditor from "@monaco-editor/react";
import axios from "axios";
import "./CodeBlockPage.css"; // Add this line for external CSS

const CodeBlockPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  if (!id) {
    return (
      <div className="error-container">
        Invalid code block. Please return to the <a href="/">lobby</a>.
      </div>
    );
  }

  const [role, setRole] = useState("");
  const [userCount, setUserCount] = useState(0);
  const [code, setCode] = useState("");
  const [solution, setSolution] = useState("");
  const [showSmiley, setShowSmiley] = useState(false);

  useEffect(() => {
    axios
      .get(`http://localhost:3001/code-block/${id}`)
      .then((res) => {
        const { initial_code, solution: fetchedSolution } = res.data;
        setCode(initial_code || "");
        setSolution(fetchedSolution || "");
      })
      .catch((err) => {
        console.error("Error fetching the code block:", err);
        alert("Failed to load code block. Returning to the lobby...");
        navigate("/");
      });

    const socket = io("http://localhost:3001");
    socketRef.current = socket;

    socket.emit("join-room", { blockId: id });

    socket.on("role", (assignedRole) => {
      setRole(assignedRole);
    });

    socket.on("user-count", (count) => {
      setUserCount(count);
    });

    socket.on("update-code", (newCode) => {
      setCode(newCode);
    });

    socket.on("mentor-left", () => {
      alert("The mentor has left the room. Redirecting to the lobby...");
      navigate("/");
    });

    return () => {
      socket.disconnect();
    };
  }, [id, navigate]);

  const normalizeCode = (code) => code.replace(/\s+/g, "").trim();

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    if (socketRef.current) {
      socketRef.current.emit("code-change", { blockId: id, newCode });

      if (normalizeCode(newCode) === normalizeCode(solution)) {
        setShowSmiley(true);
      } else {
        setShowSmiley(false);
      }
    }
  };

  return (
    <div className="code-block-page">
      <h1 className="code-block-title">Code Block #{id}</h1>
      <div className="code-block-info">
        <p><strong>Role:</strong> {role || "Loading role..."}</p>
        <p><strong>Users in Room:</strong> {userCount}</p>
      </div>
      <div className="editor-container">
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
        <div className="smiley-overlay">😊</div>
      )}
    </div>
  );
};

export default CodeBlockPage;
