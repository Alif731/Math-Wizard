// import React, { useState, useEffect, useRef } from "react";
// import { useSelector } from "react-redux";
// import {
//   useGetProblemQuery,
//   useGetUserStatusQuery,
//   useSubmitAnswerMutation,
// } from "../store/slices/gameApiSlice";

// import QuestionCard from "../components/QuestionCard";
// import "../sass/page/homePage.scss";
// import { Sunrise, Sun, Moon } from "lucide-react";

// const Home = () => {
//   const { userInfo } = useSelector((state) => state.auth);
//   const username = userInfo?.username;

//   // --- RTK QUERY HOOKS ---
//   const {
//     data: problem,
//     isLoading: loadingProblem,
//     isError: errorProblem,
//     refetch: refetchProblem,
//   } = useGetProblemQuery(username, { skip: !username });

//   const { data: status } = useGetUserStatusQuery(username, { skip: !username });
//   const [submitAnswer, { isLoading: isSubmitting }] = useSubmitAnswerMutation();

//   // Streak Animation ----------------------------
//   const [isAnimatingSuccess, setIsAnimatingSuccess] = useState(false);
//   const [isAnimatingFailure, setIsAnimatingFailure] = useState(false);

//   const prevStreakRef = useRef(0);

//   useEffect(() => {
//     const currentStreak = status?.streak || 0;
//     const prevStreak = prevStreakRef.current;

//     // SCENARIO 1: Streak extended
//     if (currentStreak > prevStreak && currentStreak > 0) {
//       setIsAnimatingSuccess(true);
//       setTimeout(() => setIsAnimatingSuccess(false), 500);
//     }
//     // SCENARIO 2: Streak lost
//     else if (currentStreak === 0 && prevStreak > 0) {
//       setIsAnimatingFailure(true);
//       setTimeout(() => setIsAnimatingFailure(false), 600);
//     }

//     prevStreakRef.current = currentStreak;
//   }, [status?.streak]);
//   //  ---------------------------- End

//   // --- HANDLERS ---
//   const handleAnswerSubmit = async (answer) => {
//     if (!problem?.question) return;

//     try {
//       return await submitAnswer({
//         conceptId: problem.concept.id,
//         questionId: problem.question.id,
//         response: answer,
//       }).unwrap();
//     } catch (err) {
//       console.error("Failed to submit:", err);
//       throw err;
//     }
//   };

//   const handleNextProblem = () => {
//     refetchProblem();
//   };

//   const isMastered = problem?.complete;

//   // --- STATS SUMMARY ---
//   // Restored this so correct and attempted actually work!
//   const practiceSummary = {
//     correct: problem?.adaptiveState?.successCount || 0,
//     attempted: problem?.adaptiveState?.attemptCount || 0,
//     streak: isAnimatingFailure ? 0 : status?.streak || 0,
//   };

//   if (!username) return <div className="loading-state">Loading...</div>;
//   if (!problem) return <div className="loading-state">Loading...</div>;

//   // Greet According to time
//   const getGreeting = () => {
//     const hour = new Date().getHours();

//     if (hour < 12) {
//       return {
//         firstLetter: "M",
//         rest: "orning",
//         Icon: Sunrise,
//         color: "#f59e0b",
//       }; // Amber for Morning
//     } else if (hour < 17) {
//       return {
//         firstLetter: "A",
//         rest: "fternoon",
//         Icon: Sun,
//         color: "#eab308",
//       }; // Yellow for Afternoon
//     } else {
//       return {
//         firstLetter: "E",
//         rest: "vening",
//         Icon: Moon,
//         color: "#e9ab47",
//       };
//     }
//   };
//   const { firstLetter, rest, Icon, color } = getGreeting();

//   return (
//     <div className="home-page">
//       <header className="game-header">
//         {/* <div className="player-badge highlight2">
//           <span className="highlight1">G</span>
//           <span style={{ marginRight: "6px" }}>ood</span>
//           <span className="highlight2"> M</span>orning {username}
//           <strong style={{ marginLeft: "0.4rem" }}>
//             {" "}
//             . <span className="highlight1">L</span>et's Continue this Journey!
//           </strong>
//         </div> */}
//         <div className="player-badge highlight2">
//           {/* 4. Render the Lucide Icon with perfect vertical alignment */}
//           <span
//             style={{
//               marginRight: "8px",
//               display: "inline-flex",
//               alignItems: "center",
//             }}
//           >
//             <Icon size={22} color={color} strokeWidth={2.5} />
//           </span>
//           <span className="highlight1">G</span>
//           <span style={{ marginRight: "6px" }}>ood</span>
//           <span className="highlight2"> {firstLetter}</span>
//           {rest} {username}
//           <strong style={{ marginLeft: "0.4rem" }}>
//             {" "}
//             . <span className="highlight1">L</span>et's Continue this Journey!
//           </strong>
//         </div>
//         {(practiceSummary.streak >= 1 || isAnimatingFailure) && (
//           <div
//             className={`streak__badge ${isAnimatingSuccess ? "pop-active" : ""} ${isAnimatingFailure ? "shake-active" : ""}`}
//           >
//             <span className="highlight1">S</span>treak:{" "}
//             <span className="highlight2">x</span>
//             {practiceSummary.streak}
//             <span className="right"></span>
//             <span className="bottom"></span>
//             <span className="left"></span>
//           </div>
//         )}
//       </header>

//       <main className="home-layout">
//         {isMastered ? (
//           <div className="status-card master">
//             You have mastered all available concepts!
//           </div>
//         ) : // 3. LOADING STATE
//         loadingProblem ? (
//           <div className="status-card loading">
//             <div className="spinner">⏳</div>
//             Loading your challenge...
//           </div>
//         ) : // 4. ERROR STATE
//         errorProblem ? (
//           <div className="status-card error-msg">
//             Error loading game data. Please try refreshing.
//           </div>
//         ) : (
//           // 5. QUESTION CARD
//           problem &&
//           problem.question && (
//             <QuestionCard
//               key={problem.question.id}
//               problem={problem}
//               onSubmit={handleAnswerSubmit}
//               onNext={handleNextProblem}
//               disabled={isSubmitting}
//               practiceSummary={practiceSummary}
//             />
//           )
//         )}
//       </main>
//     </div>
//   );
// };

// export default Home;

// Home.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  useGetProblemQuery,
  useGetUserStatusQuery,
  useSubmitAnswerMutation,
} from "../store/slices/gameApiSlice";

import QuestionCard from "../components/QuestionCard";
import MasteryModal from "../components/MasteryModal"; // Keep this import!
import "../sass/page/homePage.scss";
import { Sunrise, Sun, Moon, Trophy, Sparkles } from "lucide-react";

const Home = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const username = userInfo?.username;
  const location = useLocation();

  const navigate = useNavigate();
  // --- RTK QUERY HOOKS ---
  const {
    data: problem,
    isLoading: loadingProblem,
    isError: errorProblem,
    refetch: refetchProblem,
  } = useGetProblemQuery(username, { skip: !username });

  const { data: status } = useGetUserStatusQuery(username, { skip: !username });
  const [submitAnswer, { isLoading: isSubmitting }] = useSubmitAnswerMutation();

  // Streak Animation ----------------------------
  const [isAnimatingSuccess, setIsAnimatingSuccess] = useState(false);
  const [isAnimatingFailure, setIsAnimatingFailure] = useState(false);

  const prevStreakRef = useRef(0);

  useEffect(() => {
    const currentStreak = status?.streak || 0;
    const prevStreak = prevStreakRef.current;

    // SCENARIO 1: Streak extended
    if (currentStreak > prevStreak && currentStreak > 0) {
      setIsAnimatingSuccess(true);
      setTimeout(() => setIsAnimatingSuccess(false), 500);
    }
    // SCENARIO 2: Streak lost
    else if (currentStreak === 0 && prevStreak > 0) {
      setIsAnimatingFailure(true);
      setTimeout(() => setIsAnimatingFailure(false), 600);
    }

    prevStreakRef.current = currentStreak;
  }, [status?.streak]);
  //  ---------------------------- End

  // --- SINGLE MODULE MASTERY TRACKER ---
  const [masteredModalInfo, setMasteredModalInfo] = useState(null);
  const pendingMasteryRef = useRef(null); // Buffer mastery until question interaction completes
  const prevConceptStatus = useRef({});
  const currentConceptId = problem?.concept?.id;

  useEffect(() => {
    if (!currentConceptId || !status?.mastery) return;

    const currentStatus = status.mastery[currentConceptId]?.status;
    const previousStatus = prevConceptStatus.current[currentConceptId];

    // If the module's status changes from anything else TO "mastered" while they are playing it,
    // DON'T show the modal yet — buffer it until the student finishes the current question.
    if (
      previousStatus &&
      previousStatus !== "mastered" &&
      currentStatus === "mastered"
    ) {
      // Compute recent window accuracy (distinct from lifetime "Skill %")
      const entry = status.mastery[currentConceptId];
      const window = entry?.lastAttempts || [];
      const windowSuccesses = window.filter(Boolean).length;
      const windowAccuracy = window.length > 0
        ? Math.round((windowSuccesses / window.length) * 100)
        : 100;

      pendingMasteryRef.current = {
        id: currentConceptId,
        name: currentConceptId.replace(/_/g, " "),
        attempts: entry?.attemptCount || 1,
        accuracy: windowAccuracy,
      };
    }

    // Keep track for the next render
    prevConceptStatus.current[currentConceptId] = currentStatus;
  }, [currentConceptId, status]);

  // If the student clicked "Resume Journey" on the progress page ("Old State Fix")
  useEffect(() => {
    if (location.state?.forceRefetch) {
      refetchProblem();
      window.history.replaceState({}, document.title);
    }
  }, [location.state, refetchProblem]);
  // -------------------------------------

  // --- HANDLERS ---
  const handleAnswerSubmit = async (answer) => {
    if (!problem?.question) return;

    try {
      return await submitAnswer({
        conceptId: problem.concept.id,
        questionId: problem.question.id,
        response: answer,
      }).unwrap();
    } catch (err) {
      console.error("Failed to submit:", err);
      throw err;
    }
  };

  const handleNextProblem = () => {
    // Flush any pending mastery modal BEFORE loading the next question.
    // This ensures the modal only appears after the student finishes
    // all interactions (both tries / reveal) on the final question.
    if (pendingMasteryRef.current) {
      setMasteredModalInfo(pendingMasteryRef.current);
      pendingMasteryRef.current = null;
      return; // Don't refetch yet — let the modal show first
    }
    refetchProblem();
  };

  // This means they beat the ENTIRE game!
  const isGameMastered = problem?.complete;

  // --- STATS SUMMARY ---
  const practiceSummary = {
    correct: problem?.adaptiveState?.successCount || 0,
    attempted: problem?.adaptiveState?.attemptCount || 0,
    streak: isAnimatingFailure ? 0 : status?.streak || 0,
  };

  if (!username) return <div className="loading-state">Loading...</div>;
  if (!problem) return <div className="loading-state">Loading...</div>;

  // Greet According to time
  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) {
      return {
        firstLetter: "M",
        rest: "orning",
        Icon: Sunrise,
        color: "#f59e0b",
      }; // Amber for Morning
    } else if (hour < 17) {
      return {
        firstLetter: "A",
        rest: "fternoon",
        Icon: Sun,
        color: "#eab308",
      }; // Yellow for Afternoon
    } else {
      return {
        firstLetter: "E",
        rest: "vening",
        Icon: Moon,
        color: "#e9ab47",
      };
    }
  };
  const { firstLetter, rest, Icon, color } = getGreeting();

  return (
    <div className="home-page">
      <header className="game-header">
        <div className="player-badge highlight2">
          <span
            style={{
              marginRight: "8px",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            <Icon size={22} color={color} strokeWidth={2.5} />
          </span>
          <span className="highlight1">G</span>
          <span style={{ marginRight: "6px" }}>ood</span>
          <span className="highlight2"> {firstLetter}</span>
          {rest} {username}
          <strong style={{ marginLeft: "0.4rem" }}>
            {" "}
            . <span className="highlight1">L</span>et's Continue this Journey!
          </strong>
        </div>
        {(practiceSummary.streak >= 1 || isAnimatingFailure) && (
          <div
            className={`streak__badge ${isAnimatingSuccess ? "pop-active" : ""} ${isAnimatingFailure ? "shake-active" : ""}`}
          >
            <span className="highlight1">S</span>treak:{" "}
            <span className="highlight2">x</span>
            {practiceSummary.streak}
            <span className="right"></span>
            <span className="bottom"></span>
            <span className="left"></span>
          </div>
        )}
      </header>

      {/* <main className="home-layout">
        {isGameMastered ? (
          // Restored your original "Game Over" message
          <div className="status-card master">
            You have mastered all available concepts!
          </div>
        ) : loadingProblem ? (
          <div className="status-card loading">
            <div className="spinner">⏳</div>
            Loading your challenge...
          </div>
        ) : errorProblem ? (
          <div className="status-card error-msg">
            Error loading game data. Please try refreshing.
          </div>
        ) : (
          problem &&
          problem.question && (
            <QuestionCard
              key={problem.question.id}
              problem={problem}
              onSubmit={handleAnswerSubmit}
              onNext={handleNextProblem}
              disabled={isSubmitting}
              practiceSummary={practiceSummary}
            />
          )
        )}
      </main> */}
      <main className="home-layout">
        {isGameMastered ? (
          /* --- NEW VICTORY BANNER --- */
          <div className="mastery-complete-banner">
            <div className="banner-icon-container">
              <Trophy size={32} />
            </div>

            <div className="banner-content">
              <h3>Mastery Achieved!</h3>
              <p>
                You have successfully conquered every concept in this journey.
              </p>

              <button
                className="banner-action-btn"
                onClick={() => navigate("/progress")}
              >
                View Your Knowledge Map
              </button>
            </div>

            {/* Decorative Sparkles for that "Magic" feel */}
            <Sparkles className="decoration-star top-right" size={20} />
            <Sparkles className="decoration-star bottom-left" size={16} />
          </div>
        ) : loadingProblem ? (
          <div className="status-card loading">
            <div className="spinner">⏳</div>
            Loading your challenge...
          </div>
        ) : errorProblem ? (
          <div className="status-card error-msg">
            Error loading game data. Please try refreshing.
          </div>
        ) : (
          problem &&
          problem.question && (
            <QuestionCard
              key={problem.question.id}
              problem={problem}
              onSubmit={handleAnswerSubmit}
              onNext={handleNextProblem}
              disabled={isSubmitting}
              practiceSummary={practiceSummary}
            />
          )
        )}
      </main>

      {/* --- INJECTED MODAL AS AN OVERLAY --- */}
      <MasteryModal
        isOpen={!!masteredModalInfo}
        moduleName={masteredModalInfo?.name || "Concept"}
        moduleId={masteredModalInfo?.id}
        score={masteredModalInfo?.accuracy ?? 100}
        attempts={masteredModalInfo?.attempts || 1}
        onClose={() => setMasteredModalInfo(null)}
      />
    </div>
  );
};

export default Home;
