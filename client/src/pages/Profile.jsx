import React, { useEffect, useState } from "react";
import Dashboard from "../components/Dashboard";
import { useGetUserStatusQuery } from "../store/slices/gameApiSlice";
import { useSelector, useDispatch } from "react-redux";
import {
  useUpdateUserMutation,
  useGetRecentActivityQuery,
} from "../store/slices/usersApiSlice";
import { setCredentials } from "../store/slices/authSlice";
import { useNavigate } from "react-router-dom";
import "../sass/page/profilePage.scss";

const AVATARS = [
  "🐱",
  "🐶",
  "🦊",
  "🐻",
  "🐼",
  "🦁",
  "🐯",
  "🤖",
  "🚀",
  "⭐",
  "🌈",
  "🍦",
];

export default function Profile() {
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("🐱");
  const [message, setMessage] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const currentUsername = userInfo?.username;
  const hasPassword = Boolean(userInfo?.hasPassword);
  const isGooglePrimary = userInfo?.authProvider === "google";

  const { data: status } = useGetUserStatusQuery(currentUsername, {
    skip: !currentUsername,
  });
  const { data: recentActivity, isLoading: loadingActivity } =
    useGetRecentActivityQuery();
  const [updateProfile, { isLoading }] = useUpdateUserMutation();

  useEffect(() => {
    if (userInfo) {
      setUsername(userInfo.username);
      setSelectedAvatar(userInfo.avatar || "🐱");
    }
  }, [userInfo]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await updateProfile({
        _id: userInfo._id,
        username,
        avatar: selectedAvatar,
      }).unwrap();
      dispatch(setCredentials({ ...res }));
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage(err?.data?.message || err.error);
    }
  };

  return (
    <div className="profile-page">
      <header className="game-header-profile">
        <div className="player-badge-profile highlight2">
          <span className="highlight1">S</span>tudent{" "}
          <span className="highlight2">P</span>rofile: {currentUsername}
          <span className="avatar-preview" style={{ marginRight: "10px" }}>
            {selectedAvatar}
          </span>
        </div>
      </header>

      <main className="profile-layout">
        <div className="profile-main-content">
          <section className="profile-section">
            <h2 className="profile-section-title">Learning Summary</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Role</span>
                <span className="stat-value">{userInfo?.role}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Unlocked</span>
                <span className="stat-value">
                  {status
                    ? Object.values(status.mastery).filter(
                        (m) => m.status !== "locked",
                      ).length
                    : 0}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Mastered</span>
                <span className="stat-value">
                  {status
                    ? Object.values(status.mastery).filter(
                        (m) => m.status === "mastered",
                      ).length
                    : 0}
                </span>
              </div>
            </div>
          </section>

          <section className="profile-section">
            <h2 className="profile-section-title">Recent Activity</h2>
            {loadingActivity ? (
              <p>Loading activity...</p>
            ) : (
              <div className="activity-list">
                {recentActivity && recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity._id} className="activity-item">
                      <span
                        className={`status-dot ${activity.isCorrect ? "correct" : "incorrect"}`}
                      ></span>
                      <span className="activity-text">
                        Solved{" "}
                        <strong>{activity.conceptId.replace(/_/g, " ")}</strong>{" "}
                        problem
                      </span>
                      <span className="activity-date">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p>
                    No recent activity found. Start learning to see your
                    progress!
                  </p>
                )}
              </div>
            )}
          </section>

          <div className="profile-settings-row">
            <section className="profile-section avatar-card">
              <h2 className="profile-section-title">Choose Your Avatar</h2>
              <div className="avatar-grid">
                {AVATARS.map((avatar) => (
                  <div
                    key={avatar}
                    className={`avatar-option ${selectedAvatar === avatar ? "selected" : ""}`}
                    onClick={() => setSelectedAvatar(avatar)}
                  >
                    {avatar}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                <button
                  className="profile-btn"
                  onClick={handleUpdateProfile}
                  disabled={isLoading || selectedAvatar === userInfo?.avatar}
                >
                  Confirm Avatar Change
                </button>
              </div>
            </section>

            <section className="profile-section account-card">
              <h2 className="profile-section-title">Account Settings</h2>
              {message && (
                <p
                  className={`profile-message ${message.includes("successfully") ? "success" : "error"}`}
                >
                  {message}
                </p>
              )}
              {isGooglePrimary && (
                <p className="profile-auth-note">
                  Signed in with Google
                  {userInfo?.email ? ` as ${userInfo.email}` : ""}.{" "}
                  {hasPassword
                    ? "You can use Google or your password when you come back."
                    : "Add a password below if you also want to sign in with your username."}
                </p>
              )}
              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="input__group">
                  <label>Username</label>
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="profile-btn"
                  disabled={isLoading || username === userInfo?.username}
                >
                  {isLoading ? "Updating..." : "Update Username"}
                </button>
              </form>
              <p
                className="password-link"
                onClick={() => navigate("/reset-password")}
              >
                {hasPassword
                  ? "Need to change your password?"
                  : "Want to add a password for direct sign-in?"}{" "}
                <span className="highlight-text">
                  {hasPassword ? "Reset Password" : "Create Password"}
                </span>
              </p>
            </section>
          </div>
        </div>

        <aside className="sidebar-section">
          <Dashboard status={status} />
        </aside>
      </main>
    </div>
  );
}
