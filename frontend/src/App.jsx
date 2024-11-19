import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Lobby from "./LobbyPage";
import CodeBlock from "./CodeBlockPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/code-block/:id" element={<CodeBlock />} />
      </Routes>
    </Router>
  );
}

export default App;
