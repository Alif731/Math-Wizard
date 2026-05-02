// import "../sass/page/ProgressBar.scss";
// import { Lock, PlayCircle, Sparkles, Loader2, RefreshCw } from "lucide-react";
// import { useNavigate, Link } from "react-router-dom";
// import { useSelector } from "react-redux";
// import {
//   useGetUserStatusQuery,
//   useSwitchSectionMutation,
// } from "../store/slices/gameApiSlice";
// import UserAvatar, { AVATAR_VARIANTS } from "../components/UserAvatar";
// import { toast } from "react-toastify";

// const ProgressBar = () => {
//   const navigate = useNavigate();

//   const { userInfo } = useSelector((state) => state.auth);
//   const currentUsername = userInfo?.username;

//   const { data: status, isLoading } = useGetUserStatusQuery(currentUsername, {
//     skip: !currentUsername,
//   });

//   const [switchSection, { isLoading: isSwitching }] =
//     useSwitchSectionMutation();

//   // Loading State
//   if (isLoading) {
//     return (
//       <div className="progress-loading">
//         <Loader2 className="spinner" />
//         <span>Loading Page.</span>
//       </div>
//     );
//   }

//   // If no data is found
//   if (!status) return <div className="no-data">No progress data found.</div>;

//   const nodes = Object.entries(status.mastery).map(([id, data]) => ({
//     id,
//     ...data,
//   }));

//   const calculateHonestProgress = (entry) => {
//     const threshold = 8;
//     const score = entry.adaptiveState?.changePointScore || 0;
//     return (Math.min(score / threshold, 1) * 100).toFixed(0);
//   };

//   const practiceIds = ["single_add", "single_sub", "multi_add", "multi_sub"];
//   const equationIds = ["missing_part_equations"];

//   const sections = [
//     {
//       id: "practice",
//       title: "Practice (Arithmetic)",
//       description: "Build your foundation with arithmetic.",
//       nodes: nodes.filter((n) => practiceIds.includes(n.id)),
//     },
//     {
//       id: "equations",
//       title: "Missing Numbers",
//       description: "Find the missing number in equations.",
//       nodes: nodes.filter((n) => equationIds.includes(n.id)),
//     },
//     {
//       id: "schemas",
//       title: "Word Problems",
//       description: "Solve word problems using schemas.",
//       nodes: nodes.filter(
//         (n) => !practiceIds.includes(n.id) && !equationIds.includes(n.id),
//       ),
//     },
//   ];

//   const handleSwitchSection = async (sectionId) => {
//     try {
//       await switchSection({ sectionId }).unwrap();
//       navigate("/home");
//     } catch (error) {
//       toast.error("Failed to switch section");
//       console.error(error);
//     }
//   };

//   const renderNodes = (sectionNodes) => {
//     if (sectionNodes.length === 0) {
//       return (
//         <div
//           className="no-data"
//           style={{ marginTop: "20px", color: "#94a3b8", textAlign: "center" }}
//         >
//           Not started yet.
//         </div>
//       );
//     }

//     return (
//       <div className="wizard-nodes-grid" style={{ marginTop: "20px" }}>
//         {sectionNodes.map((node) => {
//           const progress = calculateHonestProgress(node);
//           const proficiency = (node.adaptiveState?.estimate * 100 || 0).toFixed(
//             0,
//           );
//           const record = node.adaptiveState?.correctnessRecord || [];
//           const isLocked = node.status === "locked";

//           return (
//             <div key={node.id} className={`wizard-card ${node.status}`}>
//               <div className="card-header">
//                 <span className="node-name">{node.id.replace(/_/g, " ")}</span>
//                 <div className={`status-badge ${node.status}`}>
//                   {isLocked ? (
//                     <Lock size={12} />
//                   ) : node.status === "mastered" ? (
//                     "Mastered"
//                   ) : (
//                     "Active"
//                   )}
//                 </div>
//               </div>

//               {!isLocked ? (
//                 <div className="card-content">
//                   <div className="mastery-section">
//                     <div className="label-row">
//                       <label>Mastery Progress</label>
//                       <span>{progress}%</span>
//                     </div>
//                     <div className="wizard-track">
//                       <div
//                         className="wizard-fill"
//                         style={{ width: `${progress}%` }}
//                       />
//                     </div>
//                   </div>

//                   <div className="card-footer">
//                     <div className="skill-orb">
//                       <span className="orb-value">{proficiency}%</span>
//                       <label>Skill</label>
//                     </div>

//                     <div className="history-group">
//                       <div className="dots">
//                         {record.slice(-5).map((isCorrect, i) => (
//                           <div
//                             key={i}
//                             className={`dot ${isCorrect ? "green" : "red"}`}
//                           />
//                         ))}
//                       </div>
//                       <span className="attempts">
//                         Status: {node.attemptCount} / 5
//                       </span>
//                     </div>
//                   </div>

//                   {node.status !== "mastered" && (
//                     <div
//                       style={{
//                         textAlign: "center",
//                         marginTop: "1rem",
//                         color: "#0071e9",
//                         fontSize: "0.9rem",
//                         fontStyle: "italic",
//                       }}
//                     >
//                       Currently Learning
//                     </div>
//                   )}
//                 </div>
//               ) : (
//                 <div className="locked-overlay">
//                   <p>Complete previous nodes to unlock</p>
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     );
//   };

//   return (
//     <div className="student__progress">
//       <header className="game-header-profile teacher-dashboard__hero">
//         <div className="player-badge-profile highlight2">
//           <>
//             <span className="highlight1">S</span>tudent{" "}
//           </>
//           <span className="highlight2">P</span>rofile: {currentUsername}
//           <span className="avatar-preview" style={{ marginLeft: "10px" }}>
//             <UserAvatar
//               name={userInfo?.avatarSeed}
//               variant={userInfo?.avatar}
//               size={60}
//             />
//           </span>
//         </div>
//         <Link to="/leaderboard" className="teacher-dashboard__secondaryAction">
//           Open Full Leaderboard
//         </Link>
//       </header>
//       <div className="progress-map-container" style={{ paddingBottom: "50px" }}>
//         <div className="progress-page-header">
//           {/* <h3 className="map-title"> */}
//           <div className="map-title player-badge highlight2">
//             <Sparkles
//               size={22}
//               style={{ color: "#f2cc8f", marginRight: "6px" }}
//             />{" "}
//             <span className="highlight1"> Y</span>
//             <span style={{ marginRight: "6px" }}>our</span>
//             <span className="highlight1">K</span>
//             <span style={{ marginRight: "6px" }}>nowledge</span>
//             <span className="highlight2">M</span>ap
//             <strong style={{ marginLeft: "0.4rem" }}></strong>
//           </div>
//           {/* </h3> */}
//         </div>
//         <div className="sections-container">
//           {sections.map((section) => (
//             <div key={section.id} className="progress-section">
//               <div className="progress-section__header">
//                 <div className="progress-section__text">
//                   <h4 className="progress-section__title">{section.title}</h4>
//                   <p className="progress-section__description">
//                     {section.description}
//                   </p>
//                 </div>

//                 <button
//                   className="progress-section__button"
//                   onClick={() => handleSwitchSection(section.id)}
//                   disabled={isSwitching}
//                 >
//                   {isSwitching ? (
//                     <Loader2 size={18} className="spinner" />
//                   ) : (
//                     <span className="button-content">
//                       <RefreshCw size={18} className="button-icon" />
//                       Switch to this Section
//                     </span>
//                   )}
//                 </button>
//               </div>

//               <div className="progress-section__nodes">
//                 {renderNodes(section.nodes)}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProgressBar;

import "../sass/page/ProgressBar.scss";
import {
  Lock,
  PlayCircle,
  Sparkles,
  Loader2,
  RefreshCw,
  Award,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  useGetUserStatusQuery,
  useSwitchSectionMutation, // 🔥 1. Brought back useSwitchSectionMutation
} from "../store/slices/gameApiSlice";
import UserAvatar, { AVATAR_VARIANTS } from "../components/UserAvatar";
import { toast } from "react-toastify";

const ProgressBar = () => {
  const navigate = useNavigate();

  const { userInfo } = useSelector((state) => state.auth);
  const currentUsername = userInfo?.username;

  const {
    data: status,
    isLoading,
    refetch,
  } = useGetUserStatusQuery(currentUsername, {
    skip: !currentUsername,
  });

  // 🔥 2. Using switchSection again!
  const [switchSection, { isLoading: isSwitching }] =
    useSwitchSectionMutation();

  if (isLoading) {
    return (
      <div className="progress-loading">
        <Loader2 className="spinner" />
        <span>Loading Page.</span>
      </div>
    );
  }

  if (!status) return <div className="no-data">No progress data found.</div>;

  const nodes = Object.entries(status.mastery).map(([id, data]) => ({
    id,
    ...data,
  }));

  const calculateHonestProgress = (entry) => {
    const threshold = 8;
    const score = entry.adaptiveState?.changePointScore || 0;
    return (Math.min(score / threshold, 1) * 100).toFixed(0);
  };

  const practiceIds = ["single_add", "single_sub", "multi_add", "multi_sub"];
  const equationIds = ["missing_part_equations"];

  const sections = [
    {
      id: "practice",
      title: "Practice (Arithmetic)",
      description: "Build your foundation with arithmetic.",
      nodes: nodes.filter((n) => practiceIds.includes(n.id)),
    },
    {
      id: "equations",
      title: "Missing Numbers",
      description: "Find the missing number in equations.",
      nodes: nodes.filter((n) => equationIds.includes(n.id)),
    },
    {
      id: "schemas",
      title: "Word Problems",
      description: "Solve word problems using schemas.",
      nodes: nodes.filter(
        (n) => !practiceIds.includes(n.id) && !equationIds.includes(n.id),
      ),
    },
  ];

  // 🔥 3. We kept this brilliant logic so the UI knows which section is active!
  let activeSectionId = null;
  const currentConceptId = status?.zpdNodes?.[0];

  if (currentConceptId) {
    const matchingSection = sections.find((sec) =>
      sec.nodes.some((n) => n.id === currentConceptId),
    );
    if (matchingSection) {
      activeSectionId = matchingSection.id;
    }
  }

  // 🔥 4. Reverted back to simply passing sectionId
  const handleSwitchSection = async (sectionId) => {
    try {
      // Send the broad section word ("practice", "equations", etc.) to the backend
      await switchSection({ sectionId }).unwrap();

      // Force UI to refresh the active badge
      await refetch();

      toast.success("Ready to learn!");
      navigate("/home");
    } catch (error) {
      toast.error("Failed to switch section.");
      console.error("Switch Error:", error);
    }
  };

  const renderNodes = (sectionNodes) => {
    if (sectionNodes.length === 0) {
      return (
        <div
          className="no-data"
          style={{ marginTop: "20px", color: "#94a3b8", textAlign: "center" }}
        >
          Not started yet.
        </div>
      );
    }

    return (
      <div className="wizard-nodes-grid" style={{ marginTop: "20px" }}>
        {sectionNodes.map((node) => {
          const progress = calculateHonestProgress(node);
          const proficiency = (node.adaptiveState?.estimate * 100 || 0).toFixed(
            0,
          );
          const record = node.adaptiveState?.correctnessRecord || [];
          const isLocked = node.status === "locked";

          return (
            <div key={node.id} className={`wizard-card ${node.status}`}>
              <div className="card-header">
                <span className="node-name">{node.id.replace(/_/g, " ")}</span>
                <div className={`status-badge ${node.status}`}>
                  {isLocked ? (
                    <Lock size={12} />
                  ) : node.status === "mastered" ? (
                    "Mastered"
                  ) : (
                    "Active"
                  )}
                </div>
              </div>

              {!isLocked ? (
                <div className="card-content">
                  <div className="mastery-section">
                    <div className="label-row">
                      <label>Mastery Progress</label>
                      <span>{progress}%</span>
                    </div>
                    <div className="wizard-track">
                      <div
                        className="wizard-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="card-footer">
                    <div className="skill-orb">
                      <span className="orb-value">{proficiency}%</span>
                      <label>Skill</label>
                    </div>

                    <div className="history-group">
                      <div className="dots">
                        {record.slice(-5).map((isCorrect, i) => (
                          <div
                            key={i}
                            className={`dot ${isCorrect ? "green" : "red"}`}
                          />
                        ))}
                      </div>
                      <span className="attempts">
                        Status: {node.attemptCount} / 5
                      </span>
                    </div>
                  </div>

                  {node.status !== "mastered" && (
                    <div
                      style={{
                        textAlign: "center",
                        marginTop: "1rem",
                        color: "#0071e9",
                        fontSize: "0.9rem",
                        fontStyle: "italic",
                      }}
                    >
                      Actively Learning
                    </div>
                  )}
                </div>
              ) : (
                <div className="locked-overlay">
                  <p>Complete previous nodes to unlock</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="student__progress">
      <header className="game-header-profile teacher-dashboard__hero">
        <div className="player-badge-profile highlight2">
          <>
            <span className="highlight1">S</span>tudent{" "}
          </>
          <span className="highlight2" style={{ marginLeft: "10px" }}>
            {" "}
            P
          </span>
          rofile: {currentUsername}
          <span className="avatar-preview" style={{ marginLeft: "10px" }}>
            <UserAvatar
              name={userInfo?.avatarSeed}
              variant={userInfo?.avatar}
              size={60}
            />
          </span>
        </div>
        <Link to="/leaderboard" className="teacher-dashboard__secondaryAction">
          <Award size={22} style={{ marginRight: "6px" }} /> Open Full
          Leaderboard
        </Link>
      </header>
      <div className="progress-map-container" style={{ paddingBottom: "50px" }}>
        <div className="progress-page-header">
          <div className="map-title player-badge highlight2">
            <Sparkles
              size={22}
              style={{ color: "#f2cc8f", marginRight: "6px" }}
            />{" "}
            <span className="highlight1"> Y</span>
            <span style={{ marginRight: "6px" }}>our</span>
            <span className="highlight1">K</span>
            <span style={{ marginRight: "6px" }}>nowledge</span>
            <span className="highlight2">M</span>ap
            <strong style={{ marginLeft: "0.4rem" }}></strong>
          </div>
        </div>

        <div className="sections-container">
          {sections.map((section) => {
            const isActiveSection = activeSectionId === section.id;

            return (
              <div key={section.id} className="progress-section">
                <div className="progress-section__header">
                  <div className="progress-section__text">
                    <h4 className="progress-section__title">{section.title}</h4>
                    <p className="progress-section__description">
                      {section.description}
                    </p>
                  </div>

                  {isActiveSection ? (
                    <div className="active-section-badge">
                      <Sparkles size={16} />
                      <span>Currently Active</span>
                    </div>
                  ) : (
                    <button
                      className="progress-section__button"
                      onClick={() => handleSwitchSection(section.id)}
                      disabled={isSwitching}
                    >
                      {isSwitching ? (
                        <Loader2 size={18} className="spinner" />
                      ) : (
                        <span className="button-content">
                          <RefreshCw size={18} className="button-icon" />
                          Switch to this Section
                        </span>
                      )}
                    </button>
                  )}
                </div>

                <div className="progress-section__nodes">
                  {renderNodes(section.nodes)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
