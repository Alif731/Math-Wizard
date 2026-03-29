import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setCredentials } from "../store/slices/authSlice";
import { useUpdateUserMutation } from "../store/slices/usersApiSlice";
import "../sass/page/resetPassword.scss";

const ResetPassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const hasPassword = Boolean(userInfo?.hasPassword);
  const [updateProfile, { isLoading }] = useUpdateUserMutation();
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();

    if ((!currentPassword && hasPassword) || !password || !confirmPassword) {
      setMessage("Please fill in all fields");
      setIsSuccess(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("New passwords do not match");
      setIsSuccess(false);
      return;
    }

    try {
      const res = await updateProfile({
        _id: userInfo._id,
        ...(hasPassword ? { currentPassword } : {}),
        password,
      }).unwrap();
      dispatch(setCredentials({ ...res }));
      setMessage(hasPassword ? "Password reset successfully!" : "Password created successfully!");
      setIsSuccess(true);
      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => navigate("/profile"), 2000);
    } catch (err) {
      setMessage(err?.data?.message || err.error);
      setIsSuccess(false);
    }
  };

  return (
    <div className="reset-password__main">
      <div className="reset-password__container">
        <p className="reset-password__eyebrow">Maths Wizard</p>
        <h1 className="reset-password__header">{hasPassword ? "Reset Password" : "Create Password"}</h1>
        <p className="reset-password__subtitle">
          {hasPassword
            ? "Please enter your current and new password below."
            : "Add a password below if you also want to sign in with your username and password."}
        </p>

        <form onSubmit={submitHandler} className="reset-password-form">
          {hasPassword && (
            <div className="input__group">
              <input
                type="password"
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
          )}

          <div className="input__group">
            <input
              type="password"
              placeholder={hasPassword ? "New Password" : "Create Password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="input__group">
            <input
              type="password"
              placeholder={hasPassword ? "Confirm New Password" : "Confirm Password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {message && (
            <p className={`reset-password__message ${isSuccess ? "success" : "error"}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            className="reset-password__btn"
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : hasPassword ? "Reset Password" : "Create Password"}
          </button>

          <p className="reset-password__back" onClick={() => navigate("/profile")}>
            Back to Profile
          </p>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
