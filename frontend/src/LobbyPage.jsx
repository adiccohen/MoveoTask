import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Lobby = () => {
  const [blocks, setBlocks] = useState([]);
  const navigate = useNavigate();

  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    // Use the base URL for API calls
    axios
      .get(`${apiUrl}/code-blocks`)
      .then((res) => {
        setBlocks(res.data);
      })
      .catch((error) => {
        console.error("Error fetching code blocks:", error);
      });
  }, [apiUrl]);

  return (
    <div>
      <h1>Choose a Code Block</h1>
      <ul>
        {blocks.map((block) => (
          <li
            key={block.id}
            onClick={() => navigate(`/code-block/${block.id}`)} // Ensure block.id is not null
            style={{ cursor: "pointer", padding: "10px", background: "#ddd", margin: "5px" }}
          >
            {block.title}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Lobby;

