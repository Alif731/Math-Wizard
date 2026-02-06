import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setCredentials } from "../store/slices/authSlice";
import "../sass/page/loginPage.scss";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // 1. Add state for password
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    // 2. Validation: Check both fields
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    // Dispatch credentials (username is crucial, password sent if backend needs it)
    dispatch(setCredentials({ username, password }));

    navigate("/");
  };

  return (
    <div className="login__main">
      <div className="login__container">
        <h1 className="login__container__header">Math Master</h1>
        <p>Enter your details to start the adventure!</p>

        <div className="login_container_image"></div>
        <div className="login__container__form">
          <form onSubmit={handleLogin} className="login-form">
            <div className="input__group">
              <input
                className="login__container__name"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
              />
            </div>

            <div className="input__group">
              <input
                className="login__container__password" // Reusing same class for consistent styling
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                style={{ marginTop: "10px" }} // Add generic spacing
              />
            </div>

            {error && (
              <p style={{ color: "red", marginTop: "10px" }}>{error}</p>
            )}

            <button type="submit" className="loginMain__btn">
              Submit
            </button>
          </form>
        </div>
      </div>
      <div className="login__container__image">Insert Image here</div>
    </div>
  );
};

export default Login;
