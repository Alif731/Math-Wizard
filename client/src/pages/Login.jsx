import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setCredentials } from "../store/slices/authSlice";
import { useLoginMutation, useRegisterMutation } from "../store/slices/usersApiSlice";
import { apiSlice } from "../store/slices/apiSlice";
import { cleanupLegacySessionStorage } from "../utils/cleanupLegacySessionStorage";
import "../sass/page/loginPage.scss";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [register, { isLoading: isRegisterLoading }] = useRegisterMutation();

  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    if (userInfo) {
      navigate("/home");
    }
  }, [navigate, userInfo]);

  const handleModeToggle = () => {
    setIsLogin((prev) => !prev);
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    try {
      const res = await login({ username, password }).unwrap();
      cleanupLegacySessionStorage();
      dispatch(apiSlice.util.resetApiState()); // Clear any old cache
      dispatch(setCredentials({ ...res }));
      navigate("/home");
    } catch (err) {
      setError(err?.data?.message || err.error || "Login failed");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const res = await register({ username, password }).unwrap();
      cleanupLegacySessionStorage();
      dispatch(apiSlice.util.resetApiState()); // Clear any old cache
      dispatch(setCredentials({ ...res }));
      navigate("/home");
    } catch (err) {
      setError(err?.data?.message || err.error || "Registration failed");
    }
  };

  return (
    <div className="login__main">
      <div className="login__container">
        <p className="login__eyebrow">Maths Wizard</p>
        <h1 className="login__container__header">Math Master</h1>
        <p className="login__subtitle">
          {isLogin
            ? "Welcome back. Ready for more math challenges?"
            : "Create your account and start your math journey."}
        </p>

        <div className="login__modeSwitch">
          <button
            type="button"
            className={`login__modeBtn ${isLogin ? "active" : ""}`}
            onClick={() => {
              if (!isLogin) handleModeToggle();
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={`login__modeBtn ${!isLogin ? "active" : ""}`}
            onClick={() => {
              if (isLogin) handleModeToggle();
            }}
          >
            Sign Up
          </button>
        </div>

        <div className="login__container__form">
          <form onSubmit={isLogin ? handleLogin : handleRegister} className="login-form">
            <div className="input__group">
              <input
                className="login__container__name"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="input__group">
              <input
                className="login__container__password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {!isLogin && (
              <div className="input__group">
                <input
                  className="login__container__password"
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            {error && <p className="login__error">{error}</p>}

            <button
              type="submit"
              className="loginMain__btn"
              disabled={isLoginLoading || isRegisterLoading}
            >
              {isLoginLoading || isRegisterLoading
                ? "Loading..."
                : isLogin
                  ? "Login"
                  : "Sign Up"}
            </button>

            <p className="login__toggle" onClick={handleModeToggle}>
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
