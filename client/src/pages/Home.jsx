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
  const { userInfo } = useSelector((state) => state.auth); // 1. Initialize streak from sessionStorage (Lazy Initialization for performance)
  const [streak, setStreak] = useState(() => {
    const savedStreak = sessionStorage.getItem("mathStreak");
    return savedStreak ? Number(savedStreak) : 0;
  });

  // 2. Automatically sync streak to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem("mathStreak", streak);
  }, [streak]);
  // -----------------------------------------------------------
  const username = userInfo?.username || "student1";

  // --- RTK QUERY HOOKS ---
  const {
    data: problem,
    isLoading: loadingProblem,
    isError: errorProblem,
    refetch: refetchProblem,
  } = useGetProblemQuery(username);

  const { data: status } = useGetUserStatusQuery(username);
  const [submitAnswer, { isLoading: isSubmitting }] = useSubmitAnswerMutation();

  // --- LOCAL STATE ---
  const [feedback, setFeedback] = useState(null);

  // --- HANDLERS ---
  const handleAnswerSubmit = async (answer) => {
    if (!problem?.question) return;

    try {
      const result = await submitAnswer({
        username,
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

  if (!problem) return <div className="loading-state">Loading...</div>;
  return (
    <div className="home-page">
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
          <>
            <div className="streak__badge">
              <span className="highlight1">S</span>treak:{" "}
              <span className="highlight2">x</span>
              {streak} <span class="top"></span>
              <span class="right"></span>
              <span class="bottom"></span>
              <span class="left"></span>
            </div>
          </>
        )}

        {/* <h1 className="card__header">{problem.concept.title}</h1> */}
      </header>
      {/* Show description ONLY if the concept ID is foundation_signs or visual_icons */}
      {problem?.description && problem.concept.id === "foundation_signs" && (
        <h2 className="card__header__type">{problem.description}</h2>
      )}

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
          problem && (
            <QuestionCard
              // key={problem._id}
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
