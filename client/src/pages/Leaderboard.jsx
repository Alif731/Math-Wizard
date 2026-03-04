import { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  useGetLeaderboardStatusQuery,
  useGetLeaderboardQuery,
  useUpdateLeaderboardStatusMutation,
} from "../store/slices/leaderboardApiSlice";
import "../sass/page/leaderboardPage.scss";

const Leaderboard = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const isTeacher = userInfo?.role === "teacher";

  const {
    data: statusData,
    isLoading: isStatusLoading,
    isError: isStatusError,
    error: statusError,
  } = useGetLeaderboardStatusQuery();

  const [updateLeaderboardStatus, { isLoading: isToggling }] = useUpdateLeaderboardStatusMutation();

  const isEnabled = Boolean(statusData?.enabled);
  const shouldFetchLeaderboard = useMemo(
    () => Boolean(statusData) && (isEnabled || isTeacher),
    [statusData, isEnabled, isTeacher],
  );

  const {
    data: leaderboardData,
    isLoading: isLeaderboardLoading,
    isError: isLeaderboardError,
    error: leaderboardError,
  } = useGetLeaderboardQuery(20, { skip: !shouldFetchLeaderboard });

  const toggleLeaderboard = async () => {
    if (!isTeacher || isToggling) return;
    await updateLeaderboardStatus(!isEnabled).unwrap();
  };

  return (
    <div className="leaderboard-page">
      <header className="leaderboard-header">
        <h1>Leaderboard</h1>
        <p>Friendly competition powered by teacher controls.</p>
      </header>

      {isStatusLoading ? (
        <div className="leaderboard-card">Loading leaderboard settings...</div>
      ) : isStatusError ? (
        <div className="leaderboard-card error">
          {statusError?.data?.message || "Failed to load leaderboard settings"}
        </div>
      ) : (
        <>
          <section className="leaderboard-card settings">
            <div>
              <strong>Status:</strong>{" "}
              <span className={isEnabled ? "enabled" : "disabled"}>
                {isEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>

            {isTeacher && (
              <button className="leaderboard-toggle-btn" onClick={toggleLeaderboard} disabled={isToggling}>
                {isToggling ? "Updating..." : isEnabled ? "Disable Leaderboard" : "Enable Leaderboard"}
              </button>
            )}
          </section>

          {!isEnabled && !isTeacher ? (
            <div className="leaderboard-card">
              Leaderboard is currently disabled by your teacher.
            </div>
          ) : isLeaderboardLoading ? (
            <div className="leaderboard-card">Loading rankings...</div>
          ) : isLeaderboardError ? (
            <div className="leaderboard-card error">
              {leaderboardError?.data?.message || "Failed to load leaderboard"}
            </div>
          ) : (
            <section className="leaderboard-card">
              <h2>Top Students</h2>
              {leaderboardData?.entries?.length ? (
                <div className="leaderboard-table-wrapper">
                  <table className="leaderboard-table">
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
                      {leaderboardData.entries.map((entry) => (
                        <tr key={entry.userId}>
                          <td>#{entry.rank}</td>
                          <td className="student-cell">
                            <span className="avatar">{entry.avatar || "🐱"}</span>
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
                <p className="empty-state">No attempts yet. Start solving problems to appear here.</p>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default Leaderboard;
