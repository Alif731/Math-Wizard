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

  return (
    <div className="question-card">
      <h1 className="card-header">{problem.concept.title}</h1>

      <div className="question-text">
        {" "}
        <span className="highlight1">Q,</span> {problem.question.text}
      </div>

      <form onSubmit={handleSubmit} className="answer-form">
        <input
          type="text"
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
    </div>
  );
};

export default QuestionCard;
