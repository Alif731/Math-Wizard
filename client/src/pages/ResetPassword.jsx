import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useUpdateUserMutation } from "../store/slices/usersApiSlice";
import "../sass/page/resetPassword.scss";

const ResetPassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { userInfo } = useSelector((state) => state.auth);
  const [updateProfile, { isLoading }] = useUpdateUserMutation();
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!currentPassword || !password || !confirmPassword) {
      setMessage("Please fill in all fields");
      setIsSuccess(false);
      return;
    }
    if (password !== confirmPassword) {
      setMessage("New passwords do not match");
      setIsSuccess(false);
    } else {
      try {
        await updateProfile({
          _id: userInfo._id,
          currentPassword,
          password,
        }).unwrap();
        setMessage("Password reset successfully!");
        setIsSuccess(true);
        setCurrentPassword("");
        setPassword("");
        setConfirmPassword("");
        setTimeout(() => navigate("/profile"), 2000);
      } catch (err) {
        setMessage(err?.data?.message || err.error);
        setIsSuccess(false);
      }
    }
  };

  return (
    <div className="reset-password__main">
      <div className="reset-password__container">
        <p className="reset-password__eyebrow">Maths Wizard</p>
        <h1 className="reset-password__header">Reset Password</h1>
        <p className="reset-password__subtitle">
          Please enter your current and new password below.
        </p>

        <form onSubmit={submitHandler} className="reset-password-form">
          <div className="input__group">
            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className="input__group">
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="input__group">
            <input
              type="password"
              placeholder="Confirm New Password"
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
            {isLoading ? "Updating..." : "Reset Password"}
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
