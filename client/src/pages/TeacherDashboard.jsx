import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  CheckCircle2,
  XCircle,
  Trophy,
  Activity,
  Eye,
  EyeOff,
  BarChart3,
  Users, // For Students
  Calculator, // For Math Attempts
  Target, // For Accuracy
  Award, // For Leaderboard status
  SlidersHorizontal, // For Controls
} from "lucide-react";

// API Slices
import {
  useGetLeaderboardQuery,
  useGetLeaderboardStatusQuery,
  useUpdateLeaderboardStatusMutation,
} from "../store/slices/leaderboardApiSlice";
import { useGetRecentActivityQuery } from "../store/slices/usersApiSlice";

// Styling
import "../sass/page/teacherDashboardPage.scss";

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState("performance"); // Tab state: 'activity' or 'rankings'
  const [actionError, setActionError] = useState("");

  // 1. User & Role Context
  const { userInfo } = useSelector((state) => state.auth);
  const isTeacher = userInfo?.role === "teacher";
  const displayUsername = userInfo?.username || "Teacher";

  // 2. Data Fetching - Activity Feed (Polls every 3s)
  const { data: recentActivity, isLoading: loadingActivity } =
    useGetRecentActivityQuery(undefined, { pollingInterval: 3000 });

  // 3. Data Fetching - Leaderboard Status
  const {
    data: statusData,
    isLoading: isStatusLoading,
    isError: isStatusError,
    error: statusError,
  } = useGetLeaderboardStatusQuery();

  // 4. Mutation - Toggle Leaderboard
  const [updateLeaderboardStatus, { isLoading: isToggling }] =
    useUpdateLeaderboardStatusMutation();

  // 5. Data Fetching - Top 5 for Preview (Skips if status is loading)
  const { data: leaderboardData, isLoading: isLeaderboardLoading } =
    useGetLeaderboardQuery(5, { skip: !statusData });

  // --- Logic & Calculations ---
  const isEnabled = Boolean(statusData?.enabled);
  const entries = leaderboardData?.entries || [];

  const totalAttempts = entries.reduce(
    (sum, entry) => sum + (entry.totalAttempts || 0),
    0,
  );
  const totalCorrect = entries.reduce(
    (sum, entry) => sum + (entry.correctAttempts || 0),
    0,
  );
  const averageAccuracy = entries.length
    ? Number(
        (
          entries.reduce((sum, entry) => sum + (entry.accuracy || 0), 0) /
          entries.length
        ).toFixed(1),
      )
    : 0;

  const toggleLeaderboard = async () => {
    if (isToggling) return;
    setActionError("");
    try {
      await updateLeaderboardStatus(!isEnabled).unwrap();
    } catch (error) {
      setActionError(
        error?.data?.message || "Failed to update leaderboard status",
      );
    }
  };

  return (
    <div className="teacher-dashboard">
      <header className="teacher-dashboard__hero">
        <div className="player-badge-profile highlight2">
          <span className="highlight1">T</span>eacher{" "}
          <span className="highlight2">P</span>rofile: {displayUsername}
          <span className="avatar-preview" style={{ marginLeft: "10px" }}>
            {userInfo?.avatar}
          </span>
        </div>
        <Link to="/leaderboard" className="teacher-dashboard__secondaryAction">
          Open Full Leaderboard
        </Link>
      </header>
      {/* 1. TABS AT THE VERY TOP */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === "performance" ? "active" : ""}`}
          onClick={() => setActiveTab("performance")}
        >
          <BarChart3 size={18} /> Mastery Insights
        </button>

        <button
          className={`tab-btn ${activeTab === "activity" ? "active" : ""}`}
          onClick={() => setActiveTab("activity")}
        >
          <Activity size={18} /> Live Feed
        </button>
      </div>

      {/* --- TAB 1: MANAGEMENT & RANKINGS --- */}
      {activeTab === "performance" && (
        <div className="animate-fade-in">
          {/* Stats Grid */}
          <section className="teacher-dashboard__grid">
            <article className="teacher-dashboard__stat">
              <span>
                {" "}
                <Award size={16} /> Leaderboard{" "}
              </span>
              <strong>{isEnabled ? "Enabled" : "Disabled"}</strong>
              <small>Visible to Students</small>
            </article>
            <article className="teacher-dashboard__stat">
              <span>
                {" "}
                <Users size={16} />
                Students Ranked{" "}
              </span>
              <strong>{entries.length}</strong>
              <small>Active Participants</small>
            </article>
            <article className="teacher-dashboard__stat">
              <span>
                {" "}
                <Calculator size={16} />
                Total Attempts
              </span>
              <strong>{totalAttempts}</strong>
              <small>Across Preview</small>
            </article>
            <article className="teacher-dashboard__stat">
              <span>
                <Target size={16} />
                Avg. Accuracy
              </span>
              <strong>{averageAccuracy}%</strong>
              <small>Class Performance</small>
            </article>
          </section>

          {/* Classroom Controls */}
          <section className="teacher-dashboard__panel teacher-dashboard__panel--split">
            <div className="control-info">
              <h2>
                {" "}
                <SlidersHorizontal size={18} />
                Classroom Controls
              </h2>
              <p>
                {isEnabled
                  ? "The leaderboard is currently live for all students."
                  : "The leaderboard is hidden."}
              </p>
            </div>
            <button
              className={`teacher-dashboard__action ${isEnabled ? "btn--disable" : "btn--enable"}`}
              onClick={toggleLeaderboard}
              disabled={isToggling}
            >
              {isEnabled ? (
                <>
                  Disable Leaderboard <EyeOff size={18} />
                </>
              ) : (
                <>
                  Enable Leaderboard <Eye size={18} />
                </>
              )}
            </button>
          </section>

          {/* Rankings Table */}
          <section className="teacher-dashboard__panel">
            <div className="teacher-dashboard__panelHeader">
              <h2>
                <Trophy size={20} /> Top Rankings
              </h2>
            </div>
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
                        <span className="teacher-dashboard__avatar">
                          {entry.avatar || "🐱"}
                        </span>
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
          </section>
        </div>
      )}

      {/* --- TAB 2: LIVE PREVIEW ONLY --- */}
      {activeTab === "activity" && (
        <section className="teacher-dashboard__panel live-monitor-mode animate-fade-in">
          <div className="teacher-dashboard__panelHeader">
            <div className="live-indicator">
              <div className="dot"></div>
              <h2>Live Activity Feed</h2>
            </div>
            <p>Real-time updates as students solve problems.</p>
          </div>

          {loadingActivity ? (
            <p className="loading-text">Synchronizing with classroom...</p>
          ) : (
            <div className="activity-list activity-list--full">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div
                    key={activity._id}
                    className={`activity-item ${activity.isCorrect ? "activity-item--correct" : "activity-item--incorrect"}`}
                  >
                    <div className="activity-icon-container">
                      {activity.isCorrect ? (
                        <CheckCircle2 size={20} className="icon-success" />
                      ) : (
                        <XCircle size={20} className="icon-error" />
                      )}
                    </div>
                    <div className="activity-details">
                      <span className="activity-text">
                        <strong className="student-name">
                          {activity.user?.username || "Student"}:{" "}
                        </strong>
                        Solved{" "}
                        <strong>
                          {activity.conceptId?.replace(/_/g, " ")}
                        </strong>
                      </span>
                      <span className="activity-date">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-message">Waiting for student activity...</p>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default TeacherDashboard;

// import { useState } from "react";
// import { Link } from "react-router-dom";
// import { useSelector } from "react-redux";
// import {
//   useGetLeaderboardQuery,
//   useGetLeaderboardStatusQuery,
//   useUpdateLeaderboardStatusMutation,
// } from "../store/slices/leaderboardApiSlice";
// import "../sass/page/teacherDashboardPage.scss";
// import { CheckCircle2, XCircle } from "lucide-react";
// import { useGetRecentActivityQuery } from "../store/slices/usersApiSlice";

// const TeacherDashboard = () => {
//   const { userInfo } = useSelector((state) => state.auth);
//   const [actionError, setActionError] = useState("");
//   const [activeTab, setActiveTab] = useState("activity");

//   const userRole = userInfo?.role;
//   const isTeacher = userRole === "teacher";
//   const displayUsername = userInfo?.username || "User";

//   // Activity Feed Hook (Polls every 3s for live updates)
//   const { data: recentActivity, isLoading: loadingActivity } =
//     useGetRecentActivityQuery(undefined, { pollingInterval: 3000 });

//   const {
//     data: statusData,
//     isLoading: isStatusLoading,
//     isError: isStatusError,
//     error: statusError,
//   } = useGetLeaderboardStatusQuery();

//   const [updateLeaderboardStatus, { isLoading: isToggling }] =
//     useUpdateLeaderboardStatusMutation();

//   const {
//     data: leaderboardData,
//     isLoading: isLeaderboardLoading,
//     isError: isLeaderboardError,
//     error: leaderboardError,
//   } = useGetLeaderboardQuery(5, { skip: !statusData });

//   // Calculations for stats
//   const entries = leaderboardData?.entries || [];
//   const totalAttempts = entries.reduce(
//     (sum, entry) => sum + entry.totalAttempts,
//     0,
//   );
//   const totalCorrect = entries.reduce(
//     (sum, entry) => sum + entry.correctAttempts,
//     0,
//   );
//   const averageAccuracy = entries.length
//     ? Number(
//         (
//           entries.reduce((sum, entry) => sum + entry.accuracy, 0) /
//           entries.length
//         ).toFixed(1),
//       )
//     : 0;

//   const toggleLeaderboard = async () => {
//     if (isToggling) return;
//     setActionError("");
//     try {
//       await updateLeaderboardStatus(!isEnabled).unwrap();
//     } catch (error) {
//       setActionError(
//         error?.data?.message || "Failed to update leaderboard status",
//       );
//     }
//   };

//   const isEnabled = Boolean(statusData?.enabled);

//   return (
//     <div className="teacher-dashboard">
//       <header className="teacher-dashboard__hero">
//         <div className="player-badge-profile highlight2">
//           {isTeacher ? (
//             <>
//               <span className="highlight1">T</span>eacher{" "}
//             </>
//           ) : (
//             <>
//               <span className="highlight1">S</span>tudent{" "}
//             </>
//           )}
//           <span className="highlight2">P</span>rofile: {displayUsername}
//         </div>

//         <Link to="/leaderboard" className="teacher-dashboard__secondaryAction">
//           Open Leaderboard
//         </Link>
//       </header>

//       {isStatusLoading ? (
//         <section className="teacher-dashboard__panel">
//           Loading classroom controls...
//         </section>
//       ) : isStatusError ? (
//         <section className="teacher-dashboard__panel teacher-dashboard__panel--error">
//           {statusError?.data?.message || "Failed to load teacher dashboard"}
//         </section>
//       ) : (
//         <>
//           {/* STATS GRID */}
//           <section className="teacher-dashboard__grid">
//             <article className="teacher-dashboard__stat">
//               <span>Leaderboard</span>
//               <strong>{isEnabled ? "Enabled" : "Disabled"}</strong>
//               <small>
//                 {isEnabled
//                   ? "Students can view rankings"
//                   : "Visible only to teachers"}
//               </small>
//             </article>

//             <article className="teacher-dashboard__stat">
//               <span>Students Ranked</span>
//               <strong>{entries.length}</strong>
//               <small>Students with recorded attempts</small>
//             </article>

//             <article className="teacher-dashboard__stat">
//               <span>Total Attempts</span>
//               <strong>{totalAttempts}</strong>
//               <small>Across the previewed leaderboard</small>
//             </article>

//             <article className="teacher-dashboard__stat">
//               <span>Average Accuracy</span>
//               <strong>{averageAccuracy}%</strong>
//               <small>Based on current ranked students</small>
//             </article>
//           </section>

//           {/* CLASSROOM CONTROLS */}
//           <section className="teacher-dashboard__panel teacher-dashboard__panel--split">
//             <div>
//               <h2>Classroom controls</h2>
//               <p>
//                 {isEnabled
//                   ? "The leaderboard is live."
//                   : "The leaderboard is hidden."}
//               </p>
//               {actionError && (
//                 <p className="teacher-dashboard__inlineError">{actionError}</p>
//               )}
//             </div>

//             <button
//               type="button"
//               className="teacher-dashboard__action"
//               onClick={toggleLeaderboard}
//               disabled={isToggling}
//             >
//               {isToggling
//                 ? "Updating..."
//                 : isEnabled
//                   ? "Disable Leaderboard"
//                   : "Enable Leaderboard"}
//             </button>
//           </section>
//           {/* NEW: TAB NAVIGATION */}
//           <div className="dashboard-tabs">
//             <button
//               className={`tab-btn ${activeTab === "activity" ? "active" : ""}`}
//               onClick={() => setActiveTab("activity")}
//             >
//               Live Activity
//             </button>
//             <button
//               className={`tab-btn ${activeTab === "rankings" ? "active" : ""}`}
//               onClick={() => setActiveTab("rankings")}
//             >
//               Top Rankings
//             </button>
//           </div>
//           {/* TOP STUDENTS TABLE */}
//           {isLeaderboardLoading ? (
//             <section className="teacher-dashboard__panel">
//               Loading top students...
//             </section>
//           ) : (
//             <section className="teacher-dashboard__panel">
//               <div className="teacher-dashboard__panelHeader">
//                 <h2>Top students</h2>
//                 <Link
//                   to="/leaderboard"
//                   className="teacher-dashboard__inlineLink"
//                 >
//                   View full leaderboard
//                 </Link>
//               </div>

//               {entries.length ? (
//                 <div className="teacher-dashboard__tableWrapper">
//                   <table className="teacher-dashboard__table">
// <thead>
//   <tr>
//     <th>Rank</th>
//     <th>Student</th>
//     <th>Correct</th>
//     <th>Attempts</th>
//     <th>Accuracy</th>
//   </tr>
// </thead>
// <tbody>
//   {entries.map((entry) => (
//     <tr key={entry.userId}>
//       <td>#{entry.rank}</td>
//       <td className="teacher-dashboard__studentCell">
//         <span className="teacher-dashboard__avatar">
//           {entry.avatar || "🐱"}
//         </span>
//         <span>{entry.username}</span>
//       </td>
//       <td>{entry.correctAttempts}</td>
//       <td>{entry.totalAttempts}</td>
//       <td>{entry.accuracy}%</td>
//     </tr>
//   ))}
//                     </tbody>
//                   </table>
//                 </div>
//               ) : (
//                 <p className="teacher-dashboard__empty">
//                   No student attempts yet.
//                 </p>
//               )}
//             </section>
//           )}

//           {/* NEW: ALL STUDENT ACTIVITY SECTION */}
//           <section className="teacher-dashboard__panel">
//             <div className="teacher-dashboard__panelHeader">
//               <h2>All Student Activity</h2>
//               <p>Real-time updates from your classroom.</p>
//             </div>

//             {loadingActivity ? (
//               <p className="loading-text">Loading activity...</p>
//             ) : (
//               <div
//                 className="activity-list"
//                 style={{ maxHeight: "300px", overflowY: "auto" }}
//               >
//                 {recentActivity && recentActivity.length > 0 ? (
//                   recentActivity.map((activity) => (
//                     <div
//                       key={activity._id}
//                       className={`activity-item ${activity.isCorrect ? "activity-item--correct" : "activity-item--incorrect"}`}
//                     >
//                       <div className="activity-icon-container">
//                         {activity.isCorrect ? (
//                           <CheckCircle2 size={20} className="icon-success" />
//                         ) : (
//                           <XCircle size={20} className="icon-error" />
//                         )}
//                       </div>

//                       <div className="activity-details">
//                         <span className="activity-text">
//                           <strong className="student-name">
//                             {activity.user?.username ||
//                               activity.username ||
//                               "Student"}
//                             :{" "}
//                           </strong>
//                           Solved{" "}
//                           <strong>
//                             {activity.conceptId?.replace(/_/g, " ")}
//                           </strong>{" "}
//                           problem
//                         </span>
//                         <span className="activity-date">
//                           {new Date(activity.timestamp).toLocaleDateString()}
//                         </span>
//                       </div>
//                     </div>
//                   ))
//                 ) : (
//                   <p className="empty-message">
//                     No student attempts recorded yet.
//                   </p>
//                 )}
//               </div>
//             )}
//           </section>
//         </>
//       )}
//     </div>
//   );
// };

// export default TeacherDashboard;
