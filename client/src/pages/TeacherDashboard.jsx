import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  useGetLeaderboardQuery,
  useGetLeaderboardStatusQuery,
  useUpdateLeaderboardStatusMutation,
} from "../store/slices/leaderboardApiSlice";
import "../sass/page/teacherDashboardPage.scss";

const TeacherDashboard = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [actionError, setActionError] = useState("");
  const {
    data: statusData,
    isLoading: isStatusLoading,
    isError: isStatusError,
    error: statusError,
  } = useGetLeaderboardStatusQuery();
  const [updateLeaderboardStatus, { isLoading: isToggling }] = useUpdateLeaderboardStatusMutation();
  const {
    data: leaderboardData,
    isLoading: isLeaderboardLoading,
    isError: isLeaderboardError,
    error: leaderboardError,
  } = useGetLeaderboardQuery(5, { skip: !statusData });

  const isEnabled = Boolean(statusData?.enabled);
  const entries = leaderboardData?.entries || [];
  const totalAttempts = entries.reduce((sum, entry) => sum + entry.totalAttempts, 0);
  const totalCorrect = entries.reduce((sum, entry) => sum + entry.correctAttempts, 0);
  const averageAccuracy = entries.length
    ? Number((entries.reduce((sum, entry) => sum + entry.accuracy, 0) / entries.length).toFixed(1))
    : 0;

  const toggleLeaderboard = async () => {
    if (isToggling) {
      return;
    }

    setActionError("");

    try {
      await updateLeaderboardStatus(!isEnabled).unwrap();
    } catch (error) {
      setActionError(error?.data?.message || "Failed to update leaderboard status");
    }
  };

  return (
    <div className="teacher-dashboard">
      <header className="teacher-dashboard__hero">
        <div>
          <p className="teacher-dashboard__eyebrow">Teacher Portal</p>
          <h1>Welcome back, {userInfo?.username}</h1>
          <p>
            Monitor classroom performance and control when the leaderboard is visible to students.
          </p>
        </div>

        <Link to="/leaderboard" className="teacher-dashboard__secondaryAction">
          Open Leaderboard
        </Link>
      </header>

      {isStatusLoading ? (
        <section className="teacher-dashboard__panel">Loading classroom controls...</section>
      ) : isStatusError ? (
        <section className="teacher-dashboard__panel teacher-dashboard__panel--error">
          {statusError?.data?.message || "Failed to load teacher dashboard"}
        </section>
      ) : (
        <>
          <section className="teacher-dashboard__grid">
            <article className="teacher-dashboard__stat">
              <span>Leaderboard</span>
              <strong>{isEnabled ? "Enabled" : "Disabled"}</strong>
              <small>{isEnabled ? "Students can view rankings" : "Visible only to teachers"}</small>
            </article>

            <article className="teacher-dashboard__stat">
              <span>Students Ranked</span>
              <strong>{entries.length}</strong>
              <small>Students with recorded attempts</small>
            </article>

            <article className="teacher-dashboard__stat">
              <span>Total Attempts</span>
              <strong>{totalAttempts}</strong>
              <small>Across the previewed leaderboard</small>
            </article>

            <article className="teacher-dashboard__stat">
              <span>Average Accuracy</span>
              <strong>{averageAccuracy}%</strong>
              <small>Based on current ranked students</small>
            </article>
          </section>

          <section className="teacher-dashboard__panel teacher-dashboard__panel--split">
            <div>
              <h2>Classroom controls</h2>
              <p>
                {isEnabled
                  ? "The leaderboard is live for students right now."
                  : "The leaderboard is hidden from students until you turn it back on."}
              </p>
              <p className="teacher-dashboard__meta">
                Tracked correct answers from ranked students: {totalCorrect}
              </p>
              {actionError && <p className="teacher-dashboard__inlineError">{actionError}</p>}
            </div>

            <button
              type="button"
              className="teacher-dashboard__action"
              onClick={toggleLeaderboard}
              disabled={isToggling}
            >
              {isToggling ? "Updating..." : isEnabled ? "Disable Leaderboard" : "Enable Leaderboard"}
            </button>
          </section>

          {isLeaderboardLoading ? (
            <section className="teacher-dashboard__panel">Loading top students...</section>
          ) : isLeaderboardError ? (
            <section className="teacher-dashboard__panel teacher-dashboard__panel--error">
              {leaderboardError?.data?.message || "Failed to load leaderboard preview"}
            </section>
          ) : (
            <section className="teacher-dashboard__panel">
              <div className="teacher-dashboard__panelHeader">
                <div>
                  <h2>Top students</h2>
                  <p>Quick classroom snapshot based on the latest attempt data.</p>
                </div>

                <Link to="/leaderboard" className="teacher-dashboard__inlineLink">
                  View full leaderboard
                </Link>
              </div>

              {entries.length ? (
                <div className="teacher-dashboard__tableWrapper">
                  <table className="teacher-dashboard__table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Student</th>
                        <th>Correct</th>
                        <th>Attempts</th>
                        <th>Accuracy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => (
                        <tr key={entry.userId}>
                          <td>#{entry.rank}</td>
                          <td className="teacher-dashboard__studentCell">
                            <span className="teacher-dashboard__avatar">{entry.avatar || "🐱"}</span>
                            <span>{entry.username}</span>
                          </td>
                          <td>{entry.correctAttempts}</td>
                          <td>{entry.totalAttempts}</td>
                          <td>{entry.accuracy}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="teacher-dashboard__empty">
                  No student attempts yet. Once students begin solving problems, their results will appear here.
                </p>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default TeacherDashboard;
