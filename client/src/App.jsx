import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import LoggedIn from "./pages/LoggedIn.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/loggedin" element={<LoggedIn />} />
    </Routes>
  );
}

export default App;