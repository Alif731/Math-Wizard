import { useState, useEffect } from "react";
import Confetti from "react-confetti";

import "../sass/components/questionCard.scss";
import "../sass/components/question_type/conceptualQuestion.scss";
import "../sass/components/question_type/visualBarModel.scss";
import "../sass/components/question_type/matchTheFollowing.scss";
import "../sass/components/question_type/directInputQuestion.scss";
import "../sass/components/question_type/schemaQuestion.scss";

import GhostPanel from "./GhostPanel.jsx";
import ConceptualQuestion from "./Question_Type/ConceptualQuestion";
import VisualBarModel from "./Question_Type/VisualBarModel";
import MatchTheFollowing from "./Question_Type/MatchTheFollowing";
import DirectInputQuestion from "./Question_Type/DirectInputQuestion";
import SchemaQuestion from "./Question_Type/Phase2/SchemaQuestion.jsx";
import {
  buildSubmissionResponse,
  createInitialResponse,
  isQuestionResponseReady,
} from "../utils/questionValidation";

const audioSuccess = new Audio("/success1.mp3");
const audioFailure = new Audio("/failure.mp3");

const QuestionCard = ({
  problem,
  onSubmit,
  onNext,
  disabled,
  // FIX: Added a default empty object so it doesn't crash if omitted by Homepage!
  practiceSummary = { correct: 0, attempted: 0 },
}) => {
  const [answer, setAnswer] = useState(() =>
    createInitialResponse(problem?.question),
  );
  const [feedback, setFeedback] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    setAnswer(createInitialResponse(problem?.question));
    setFeedback(null);
    setIsSuccess(false);
    setIsError(false);
    setSelectedOption(null);
  }, [problem]);

  const playSuccessSound = () => {
    audioSuccess.currentTime = 0;
    audioSuccess.play().catch(() => {});
  };

  const playErrorSound = () => {
    audioFailure.currentTime = 0;
    audioFailure.play().catch(() => {});
  };

  const queueNextProblem = () => {
    window.setTimeout(() => onNext?.(), 3000);
  };

  const applyFeedback = (result) => {
    setFeedback(result);
    setIsSuccess(Boolean(result?.isCorrect));
    setIsError(Boolean(result) && !result.isCorrect);

    if (result?.isCorrect) {
      // playSuccessSound();
    } else {
      playErrorSound();
    }
  };

  const submitStructuredResponse = async (overrideResponse) => {
    if (!problem?.question || feedback || disabled) return;

    const isSyntheticEvent =
      overrideResponse &&
      typeof overrideResponse === "object" &&
      "preventDefault" in overrideResponse;

    const responseToSubmit =
      isSyntheticEvent || overrideResponse === undefined
        ? buildSubmissionResponse(problem.question, answer)
        : overrideResponse;

    if (!isQuestionResponseReady(problem.question, answer)) return;

    try {
      const result = await onSubmit(responseToSubmit);
      applyFeedback(result);
      queueNextProblem();
    } catch (error) {
      console.error("Failed to submit:", error);
    }
  };

  const handleOptionClick = async (option) => {
    if (isSuccess || isError) return;
    setSelectedOption(option);

    const rawCorrect = problem?.question?.correctAnswer || problem?.answer;
    if (rawCorrect === undefined || rawCorrect === null) {
      onSubmit(option);
      return;
    }

    const isCorrect = String(option).trim() === String(rawCorrect).trim();

    if (isCorrect) {
      setIsSuccess(true);
      playSuccessSound();
      setTimeout(() => onSubmit(option), 3000);
    } else {
      setIsError(true);
      playErrorSound();
      setTimeout(() => onSubmit(option), 2600);
    }
  };

  const handleDirectSubmit = async (event) => {
    if (event?.preventDefault) event.preventDefault();

    if (!problem?.question || feedback || disabled) return;

    const textAnswer =
      typeof answer === "string"
        ? answer
        : answer?.textAnswer || answer?.slots?.answer || "";

    if (!String(textAnswer || "").trim()) return;

    try {
      const result = await onSubmit(textAnswer);

      applyFeedback(result);

      queueNextProblem();
    } catch (error) {
      console.error("Failed to submit:", error);
    }
  };
  // const handleDirectSubmit = async (event) => {
  //   if (event?.preventDefault) event.preventDefault();
  //   if (!problem?.question || feedback || disabled) return;

  //   // 1. Extract textAnswer safely based on the Phase 2 schema
  //   const textAnswer =
  //     typeof answer === "string"
  //       ? answer
  //       : answer?.textAnswer || answer?.slots?.answer || "";

  //   const userAnswer = String(textAnswer || "").trim();
  //   if (!userAnswer) return;

  //   // 2. The actual submission to the backend, wrapped in a reusable function
  //   const executeSubmit = async () => {
  //     try {
  //       const result = await onSubmit(userAnswer);
  //       applyFeedback(result);
  //       queueNextProblem();
  //     } catch (error) {
  //       console.error("Failed to submit:", error);
  //     }
  //   };

  //   // 3. Client-side check for animations
  //   const rawCorrect = problem?.question?.correctAnswer;

  //   // If we don't have a correct answer to check against locally, skip animation
  //   if (rawCorrect === undefined || rawCorrect === null) {
  //     executeSubmit();
  //     return;
  //   }

  //   const dbAnswer = String(rawCorrect).trim();
  //   const isCorrect = userAnswer === dbAnswer;

  //   // 4. Check for animations using BOTH Phase 1 and Phase 2 types
  //   const animatedTypes = [
  //     // Phase 2 Types
  //     "bar_model_builder",
  //     "equation_builder",
  //     "direct",
  //     // Phase 1 Legacy Types
  //     "visual",
  //     "icons_items",
  //     "algebraic",
  //   ];

  //   const shouldAnimate = animatedTypes.includes(problem?.question?.type);

  //   // 5. Animation delay wrapping the NEW submission logic
  //   if (shouldAnimate) {
  //     if (isCorrect) {
  //       playSuccessSound();
  //       setIsSuccess(true);
  //       // Wait 3 seconds to let animation play, then run backend logic
  //       setTimeout(() => executeSubmit(), 3000);
  //     } else {
  //       playErrorSound();
  //       setIsError(true);
  //       // Wait 2.6 seconds, then run backend logic
  //       setTimeout(() => executeSubmit(), 2600);
  //     }
  //   } else {
  //     // If no animation is needed for this question type
  //     executeSubmit();
  //   }
  // };

  const handleMatchComplete = async (isValid) => {
    if (feedback || disabled) return;

    try {
      const result = await onSubmit(isValid ? "matched" : "wrong_answer");
      applyFeedback(result);
      queueNextProblem();
    } catch (error) {
      console.error("Failed to submit:", error);
    }
  };

  if (!problem) return <div className="loading-state">Loading...</div>;

  const questionType = problem.question.type;
  const isConceptual = questionType === "conceptual";
  const visualData = problem.question.visualData;
  const isIconsItems = questionType === "icons_items";
  const isWorksheetDriven = [
    "practice",
    "equations",
    "bar_to_equation",
    "schema_bar_model",
    "schema_equation",
    "schema_solve",
    "word_to_bar",
  ].includes(problem?.question?.moduleStage);
  const showTelemetry = Boolean(problem?.adaptiveState) && import.meta.env.DEV;
  const isMatchTheFollowing =
    isIconsItems &&
    Array.isArray(visualData?.leftItems) &&
    Array.isArray(visualData?.rightItems);

  const matchLeft = visualData?.leftItems || [];
  const matchRight = visualData?.rightItems || [];

  return (
    <div className="question-shell">
      <div className="question-shell__main">
        <div className="question__card">
          {/* Stats Container combining Correct, Attempted */}
          {/* Using optional chaining '?.correct' as a secondary safety net */}
          <div
            className="practice-summary"
            style={{ display: "flex", gap: "1rem", alignItems: "center" }}
          >
            <div className="practice-summary__stat">
              <span
                className="practice-summary__label"
                style={{ marginRight: "0.5rem" }}
              >
                Correct:
              </span>
              <strong>{practiceSummary?.correct || 0}</strong>
            </div>

            <div className="practice-summary__stat">
              <span
                className="practice-summary__label"
                style={{ marginRight: "0.5rem" }}
              >
                Attempted:
              </span>
              <strong>{practiceSummary?.attempted || 0}</strong>
            </div>
          </div>

          {isSuccess && (
            <Confetti recycle={false} numberOfPieces={500} gravity={0.3} />
          )}

          {isWorksheetDriven ? (
            <SchemaQuestion
              question={problem.question}
              response={answer}
              setResponse={setAnswer}
              feedback={feedback}
              onCheck={submitStructuredResponse}
              onNext={onNext}
              isSubmitting={disabled}
            />
          ) : (
            <>
              <div className="question__text">
                <span className="highlight3">Q,</span> {problem.question.text}
              </div>

              {isMatchTheFollowing && (
                <div className="icons-items__container">
                  <MatchTheFollowing
                    key={problem.question.id}
                    id={problem.question.id || problem.question._id}
                    leftItems={matchLeft}
                    rightItems={matchRight}
                    onComplete={handleMatchComplete}
                  />
                </div>
              )}

              {questionType === "visual" && visualData && (
                <VisualBarModel
                  problem={problem}
                  answer={answer}
                  setAnswer={setAnswer}
                  isSuccess={isSuccess}
                  isError={isError}
                  handleKeyDown={(event) => {
                    if (event.key === "Enter") handleDirectSubmit(event);
                  }}
                  handleSubmit={handleDirectSubmit}
                />
              )}

              {isConceptual ? (
                <ConceptualQuestion
                  problem={problem}
                  selectedOption={selectedOption}
                  isSuccess={isSuccess}
                  isError={isError}
                  handleOptionClick={handleOptionClick}
                />
              ) : (
                <div>
                  {!isConceptual &&
                    questionType !== "visual" &&
                    !isIconsItems && (
                      <DirectInputQuestion
                        answer={answer}
                        setAnswer={setAnswer}
                        isSuccess={isSuccess}
                        isError={isError}
                        handleSubmit={handleDirectSubmit}
                      />
                    )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showTelemetry && (
        <aside className="question-shell__telemetry">
          <GhostPanel
            adaptiveData={problem?.adaptiveState}
            conceptId={problem?.concept?.id}
          />
        </aside>
      )}
    </div>
  );
};

export default QuestionCard;
