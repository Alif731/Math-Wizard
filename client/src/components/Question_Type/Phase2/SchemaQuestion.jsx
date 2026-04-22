import React, { useEffect, useState } from "react";
import {
  getDisplayedTextAnswer,
  isCompareAnswerInputQuestion,
  isQuestionResponseReady,
} from "../../../utils/questionValidation";
import {
  joinSlotValue,
  buildCompareAnswerPrompt,
  getActiveInputLabel,
  getDefaultActiveField,
  getBarLabel,
} from "./SchemaUtils";
import {
  PracticeTabs,
  StageTabs,
  Keypad,
  VerificationPanel,
  EquationBoard,
} from "./WorksheetParts";
import BarModel, { CompareGuidedAnswerModel } from "./BarModelRenderer";

const SchemaQuestion = ({
  question,
  response,
  setResponse,
  feedback,
  onCheck,
  onNext,
  isSubmitting,
}) => {
  const hasFeedback = Boolean(feedback);
  const canCheck =
    isQuestionResponseReady(question, response) &&
    !isSubmitting &&
    !hasFeedback;
  const isSchemaStage = String(question?.moduleStage || "").startsWith(
    "schema_",
  );
  const isCompareAnswerInput = isCompareAnswerInputQuestion(question);
  const showPromptStrip = !["practice", "equations"].includes(
    question?.moduleStage,
  );

  const compareAnswerLabel = isCompareAnswerInput
    ? getBarLabel(question?.barModelSpec?.smaller, question?.barModelSpec)
    : "";
  const compareAnswerCopy = buildCompareAnswerPrompt(compareAnswerLabel);

  const showUnknownButton =
    Object.values(question?.validation?.slots || {}).some(
      (value) => String(value).trim() === "?",
    ) || question?.moduleStage === "bar_to_equation";
  const showOperatorPad =
    question?.inputMode === "keypad_equation" &&
    question?.equationSpec?.operatorEditable &&
    response?.activeField === "__operator__";
  const activeInputLabel = isCompareAnswerInput
    ? ""
    : getActiveInputLabel(question, response?.activeField);

  const triggerCheck = () => {
    if (canCheck) onCheck();
  };

  const updateActiveSlotValue = (nextValue) => {
    if (hasFeedback) return;
    if (response?.activeField === "__operator__") {
      setResponse((current) => ({ ...(current || {}), operator: nextValue }));
      return;
    }
    const targetField = response?.activeField;
    if (!targetField) return;
    setResponse((current) => ({
      ...(current || {}),
      slots: {
        ...(current?.slots || {}),
        [targetField]: joinSlotValue(current?.slots?.[targetField], nextValue),
      },
    }));
  };

  const handleBackspace = () => {
    if (hasFeedback || response?.activeField === "__operator__") return;
    const targetField = response?.activeField;
    if (!targetField) return;
    setResponse((current) => ({
      ...(current || {}),
      slots: {
        ...(current?.slots || {}),
        [targetField]: String(current?.slots?.[targetField] || "").slice(0, -1),
      },
    }));
  };

  const handleClear = () => {
    if (hasFeedback) return;
    if (response?.activeField === "__operator__") {
      setResponse((current) => ({ ...(current || {}), operator: "" }));
      return;
    }
    const targetField = response?.activeField;
    if (!targetField) return;
    setResponse((current) => ({
      ...(current || {}),
      slots: { ...(current?.slots || {}), [targetField]: "" },
    }));
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      const targetTag = event.target?.tagName;
      const isTypingField =
        targetTag === "INPUT" ||
        targetTag === "TEXTAREA" ||
        event.target?.isContentEditable;

      if (question?.inputMode === "text_answer" || isCompareAnswerInput) {
        if (isTypingField && event.key === "Enter" && canCheck) {
          event.preventDefault();
          triggerCheck();
        }
        return;
      }

      if (isTypingField || hasFeedback || isSubmitting) return;
      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        updateActiveSlotValue(event.key);
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        handleBackspace();
        return;
      }
      if (event.key === "Delete") {
        event.preventDefault();
        handleClear();
        return;
      }
      if (event.key === "?" && showUnknownButton) {
        event.preventDefault();
        updateActiveSlotValue("?");
        return;
      }
      if (
        response?.activeField === "__operator__" &&
        (event.key === "+" || event.key === "-")
      ) {
        event.preventDefault();
        setResponse((current) => ({ ...(current || {}), operator: event.key }));
        return;
      }
      if (event.key === "Enter" && canCheck) {
        event.preventDefault();
        triggerCheck();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    canCheck,
    hasFeedback,
    isSubmitting,
    question?.inputMode,
    isCompareAnswerInput,
    response,
    setResponse,
    showUnknownButton,
  ]);

  useEffect(() => {
    if (
      hasFeedback ||
      isSubmitting ||
      question?.inputMode === "text_answer" ||
      isCompareAnswerInput ||
      response?.activeField
    )
      return;
    const defaultField = getDefaultActiveField(question);
    if (!defaultField) return;
    setResponse((current) => ({
      ...(current || {}),
      activeField: defaultField,
    }));
  }, [
    hasFeedback,
    isSubmitting,
    question,
    isCompareAnswerInput,
    response?.activeField,
    setResponse,
  ]);

  const [showHint, setShowHint] = useState(false);

  // Automatically hide the hint again when the question changes
  useEffect(() => {
    setShowHint(false);
  }, [question]);

  return (
    <div className="worksheet">
      <div className="worksheet__helper">
        {/* Question Type */}
        <div className="worksheet-title">
          {question?.promptTitle || "practice"}
        </div>

        {/* Schema  Type */}
        <div className="worksheet__topline-main">
          {/* {isSchemaStage && (
            <StageTabs currentStage={question?.stageIndex || 1} />
          )} */}

          {question?.schemaKind && (
            <div
              className={`schema-badge schema-badge--${question.schemaKind}`}
            >
              {question.schemaKind} Schema
            </div>
          )}
        </div>

        {/* Interactive Toggle Hint Button */}
        {(() => {
          const helpText = isCompareAnswerInput
            ? "Use the bars to work out the missing amount, then type your answer."
            : question?.helperText;

          if (!helpText) return null;

          return (
            <button
              type="button"
              className={`worksheet-help ${showHint ? "is-open" : ""}`}
              onClick={() =>
                setShowHint(!showHint)
              } /* 1. Toggles open/closed */
              /* 2. Removed the disabled lock completely */
            >
              {showHint ? helpText : "Show Hint"}
            </button>
          );
        })()}
      </div>
      <div className="worksheet__topline">
        <div className="worksheet__topline-main">
          {question?.moduleStage === "practice" && (
            <PracticeTabs activeKey={question?.practiceMode} />
          )}
          {isSchemaStage && (
            <StageTabs currentStage={question?.stageIndex || 1} />
          )}
        </div>
      </div>

      {showPromptStrip && (
        <div className="worksheet-prompt">
          {"Q,"} {question?.text}
        </div>
      )}

      {(question?.moduleStage === "practice" ||
        question?.moduleStage === "equations" ||
        question?.moduleStage === "bar_to_equation" ||
        question?.moduleStage === "schema_equation") && (
        <>
          {(question?.moduleStage === "bar_to_equation" ||
            question?.moduleStage === "schema_equation") &&
            question?.barModelSpec && (
              <BarModel
                question={question}
                response={response}
                setResponse={setResponse}
              />
            )}
          <EquationBoard
            question={question}
            response={response}
            setResponse={setResponse}
            locked={hasFeedback}
            feedback={feedback}
          />

          {/* {!hasFeedback &&
            question?.inputMode !== "text_answer" &&
            !isCompareAnswerInput &&
            activeInputLabel && (
              <div className="worksheet-target-hint">
                Current Selected: <strong>{activeInputLabel}</strong>
              </div>
            )} */}
        </>
      )}

      {(question?.moduleStage === "schema_bar_model" ||
        question?.moduleStage === "word_to_bar") &&
        (isCompareAnswerInput ? (
          <>
            <CompareGuidedAnswerModel question={question} />
            <label className="worksheet-answer-field worksheet-answer-field--guided">
              <span>{compareAnswerCopy.prompt}</span>
              <input
                type="text"
                inputMode="numeric"
                value={getDisplayedTextAnswer(response)}
                onChange={(event) =>
                  !hasFeedback &&
                  setResponse((current) => ({
                    ...(current || {}),
                    textAnswer: event.target.value,
                  }))
                }
                disabled={hasFeedback || isSubmitting}
                placeholder={compareAnswerCopy.placeholder}
              />
            </label>
          </>
        ) : (
          <BarModel
            question={question}
            response={response}
            setResponse={setResponse}
          />
        ))}

      {question?.moduleStage === "schema_solve" && (
        <div className="worksheet-solve">
          <div className="worksheet-solve__equation">
            {question?.validation?.displayEquation ||
              question?.equationSpec?.displayEquation}
          </div>

          <label className="worksheet-answer-field">
            <input
              type="text"
              inputMode="none" /* Prevents the native mobile keyboard from popping up */
              readOnly /* Forces the user to use your custom keypad */
              value={getDisplayedTextAnswer(response) || ""}
              disabled={hasFeedback || isSubmitting}
              placeholder="Your answer"
            />
          </label>

          <Keypad
            title="Type your answer."
            showUnknown={false}
            showOperatorPad={false}
            disabled={hasFeedback || isSubmitting}
            onDigit={(digit) => {
              if (!hasFeedback) {
                setResponse((current) => ({
                  ...(current || {}),
                  textAnswer: (current?.textAnswer || "") + digit,
                }));
              }
            }}
            onBackspace={() => {
              if (!hasFeedback) {
                setResponse((current) => ({
                  ...(current || {}),
                  textAnswer: (current?.textAnswer || "").slice(0, -1),
                }));
              }
            }}
            onClear={() => {
              if (!hasFeedback) {
                setResponse((current) => ({
                  ...(current || {}),
                  textAnswer: "",
                }));
              }
            }}
          />
        </div>
      )}

      {question?.inputMode !== "text_answer" && !isCompareAnswerInput && (
        <Keypad
          title={showOperatorPad ? "Choose the operator" : "Enter the number"}
          showUnknown={showUnknownButton}
          showOperatorPad={showOperatorPad}
          onDigit={updateActiveSlotValue}
          onUnknown={() => updateActiveSlotValue("?")}
          onBackspace={handleBackspace}
          onClear={handleClear}
          onOperator={(operator) =>
            setResponse((current) => ({ ...(current || {}), operator }))
          }
          disabled={hasFeedback || isSubmitting}
        />
      )}

      {feedback && (
        <div
          className={`worksheet-feedback ${feedback.isCorrect ? "is-success" : "is-error"}`}
        >
          {feedback.isCorrect
            ? feedback?.explanation || "Good Job!"
            : `Try again next time. Correct answer: ${feedback?.correctAnswer ?? ""}`}
        </div>
      )}

      {feedback?.isCorrect && question?.moduleStage === "schema_solve" && (
        <VerificationPanel question={question} />
      )}

      <div className="worksheet-actions">
        {hasFeedback ? (
          <div className="worksheet-button worksheet-button--status">
            Loading Next Problem.
          </div>
        ) : (
          <button
            type="button"
            className="worksheet-button worksheet-button--primary"
            disabled={!canCheck}
            onClick={triggerCheck}
          >
            {question?.moduleStage === "schema_solve"
              ? "Check answer →"
              : "Submit ✓"}
          </button>
        )}
      </div>
    </div>
  );
};

export default SchemaQuestion;
