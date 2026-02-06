// Big O Analysis: O(1) - Rendering cost is constant per interaction.
import React, { useState } from "react";
import "../sass/components/questionCard.scss"; // Ensure this file exists

const QuestionCard = ({ problem, onSubmit }) => {
  const [answer, setAnswer] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(answer);
    setAnswer("");
  };

  if (!problem) return <div className="loading-state">Loading...</div>;

  // Check if this is a "Multiple Choice" style question
  const isConceptual = problem.question.type === "conceptual";

  const questionType = problem.question.type;
  const visualData = problem.question.visualData;
  return (
    <div className="question__card">
      {/* <h1 className="card__header">{problem.concept.title}</h1> */}
      {isConceptual && (
        <h2 className="card__header__type">
          Select Correct Operator{" "}
        </h2>
      )}

      <div className="question__text">
        {" "}
        <span className="highlight1">Q,</span> {problem.question.text}
      </div>

      {/* --- SECTION 1: VISUAL BAR MODEL (Only for 'visual' type) --- */}
      {questionType === "visual" && visualData && (
        <div className="visual__container">
          {/* Top Bracket with ? */}
          {visualData.showTotal && (
            <div className="visual__bracket">
              <span className="visual__question-mark">?</span>
              <div className="visual__line"></div>
            </div>
          )}

          {/* Bars */}
          <div className="visual__bars">
            {visualData.parts.map((part, index) => (
              <div
                key={index}
                className="visual__segment"
                style={{
                  backgroundColor: part.color,
                  flex: part.value, // Proportional width
                }}
              >
                <span className="visual__label">{part.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isConceptual ? (
        // 1. OPTION MODE (For Signs)
        <div className="card__options">
          {problem.question.options?.map((option) => (
            <button
              key={option}
              className="card__options__btn"
              onClick={() => onSubmit(option)} // Submit immediately on click
            >
              {option}
            </button>
          ))}
        </div>
      ) : ( // 3. Normal quesiton
        <form onSubmit={handleSubmit} className="answer-form">
          <input
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="answer-input"
            autoFocus
          />
          <button type="submit" className="submit-btn">
            Submit Answer
          </button>
        </form>
      )}
    </div>
  );
};

export default QuestionCard;
