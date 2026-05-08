import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  useGetProblemQuery,
  useGetUserStatusQuery,
  useSubmitAnswerMutation,
} from "../store/slices/gameApiSlice";

import QuestionCard from "../components/QuestionCard";
import "../sass/page/homePage.scss";
import { Sunrise, Sun, Moon } from "lucide-react";

const Home = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const username = userInfo?.username;

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
    refetchProblem();
  };

  const isMastered = problem?.complete;

  // --- STATS SUMMARY ---
  // Restored this so correct and attempted actually work!
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
      return { firstLetter: "E", rest: "vening", Icon: Moon, color: "#8b5cf6" }; // Purple for Evening
    }
  };
  const { firstLetter, rest, Icon, color } = getGreeting();

  return (
    <div className="home-page">
      <header className="game-header">
        {/* <div className="player-badge highlight2">
          <span className="highlight1">G</span>
          <span style={{ marginRight: "6px" }}>ood</span>
          <span className="highlight2"> M</span>orning {username}
          <strong style={{ marginLeft: "0.4rem" }}>
            {" "}
            . <span className="highlight1">L</span>et's Continue this Journey!
          </strong>
        </div> */}
        <div className="player-badge highlight2">
          {/* 4. Render the Lucide Icon with perfect vertical alignment */}
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

      <main className="home-layout">
        {isMastered ? (
          <div className="status-card master">
            You have mastered all available concepts!
          </div>
        ) : // 3. LOADING STATE
        loadingProblem ? (
          <div className="status-card loading">
            <div className="spinner">⏳</div>
            Loading your challenge...
          </div>
        ) : // 4. ERROR STATE
        errorProblem ? (
          <div className="status-card error-msg">
            Error loading game data. Please try refreshing.
          </div>
        ) : (
          // 5. QUESTION CARD
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
    </div>
  );
};

export default Home;
