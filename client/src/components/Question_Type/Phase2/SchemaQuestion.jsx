import React, { useEffect, useMemo, useState } from "react";
import {
  getDisplayedTextAnswer,
  isCompareAnswerInputQuestion,
  isQuestionResponseReady,
  isVariableIdentificationQuestion,
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
import CustomSelect from "../../CustomSelect";

// Deterministic shuffle using a simple seed derived from question text.
// Ensures the same question always shows the same shuffled order,
// but prevents students from seeing variables in the story-order.
const seededShuffle = (array, seed) => {
  const result = [...array];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 16807 + 11) % 2147483647;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const hashString = (str) =>
  (str || "").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

const VariableIdentificationPanel = ({
  question,
  response,
  setResponse,
  disabled,
  hasFeedback,
}) => {
  const sentences = question?.visualData?.sentences || [];
  const variables = question?.visualData?.variables || [];
  const expectedVars = question?.validation?.variables || {};

  const shuffledVariables = useMemo(
    () => seededShuffle(variables, hashString(question?.text)),
    [variables, question?.text],
  );

  const updateVariable = (key, field, value) => {
    if (disabled) return;
    setResponse((current) => ({
      ...(current || {}),
      variables: {
        ...(current?.variables || {}),
        [key]: {
          ...(current?.variables?.[key] || {}),
          [field]: value,
        },
      },
    }));
  };

  // 🔥 1. Format the sentences for the CustomSelect
  const sentenceOptions = useMemo(() => {
    return sentences.map((sentence, index) => ({
      value: String(index + 1),
      label: String(index + 1),
    }));
  }, [sentences]);

  return (
    <div className="variable-identification">
      <div className="variable-identification__sentences">
        {sentences.map((sentence, index) => (
          <div className="variable-sentence" key={`${index}-${sentence}`}>
            <span>{index + 1}</span>
            <p>{sentence}</p>
          </div>
        ))}
      </div>

      <div className="variable-table">
        {shuffledVariables.map((variable) => {
          const answer = response?.variables?.[variable.key] || {};
          const isUnknown = expectedVars[variable.key]?.value === "?";

          // 1. Add logic to determine row state (Success / Error)
          let rowStateClass = "";

          if (hasFeedback) {
            const isRowComplete =
              answer.sentence && (answer.value || isUnknown);
            if (isRowComplete) {
              // Compare the student's answer to the expected variables
              const expected = expectedVars[variable.key];
              const isSentenceCorrect =
                String(answer.sentence) === String(expected.sentence);

              // If it's the unknown variable (?), we only check the sentence.
              // If it's a known variable, we check both sentence and value.
              const isValueCorrect =
                isUnknown || String(answer.value) === String(expected.value);

              if (isSentenceCorrect && isValueCorrect) {
                rowStateClass = "is-correct"; // Turns Emerald Green
              } else {
                rowStateClass = "is-wrong"; // Turns Rose Red & Shakes
              }
            }
          }

          return (
            // 2. Inject the rowStateClass here into the wrapper div
            <div className={`variable-row ${rowStateClass}`} key={variable.key}>
              <div className="variable-row__label">{variable.label}</div>

              <label>
                <span>Sentence</span>
                <CustomSelect
                  options={sentenceOptions}
                  value={answer.sentence || ""}
                  disabled={disabled || rowStateClass === "is-correct"} // Locks if correct
                  onChange={(selectedValue) =>
                    updateVariable(variable.key, "sentence", selectedValue)
                  }
                  placeholder="Select"
                />
              </label>

              <label>
                <span>Value</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={isUnknown ? "?" : answer.value || ""}
                  disabled={
                    disabled || isUnknown || rowStateClass === "is-correct"
                  } // Locks if correct
                  placeholder="?"
                  className={isUnknown ? "variable-value--locked" : ""}
                  onChange={(event) =>
                    !isUnknown &&
                    updateVariable(variable.key, "value", event.target.value)
                  }
                />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};
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
  const isSchemaStage = question?.stageTotal === 3;
  const isCompareAnswerInput = isCompareAnswerInputQuestion(question);
  const isVariableIdentification = isVariableIdentificationQuestion(question);
  const isDirectSchemaSolve = question?.moduleStage === "schema_direct_solve";
  const showPromptStrip = !["practice", "equations"].includes(
    question?.moduleStage,
  );
  const locksUnknownSlots = [
    "word_to_bar",
    "bar_to_equation",
    "schema_bar_model",
    "schema_equation",
  ].includes(question?.moduleStage);

  const compareAnswerLabel = isCompareAnswerInput
    ? getBarLabel(question?.barModelSpec?.smaller, question?.barModelSpec)
    : "";
  const compareAnswerCopy = buildCompareAnswerPrompt(compareAnswerLabel);

  const showUnknownButton =
    !locksUnknownSlots &&
    Object.values(question?.validation?.slots || {}).some(
      (value) => String(value).trim() === "?",
    );

  // const showOperatorPad =
  //   question?.inputMode === "keypad_equation" &&
  //   question?.equationSpec?.operatorEditable &&
  //   response?.activeField === "__operator__";
  const showOperatorPad =
    question?.inputMode === "keypad_equation" &&
    question?.equationSpec?.operatorEditable &&
    response?.activeField === "__operator__" &&
    question?.schemaKind !== "combine";

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
    if (hasFeedback) return;
    // Block backspace if the field is the forced operator
    if (
      response?.activeField === "__operator__" &&
      question?.schemaKind === "combine"
    )
      return;
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

    const targetField = response?.activeField;
    if (!targetField) return;

    // Prevent clearing the operator in a combine schema
    if (targetField === "__operator__" && question?.schemaKind === "combine") {
      return;
    }

    setResponse((current) => {
      if (targetField === "__operator__") {
        return { ...current, operator: "" };
      }
      return {
        ...current,
        slots: { ...current?.slots, [targetField]: "" },
      };
    });
  };

  useEffect(() => {
    // 1. Safety check
    if (!question || hasFeedback || isSubmitting) return;

    // 2. Identify the schema
    const isCombine = question?.schemaKind?.toLowerCase() === "combine";

    if (isCombine) {
      // 3. Force the operator state if it's missing or wrong
      if (response?.operator !== "+") {
        setResponse((current) => ({
          ...(current || {}),
          operator: "+",
        }));
      }

      // 4. Force focus to the first number box if nothing is selected
      if (!response?.activeField) {
        setResponse((current) => ({
          ...(current || {}),
          activeField: "leftTerm", // Or "slot1" based on your data
        }));
      }
    }
  }, [
    question?.id,
    response?.operator,
    response?.activeField,
    hasFeedback,
    isSubmitting,
    setResponse,
  ]);

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

  // Automatically hide the hint again when the question changes
  const [showHint, setShowHint] = useState(false);
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
              onClick={() => setShowHint(!showHint)}
            >
              {showHint ? (
                /* New wrapper for the magical reveal animation */
                <span className="hint-text-reveal">{helpText}</span>
              ) : (
                <span>
                  <span className="sparkle">✨</span> Reveal Clue
                </span>
              )}
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
                isAttempted={Boolean(feedback)}
                isCorrect={feedback?.isCorrect}
                targetField={response?.activeField}
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
            isAttempted={Boolean(feedback)}
            isCorrect={feedback?.isCorrect}
            targetField={response?.activeField}
          />
        ))}

      {isVariableIdentification && (
        <VariableIdentificationPanel
          question={question}
          response={response}
          setResponse={setResponse}
          disabled={hasFeedback || isSubmitting}
          hasFeedback={hasFeedback}
        />
      )}

      {(question?.moduleStage === "schema_solve" || isDirectSchemaSolve) && (
        <div className="worksheet-solve">
          {/* Added dynamic classes to the equation for the pulse/glow effect */}
          {(question?.validation?.displayEquation ||
            question?.equationSpec?.displayEquation) && (
            <div
              className={`worksheet-solve__equation ${hasFeedback ? (feedback?.isCorrect ? "is-correct" : "is-wrong") : ""}`}
            >
              {question?.validation?.displayEquation ||
                question?.equationSpec?.displayEquation}
            </div>
          )}

          {/* Added dynamic classes to the label to trigger the icons and input borders */}
          <label
            className={`worksheet-answer-field ${hasFeedback ? (feedback?.isCorrect ? "is-correct" : "is-wrong") : ""}`}
          >
            <input
              type="number"
              inputMode="numeric"
              value={getDisplayedTextAnswer(response) || ""}
              onChange={(event) =>
                !hasFeedback &&
                !isSubmitting &&
                setResponse((current) => ({
                  ...(current || {}),
                  textAnswer: event.target.value,
                }))
              }
              disabled={hasFeedback || isSubmitting}
              placeholder="Type Here"
            />
          </label>

          <Keypad
            title="Enter your answer."
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

      {/* {feedback && (
        <div
          className={`worksheet-feedback ${feedback.isCorrect ? "is-success" : "is-error"}`}
        >
          {feedback.isCorrect
            ? feedback?.explanation || "Good Job!"
            : `Try again next time. Correct answer: ${feedback?.correctAnswer ?? ""}`}
        </div>
      )} */}

      {/* {feedback?.isCorrect && question?.moduleStage === "schema_solve" && (
        <VerificationPanel question={question} />
      )} */}

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
            {question?.moduleStage === "schema_solve" || isDirectSchemaSolve
              ? "Check answer →"
              : "Submit ✓"}
          </button>
        )}
      </div>
    </div>
  );
};

export default SchemaQuestion;
