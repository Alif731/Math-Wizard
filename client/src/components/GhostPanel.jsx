import React from "react";
import { Activity } from "lucide-react";
import "../sass/components/GhostPanel.scss";

const EngineTelemetry = ({ adaptiveData, conceptId, masteryConfig }) => {
  // If no data is arriving, show a "Waiting" state instead of nothing
  if (!adaptiveData) return null;

  // Read thresholds from server config (no more hardcoding!)
  const threshold = masteryConfig?.masteryScoreThreshold || 5;
  const minReq = masteryConfig?.masteryMinAttempts || 5;

  // Extract values with strict fallbacks
  const score = Number(adaptiveData.changePointScore || 0);
  const displayScore = Math.min(score, threshold);
  const ucb = Number(adaptiveData.ucb || 0);
  const status = adaptiveData.status || "unlocked";
  const sess = adaptiveData.timesPlayed || 0;
  const total = adaptiveData.attemptCount || 0;
  const success = adaptiveData.successCount || 0;
  const estimate = adaptiveData.estimate || 0;
  const record = adaptiveData.lastAttempts || adaptiveData.correctnessRecord || [];

  const accuracyPercent = total > 0 ? (success / total) * 100 : 0;

  // Honest Progress Math
  const scoreWeight = Math.min(score / threshold, 1);
  const attemptWeight = Math.min(total / minReq, 1);
  const masteryPercent = (((scoreWeight + attemptWeight) / 2) * 100).toFixed(0);

  const isReady = score >= threshold && total >= minReq;

  // Only show in development
  if (!import.meta.env.DEV) return null;

  return (
    <div className="ghost-debug-panel">
      <div className="ghost-header">
        <Activity size={14} /> <span>ENGINE TELEMETRY</span>
      </div>

      <div className="ghost-row">
        <label>Node ID:</label>
        <span className="node-name">{conceptId || "N/A"}</span>
      </div>

      <div className="ghost-row">
        <label>Status:</label>
        <span className={`status-pill ${status} ${isReady ? "ready" : ""}`}>
          {isReady ? "READY" : status.toUpperCase()}
        </span>
      </div>

      <hr className="ghost-divider" />

      {/* --- DATA ROWS --- */}
      <div className="ghost-row">
        <label>Mastery Score:</label>
        <span className={score >= threshold ? "mastered" : ""}>
          {displayScore.toFixed(2)} / {threshold}
        </span>
      </div>

      <div className="ghost-row">
        <label>Knowledge Est:</label>
        <span>{accuracyPercent.toFixed(0)}% accuracy</span>
      </div>

      <div className="ghost-row">
        <label>UCB Priority:</label>
        <span>{ucb.toFixed(3)}</span>
      </div>

      <div className="ghost-row">
        <label>Mastery Progress:</label>
        <span>{masteryPercent}%</span>
      </div>

      {/* --- PROGRESS BAR --- */}
      <div className="ghost-progress-bar">
        <div
          className="fill"
          style={{
            width: `${masteryPercent}%`,
            background: isReady
              ? "#4ade80"
              : "linear-gradient(90deg, #a855f7, #6366f1)",
          }}
        />
      </div>

      <div className="ghost-row attempts-row">
        <label>Attempts:</label>
        <span>
          {total} <small>(Min:{minReq})</small>
        </span>
      </div>

      {/* --- FOOTER STATS --- */}
      <div className="ghost-row mini-labels">
        <span>
          G: {((adaptiveData.guessProbability || 0) * 100).toFixed(0)}%
        </span>
        <span>
          S: {((adaptiveData.slipProbability || 0) * 100).toFixed(0)}%
        </span>
      </div>

      <div className="ghost-row mini-labels history-section">
        <label>Record:</label>
        <div className="history-dots">
          {record.map((isCorrect, i) => (
            <span key={i} className={`dot ${isCorrect ? "green" : "red"}`}>
              ●
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EngineTelemetry;

// import { useEffect, useState } from "react";
// import {
//   ChevronLeft,
//   ChevronRight,
//   Footprints,
//   Target,
// } from "lucide-react";
// import "../sass/components/GhostPanel.scss";

// const TELEMETRY_STATE_KEY = "wordsolve.telemetry.expanded";

// const EngineTelemetry = ({ adaptiveData, conceptId }) => {
//   const [isExpanded, setIsExpanded] = useState(() => {
//     if (typeof window === "undefined") return false;
//     return window.sessionStorage.getItem(TELEMETRY_STATE_KEY) === "true";
//   });

//   useEffect(() => {
//     window.sessionStorage.setItem(TELEMETRY_STATE_KEY, String(isExpanded));
//   }, [isExpanded]);

//   if (!adaptiveData || !import.meta.env.DEV) return null;

//   const threshold = 8;
//   const minReq = 5;

//   const score = Number(adaptiveData.changePointScore || 0);
//   const status = adaptiveData.status || "unlocked";
//   const sess = adaptiveData.timesPlayed || 0;
//   const total = adaptiveData.attemptCount || 0;
//   const record = adaptiveData.correctnessRecord || [];

//   const scoreWeight = Math.max(0, Math.min(score / threshold, 1));
//   const masteryPercent = (scoreWeight * 100).toFixed(0);
//   const roundsRemaining = Math.max(minReq - total, 0);
//   const hasScoreTarget = score >= threshold;
//   const isReady = hasScoreTarget && total >= minReq;
//   const conceptLabel = String(conceptId || "practice path")
//     .replace(/_/g, " ")
//     .replace(/\b\w/g, (char) => char.toUpperCase());
//   const statusLabel = isReady
//     ? "Ready to level up"
//     : hasScoreTarget
//       ? `${roundsRemaining} more round${roundsRemaining === 1 ? "" : "s"}`
//     : status === "mastered"
//       ? "Mastered"
//       : status === "locked"
//         ? "Locked"
//         : "In progress";
//   const recentDots = record.slice(-6);

//   return (
//     <div
//       className={`ghost-debug-panel ${isExpanded ? "is-expanded" : "is-collapsed"}`}
//     >
//       <button
//         type="button"
//         className="ghost-toggle-card"
//         onClick={() => setIsExpanded((prev) => !prev)}
//         aria-expanded={isExpanded}
//       >
//         <div className="ghost-toggle-card__copy">
//           <span className="ghost-header__label">Progress</span>
//           <strong>{conceptLabel}</strong>
//           <small>{isExpanded ? "Hide details" : "Show details"}</small>
//         </div>

//         <div className="ghost-toggle-card__meta">
//           <div className={`status-pill ${status} ${isReady ? "ready" : ""}`}>
//             {statusLabel}
//           </div>
//           <div className="ghost-toggle-arrow" aria-hidden="true">
//             {isExpanded ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
//           </div>
//         </div>
//       </button>

//       <div className="ghost-toggle-progress">
//         <div className="ghost-toggle-progress__top">
//           <span>Skill meter</span>
//           <strong>{masteryPercent}%</strong>
//         </div>
//         <div className="ghost-progress-bar ghost-progress-bar--mini">
//           <div
//             className={`fill ${isReady ? "fill--ready" : ""}`}
//             style={{ width: `${masteryPercent}%` }}
//           />
//         </div>
//         {isExpanded && (
//           <p className="ghost-toggle-progress__note">
//             {isReady
//               ? "Ready for the next step."
//               : hasScoreTarget
//                 ? `${roundsRemaining} more strong round${roundsRemaining === 1 ? "" : "s"} needed.`
//               : "Strong correct answers move this forward."}
//           </p>
//         )}
//       </div>

//       {isExpanded && (
//         <div className="ghost-panel-body">
//           <div className="ghost-stats-grid">
//             <div className="ghost-stat">
//               <div className="ghost-stat__icon">
//                 <Target size={16} />
//               </div>
//               <div>
//                 <span className="ghost-stat__label">Mastery score</span>
//                 <strong className={score >= threshold ? "mastered" : ""}>
//                   {score.toFixed(2)} / {threshold}
//                 </strong>
//               </div>
//             </div>

//             <div className="ghost-stat">
//               <div className="ghost-stat__icon">
//                 <Footprints size={16} />
//               </div>
//               <div>
//                 <span className="ghost-stat__label">Practice rounds</span>
//                 <strong>
//                   {sess} today, {total} total
//                 </strong>
//               </div>
//             </div>

//             <div className="ghost-stat ghost-stat--history">
//               <div className="ghost-stat__icon ghost-stat__icon--accent">
//                 {recentDots.length || 0}
//               </div>
//               <div>
//                 <span className="ghost-stat__label">Recent tries</span>
//                 <div className="history-dots">
//                   {recentDots.length ? (
//                     recentDots.map((isCorrect, index) => (
//                       <span
//                         key={index}
//                         className={`dot ${isCorrect ? "green" : "red"}`}
//                         title={isCorrect ? "Correct" : "Try again"}
//                       />
//                     ))
//                   ) : (
//                     <span className="ghost-history__empty">No tries yet.</span>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default EngineTelemetry;
