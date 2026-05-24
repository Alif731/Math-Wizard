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

  // ==========================================================
  // PERSISTENT STAGE TRACKING (Survives Page Reloads!)
  // ==========================================================
  //  Module 4 tab UI error and correct color
  const questionId = problem?.question?.id || problem?.question?._id;

  const [stageResults, setStageResults] = useState(() => {
    const saved = sessionStorage.getItem("currentStageResults");
    return saved ? JSON.parse(saved) : {};
  });

  const [failedAnyStage, setFailedAnyStage] = useState(() => {
    return sessionStorage.getItem("currentFailedAnyStage") === "true";
  });

  // 1. Instantly save to SessionStorage whenever they change
  useEffect(() => {
    sessionStorage.setItem("currentStageResults", JSON.stringify(stageResults));
  }, [stageResults]);

  useEffect(() => {
    sessionStorage.setItem("currentFailedAnyStage", failedAnyStage);
  }, [failedAnyStage]);

  // 2. Wipe the memory clean ONLY when a brand new question starts
  useEffect(() => {
    if (problem?.question?.stageIndex === 1) {
      setStageResults({});
      setFailedAnyStage(false);
      sessionStorage.removeItem("currentStageResults");
      sessionStorage.removeItem("currentFailedAnyStage");
    }
  }, [problem?.question?.stageIndex, questionId]);
  // ==========================================================

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
      const windowAccuracy =
        window.length > 0
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

    // 🔥 ADD THIS: Instantly wipe the CSS animation classes so they don't replay while loading!
    setStatAnim({ key: 0, colorClass: "" });
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
  // 🔥 NEW: Lifted State from QuestionCard for Score Animations
  const [pendingResult, setPendingResult] = useState(null);
  const [statAnim, setStatAnim] = useState({ key: 0, colorClass: "" });

  useEffect(() => {
    if (pendingResult === "correct") {
      setStatAnim((prev) => ({
        key: prev.key + 1,
        colorClass: "stat-pop-success",
      }));
    } else if (pendingResult === "wrong") {
      setStatAnim((prev) => ({
        key: prev.key + 1,
        colorClass: "stat-pop-error",
      }));
    }
  }, [pendingResult]);

  useEffect(() => {
    setPendingResult(null);
    setStatAnim({ key: 0, colorClass: "" });
  }, [problem?.question?.id]);

  const displayAttempted = pendingResult
    ? practiceSummary.attempted + 1
    : practiceSummary.attempted;
  const displayCorrect =
    pendingResult === "correct"
      ? practiceSummary.correct + 1
      : practiceSummary.correct;

  if (!username) return <div className="loading-state">Loading...</div>;
  if (!problem) return <div className="loading-state">Loading...</div>;

  // Greet According to time
  // const getGreeting = () => {
  //   const hour = new Date().getHours();

  //   if (hour < 12) {
  //     return {
  //       firstLetter: "M",
  //       rest: "orning",
  //       Icon: Sunrise,
  //       color: "#f59e0b",
  //     }; // Amber for Morning
  //   } else if (hour < 17) {
  //     return {
  //       firstLetter: "A",
  //       rest: "fternoon",
  //       Icon: Sun,
  //       color: "#eab308",
  //     }; // Yellow for Afternoon
  //   } else {
  //     return {
  //       firstLetter: "E",
  //       rest: "vening",
  //       Icon: Moon,
  //       color: "#e9ab47",
  //     };
  //   }
  // };
  // const { firstLetter, rest, Icon, color } = getGreeting();
  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) {
      return {
        firstLetter: "M",
        rest: "orning",
        Icon: Sunrise,
        iconColor: "#f59e0b", // Bright Amber
        // textColor: "#d97706", // Deep Amber for readable text
      };
    } else if (hour < 17) {
      return {
        firstLetter: "A",
        rest: "fternoon",
        Icon: Sun,
        iconColor: "#eab308", // Bright Gold
        // textColor: "#ca8a04", // Deep Gold for readable text
      };
    } else {
      return {
        firstLetter: "E",
        rest: "vening",
        Icon: Moon,
        iconColor: "#8b5cf6", // Twilight Purple
        // textColor: "#6d28d9", // Deep Purple for readable text
      };
    }
  };

  // Destructure the new color variables
  const { firstLetter, rest, Icon, iconColor, textColor } = getGreeting();

  return (
    <div className="home-page">
      <header className="game-header">
        <div className="player-badge-div">
          <div className="player-badge highlight2">
            <span
              style={{
                marginRight: "8px",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <Icon size={22} color={iconColor} strokeWidth={2.5} />
            </span>
            <span className="highlight1">G</span>
            <span style={{ marginRight: "6px" }}>ood</span>
            <span className="highlight2"> {firstLetter}</span>
            {rest} {username}
            {/* <strong style={{ marginLeft: "0.4rem" }}>
            {" "}
            . <span className="highlight1">L</span>et's Continue this Journey!
          </strong> */}
          </div>
        </div>

        {/* CORRECT STAT */}
        <div className="practice-summary__stat">
          <span
            className="practice-summary__label"
            style={{ marginRight: "0.5rem" }}
          >
            Correct:
          </span>
          <strong
            key={`correct-anim-${statAnim.key}`}
            className={statAnim.colorClass}
          >
            {displayCorrect}
          </strong>
        </div>

        {/* ATTEMPTED STAT */}
        <div className="practice-summary__stat">
          <span
            className="practice-summary__label"
            style={{ marginRight: "0.5rem" }}
          >
            Attempted:
          </span>
          <strong
            /* Uses the exact same animation key so they pop at the exact same time */
            key={`attempt-anim-${statAnim.key}`}
            /* Only applies the subtle bump if an animation is actively playing */
            className={statAnim.key > 0 ? "stat-pop-neutral" : ""}
          >
            {displayAttempted}
          </strong>
        </div>
        {/* </div> */}
        {(practiceSummary.streak >= 1 || isAnimatingFailure) && (
          <div
            className={`streak__badge ${isAnimatingSuccess ? "pop-active" : ""} ${isAnimatingFailure ? "shake-active" : ""}`}
          >
            <span className="highlight1">S</span>treak:{" "}
            <span className="highlight2">x</span>
            {practiceSummary.streak}
            <span className="top"></span>
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
              failedAnyStage={failedAnyStage}
              setFailedAnyStage={setFailedAnyStage}
              stageResults={stageResults}
              setStageResults={setStageResults}
              onSubmit={handleAnswerSubmit}
              onNext={handleNextProblem}
              disabled={isSubmitting}
              practiceSummary={practiceSummary}
              pendingResult={pendingResult}
              setPendingResult={setPendingResult}
              statAnim={statAnim}
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
        onClose={() => {
          setMasteredModalInfo(null);
          refetchProblem(); // Load next module after dismissing the modal
        }}
      />
    </div>
  );
};

export default Home;
