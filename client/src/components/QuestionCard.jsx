// Big O Analysis: O(1) - Rendering cost is constant per interaction.
import React, { useState,useEffect } from "react";
import "../sass/components/questionCard.scss"; // Ensure this file exists
import { IoIosCheckmarkCircle } from "react-icons/io";



const QuestionCard = ({ problem, onSubmit }) => {
  const [answer, setAnswer] = useState("");
  const [isSuccess, setIsSuccess] = useState(false); 

  // Reset state when the problem changes
  useEffect(() => {
    setAnswer("");
    setIsSuccess(false);
  }, [problem]);
  console.log(problem);

  // const safeAnswer = answer ? answer.toString().trim() : "";
  // if (!safeAnswer) return;
  // const dbAnswer = problem.question.correctAnswer.toString();
  // const isCorrect = safeAnswer === dbAnswer;
const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    // 1. SAFETY: Check for empty input
    if (answer === "" || answer === null || answer === undefined) return;

    // 2. SAFETY: Check if backend data exists (prevents crash)
    const rawCorrect = problem?.question?.correctAnswer;
    if (rawCorrect === undefined || rawCorrect === null) {
      onSubmit(answer); // Submit blindly if data is missing
      return;
    }

    // 3. COMPARISON FIX: Convert both to Strings so "15" == 15
    const userAnswer = String(answer).trim();
    const dbAnswer = String(rawCorrect).trim();
    const isCorrect = userAnswer === dbAnswer;

    // 4. ANIMATION LOGIC
    if (isCorrect && problem.question.type === "visual") {
      setIsSuccess(true); // <--- Triggers the Green Bar swap

      // Wait 1.5 seconds for animation, THEN submit
      setTimeout(() => {
        onSubmit(userAnswer);
      }, 1500); 
    } else {
      // If wrong or not visual, submit immediately
      onSubmit(userAnswer);
    }
  };
  
  // Helper for Enter key in the new visual input
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  if (!problem) return <div className="loading-state">Loading...</div>;

  // Check if this is a "Multiple Choice" style question
  const isConceptual = problem.question.type === "conceptual";
  const questionType = problem.question.type;
  const visualData = problem.question.visualData;

  return (
    <div className="question__card">
      {/* <h1 className="card__header">{problem.concept.title}</h1> */}
      {/* {isConceptual && (
        <h2 className="card__header__type">
          Select Correct Operator{" "}
        </h2>
      )} */}

      <div className="question__text">
        {" "}
        <span className="highlight1">Q,</span> {problem.question.text}
      </div>

   {/* --- SECTION 1: VISUAL BAR MODEL --- */}
      {questionType === "visual" && visualData && (
        <div className="visual__container">
          {/* Top Bracket with INPUT instead of '?' */}
          {visualData.showTotal && (
            <div className="visual__bracket">
                 <input
                type="number"
                className={`visual__input ${isSuccess ? "visual__input__success" : ""}`}
                value={answer }
                onChange={(e) => !isSuccess && setAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="?"
                autoComplete="off"
                readOnly={isSuccess}
              />
              {isSuccess && (
                  <IoIosCheckmarkCircle className="visual__input__icon" />
                )}
              <div className="visual__line"><span className = 'visual__line__span'>|</span></div>
            </div>
          )}

          {/* Bars */}
      <div className={`visual__bars ${isSuccess ? "visual__bars__success" : ""}`}>
      
<div
  className={`visual__bars ${isSuccess ? "visual__bars__success" : ""}`}
>
  {visualData.parts.map((part, index) => (
    <div
      key={index}
      className="visual__segment"
      style={{
        backgroundColor: part.color,
        flex: part.value,
      }}
    >
      <span className="visual__label">{part.label}</span>
    </div>
  ))}
</div>
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
      ) : (
        // 3. Normal question
        <div>
        <form onSubmit={handleSubmit} className="answer__form"> 
        {questionType !== "visual" && (
          <input
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="answer__input"
            autoFocus
          />
        )}
          <button type="submit" className="submit__btn">
            Submit Answer
          </button>
        </form>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;

