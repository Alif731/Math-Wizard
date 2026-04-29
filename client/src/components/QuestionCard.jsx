import { useState, useEffect } from "react";
import Confetti from "react-confetti";

import "../sass/components/questionCard.scss";
import "../sass/components/question_type/conceptualQuestion.scss";
import "../sass/components/question_type/visualBarModel.scss";
import "../sass/components/question_type/matchTheFollowing.scss";
import "../sass/components/question_type/directInputQuestion.scss";
import "../sass/components/question_type/schemaQuestion.scss";

import GhostPanel from "./GhostPanel.jsx";
import ConceptualQuestion from "./Question_Type/Phase1/ConceptualQuestion";
import VisualBarModel from "./Question_Type/Phase1/VisualBarModel";
import MatchTheFollowing from "./Question_Type/Phase1/MatchTheFollowing";
import DirectInputQuestion from "./Question_Type/Phase1/DirectInputQuestion";
import SchemaQuestion from "./Question_Type/Phase2/SchemaQuestion.jsx";
import {
  buildSubmissionResponse,
  createInitialResponse,
  isQuestionResponseReady,
} from "../utils/questionValidation";

const audioSuccess = new Audio("/success1.mp3");
const audioFailure = new Audio("/failure.mp3");
const NEXT_PROBLEM_DELAY_MS = 1800;

const getViewportSize = () => {
  if (typeof window === "undefined") {
    return { width: 0, height: 0 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

const QuestionCard = ({
  problem,
  onSubmit,
  onNext,
  disabled,
  practiceSummary = { correct: 0, attempted: 0 },
}) => {
  const [answer, setAnswer] = useState(() =>
    createInitialResponse(problem?.question),
  );
  const [feedback, setFeedback] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [viewportSize, setViewportSize] = useState(getViewportSize);

  // NEW: Holds our animation state safely
  const [statAnim, setStatAnim] = useState({ key: 0, colorClass: "" });

  // 1. When a new question loads, completely reset everything (including the animation)
  useEffect(() => {
    setAnswer(createInitialResponse(problem?.question));
    setFeedback(null);
    setIsSuccess(false);
    setIsError(false);
    setSelectedOption(null);
    setStatAnim({ key: 0, colorClass: "" }); // Ensures no popping on question load!
  }, [problem]);

  // 2. Only trigger animations when Success or Error actually occur
  useEffect(() => {
    if (isSuccess) {
      setStatAnim((prev) => ({
        key: prev.key + 1,
        colorClass: "stat-pop-success",
      }));
    } else if (isError) {
      setStatAnim((prev) => ({
        key: prev.key + 1,
        colorClass: "stat-pop-error",
      }));
    }
  }, [isSuccess, isError]);

  useEffect(() => {
    const handleResize = () => setViewportSize(getViewportSize());

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const playSuccessSound = () => {
    audioSuccess.currentTime = 0;
    audioSuccess.play().catch(() => { });
  };

  const playErrorSound = () => {
    audioFailure.currentTime = 0;
    audioFailure.play().catch(() => { });
  };

  const queueNextProblem = () => {
    window.setTimeout(() => onNext?.(), NEXT_PROBLEM_DELAY_MS);
  };

  const applyFeedback = (result) => {
    setFeedback(result);
    setIsSuccess(Boolean(result?.isCorrect));
    setIsError(Boolean(result) && !result.isCorrect);

    // if (result?.isCorrect) {
    //   playSuccessSound();
    // } else {
    //   playErrorSound();
    // }
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
      // playSuccessSound();
      setTimeout(() => onSubmit(option), 3000);
    } else {
      setIsError(true);
      // playErrorSound();
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
    "schema_direct_solve",
    "schema_equation",
    "schema_solve",
    "schema_variables",
    "word_to_bar",
  ].includes(problem?.question?.moduleStage);
  const showTelemetry = Boolean(problem?.adaptiveState) && import.meta.env.DEV;
  const isMatchTheFollowing =
    isIconsItems &&
    Array.isArray(visualData?.leftItems) &&
    Array.isArray(visualData?.rightItems);

  const matchLeft = visualData?.leftItems || [];
  const matchRight = visualData?.rightItems || [];

  const attempted = practiceSummary?.attempted || 0;
  const correct = practiceSummary?.correct || 0;

  const displayAttempted = isSuccess || isError ? attempted + 1 : attempted;
  const displayCorrect = isSuccess ? correct + 1 : correct;
  return (
    <div className="question-shell">
      <div
        className="practice-summary"
        style={{ display: "flex", gap: "1.2rem", alignItems: "center" }}
      >
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
      </div>
      <div className="question-shell__main">
        {/* Confetti rendered outside question__card to avoid clipping */}
        {isSuccess && (
          <Confetti
            key={`success-confetti-${statAnim.key}`}
            width={viewportSize.width}
            height={viewportSize.height}
            recycle={false}
            numberOfPieces={360}
            gravity={0.48}
            tweenDuration={700}
            className="success-confetti"
            style={{
              position: "fixed",
              inset: 0,
              pointerEvents: "none",
              zIndex: 9999,
            }}
          />
        )}
        <div className="question__card">
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
