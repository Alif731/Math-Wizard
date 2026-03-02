// Big O Analysis: O(1) - Rendering logic is constant time relative to data size.
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  useGetProblemQuery,
  useGetUserStatusQuery,
  useSubmitAnswerMutation,
} from "../store/slices/gameApiSlice";

import QuestionCard from "../components/QuestionCard";
import Dashboard from "../components/Dashboard";
import "../sass/page/homePage.scss";
const Home = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const username = userInfo?.username;
  const [streak, setStreak] = useState(() => {
    if (!username) return 0;
    const savedStreak = sessionStorage.getItem(`mathStreak:${username}`);
    return savedStreak ? Number(savedStreak) : 0;
  });

  useEffect(() => {
    if (!username) {
      setStreak(0);
      return;
    }
    const savedStreak = sessionStorage.getItem(`mathStreak:${username}`);
    setStreak(savedStreak ? Number(savedStreak) : 0);
  }, [username]);

  useEffect(() => {
    if (!username) return;
    sessionStorage.setItem(`mathStreak:${username}`, String(streak));
  }, [streak, username]);

  // --- RTK QUERY HOOKS ---
  const {
    data: problem,
    isLoading: loadingProblem,
    isError: errorProblem,
    refetch: refetchProblem,
  } = useGetProblemQuery(username, { skip: !username });

  const { data: status } = useGetUserStatusQuery(username, { skip: !username });
  const [submitAnswer, { isLoading: isSubmitting }] = useSubmitAnswerMutation();

  // --- LOCAL STATE ---
  const [feedback, setFeedback] = useState(null);

  // --- HANDLERS ---
  const handleAnswerSubmit = async (answer) => {
    if (!problem?.question) return;

    try {
      await submitAnswer({
        conceptId: problem.concept.id,
        questionId: problem.question.id,
        response: answer,
      }).unwrap();

      // refetch questions
      setFeedback(null);
      refetchProblem();
    } catch (err) {
      console.error("Failed to submit:", err);
    }
  };

  const handleNext = () => {
    setFeedback(null);
    refetchProblem();
  };

  const isMastered = problem?.complete;

  if (!username) return <div className="loading-state">Loading...</div>;
  if (!problem) return <div className="loading-state">Loading...</div>;
  return (
    <div className="home-page">
      {/* --- ADDED BACK: GAME HEADER --- */}
      <header className="game-header">
        <div className="player-badge highlight2">
          <span className="highlight1">G</span>ood{" "}
          <span className="highlight2">M</span>orning {username}
          <strong style={{ marginLeft: "0.4rem" }}>
            {" "}
            . <span className="highlight1">L</span>et's Continue this Journey!
          </strong>
        </div>
        {streak >= 1 && (
          <div className="streak__badge">
            <span className="highlight1">S</span>treak:{" "}
            <span className="highlight2">x</span>
            {streak} <span className="top"></span>
            <span className="right"></span>
            <span className="bottom"></span>
            <span className="left"></span>
          </div>
        )}
      </header>
      {problem?.description && problem.concept.id === "foundation_signs" && (
        <h2 className="card__header__type">{problem.description}</h2>
      )}
      <main className="home-layout">
        {/* --- LEFT COLUMN: GAME AREA --- */}
        {/* <section className="game-section"> */}
        {/* 1. FEEDBACK CARD */}
        {/* {feedback ? (
          <div
            className={`feedback-card ${feedback.isCorrect ? "success" : "error"}`}
          >
            <div className="feedback-icon">
              {feedback.isCorrect ? "🌟" : "❌"}
            </div>
            <h2 className="feedback-title">
              {feedback.isCorrect ? "Correct" : "Wrong"}
            </h2>
            <p className="feedback-text">
              {feedback.isCorrect
                ? feedback.explanation
                : `The correct answer was: ${feedback.correctAnswer}`}
            </p>
            <button onClick={handleNext} className="btn-next">
              Next Question
            </button>
          </div>
        ) : // 2. MASTERY MESSAGE */}
        {/*
        feedback && !feedback.isCorrect ? (
          <div className="feedback-card error">
             <div className="feedback-icon">❌</div>
             <h2 className="feedback-title">Wrong</h2>
             <p className="feedback-text">
               {feedback.explanation || `Correct answer: ${feedback.correctAnswer}`}
             </p>
             <button onClick={handleNext} className="btn-next">Next</button>
          </div>
        ) : 
         */}
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
          problem && problem.question && (
            <QuestionCard
              key={problem.question.id}
              problem={problem}
              onSubmit={handleAnswerSubmit}
              disabled={isSubmitting}
              setStreak={setStreak}
            />
          )
        )}
      </main>
    </div>
  );
};

export default Home;
