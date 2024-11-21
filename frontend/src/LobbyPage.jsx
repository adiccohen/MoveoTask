import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Lobby.css";

const Lobby = () => {
  const [blocks, setBlocks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://localhost:3001/code-blocks").then((res) => {
      setBlocks(res.data);
    });
  }, []);

  return (
    <div className="lobby-container">
      <div className="lobby-content">
        <h1 className="lobby-title">Choose a Code Block</h1>
        <ul className="lobby-list">
          {blocks.map((block) => (
            <li
              key={block.id}
              className="lobby-list-item"
              onClick={() => navigate(`/code-block/${block.id}`)}
            >
              {block.title}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Lobby;