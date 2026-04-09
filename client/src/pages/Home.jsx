import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  useGetProblemQuery,
  useGetUserStatusQuery,
  useSubmitAnswerMutation,
} from "../store/slices/gameApiSlice";

import QuestionCard from "../components/QuestionCard";
import "../sass/page/homePage.scss";
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
  const practiceSummary = {
    correct: problem?.adaptiveState?.successCount || 0,
    attempted: problem?.adaptiveState?.attemptCount || 0,
    streak: isAnimatingFailure ? 0 : status?.streak || 0,
  };

  if (!username) return <div className="loading-state">Loading...</div>;
  if (!problem) return <div className="loading-state">Loading...</div>;

  return (
    <div className="home-page">
      <header className="game-header">
        <div className="player-badge">
          <span className="player-badge__eyebrow">Today&apos;s practice</span>
          <div className="player-badge__copy">
            <strong>Good morning, {username}</strong>
            <small>Warm up, solve, and keep your streak moving.</small>
          </div>
        </div>
        <div
          className={`practice-summary ${isAnimatingSuccess ? "pop-active" : ""} ${isAnimatingFailure ? "shake-active" : ""}`}
        >
          <div className="practice-summary__stat">
            <span className="practice-summary__label">correct</span>
            <strong>{practiceSummary.correct}</strong>
          </div>
          <div className="practice-summary__stat">
            <span className="practice-summary__label">attempted</span>
            <strong>{practiceSummary.attempted}</strong>
          </div>
          <div className="practice-summary__stat practice-summary__stat--accent">
            <span className="practice-summary__label">streak</span>
            <strong>x{practiceSummary.streak}</strong>
          </div>
        </div>
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
            />
          )
        )}
      </main>
    </div>
  );
};

export default Home;
