import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");

  const handleLogin = () => {
    // Ideally, you would save the user to a Context or LocalStorage here
    localStorage.setItem("user", username);
    navigate("/map"); // Move to the Map screen
  };

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>Math Master AI</h1>
      <input
        type="text"
        placeholder="Enter your name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ padding: "10px", fontSize: "16px" }}
      />
      <br />
      <br />
      <button onClick={handleLogin} style={{ padding: "10px 20px" }}>
        Start Learning
      </button>
    </div>
  );
};

export default Login;
