import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Lobby = () => {
  const [blocks, setBlocks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://localhost:3001/code-blocks").then((res) => {
      setBlocks(res.data);
    });
  }, []);

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