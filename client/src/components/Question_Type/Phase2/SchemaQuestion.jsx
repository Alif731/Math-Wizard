// SchemaQuestion.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  getDisplayedTextAnswer,
  getChangeIdentificationFeedback,
  isCompareAnswerInputQuestion,
  isQuestionResponseReady,
  isVariableIdentificationQuestion,
  isChangeIdentificationQuestion,
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
  EquationTabs,
  StageTabs,
  Keypad,
  VerificationPanel,
  EquationBoard,
} from "./WorksheetParts";
import BarModel, { CompareGuidedAnswerModel } from "./BarModelRenderer";
import CustomSelect from "../../CustomSelect";
import { useSchemaProgress } from "../../useSchemaProgress";
import { useSelector } from "react-redux";

// Deterministic shuffle
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

// Helper: highlight numbers in sentence text
const highlightNumbers = (text) => {
  const parts = text.split(/(\d+)/);
  return parts.map((part, i) =>
    /^\d+$/.test(part) ? (
      <span key={i} className="variable-sentence__number">
        {part}
      </span>
    ) : (
      part
    ),
  );
};

// Without Ghost
// const VariableIdentificationPanel = ({
//   question,
//   response,
//   setResponse,
//   disabled,
//   hasFeedback,
//   isDummyMode,
//   isRevealed,
// }) => {
//   const sentences = question?.visualData?.sentences || [];
//   const variables = question?.visualData?.variables || [];
//   const expectedVars = question?.validation?.variables || {};

//   const shuffledVariables = useMemo(
//     () => seededShuffle(variables, hashString(question?.text)),
//     [variables, question?.text],
//   );

//   const updateVariable = (key, field, value) => {
//     if (disabled && !isDummyMode) return;
//     setResponse((current) => ({
//       ...(current || {}),
//       variables: {
//         ...(current?.variables || {}),
//         [key]: {
//           ...(current?.variables?.[key] || {}),
//           [field]: value,
//           // When switching to "find", clear the value
//           ...(field === "role" && value === "find" ? { value: "" } : {}),
//         },
//       },
//     }));
//   };

//   // Determine per-card feedback state
//   const getCardState = (variable) => {
//     const answer = response?.variables?.[variable.key] || {};
//     const expected = expectedVars[variable.key];
//     if (!expected) return "";

//     if (isRevealed) return "is-revealed";

//     if (!hasFeedback) return "";

//     // Check role correctness
//     const isRoleCorrect = answer.role === expected.role;
//     // For "given" variables, also check value
//     const isValueCorrect =
//       expected.role === "find" ||
//       String(answer.value) === String(expected.value);

//     if (isRoleCorrect && isValueCorrect) return "is-correct";
//     return "is-wrong";
//   };

//   // Options for the Custom Select Dropdown
//   const roleOptions = [
//     { value: "given", label: "✓ Given Value" },
//     { value: "find", label: "? Unknown Value " },
//   ];

//   return (
//     <div className="variable-identification">
//       {/* Sentences at top */}
//       <div className="variable-identification__sentences">
//         {sentences.map((sentence, index) => (
//           <div className="variable-sentence" key={`${index}-${sentence}`}>
//             <span>{index + 1}</span>
//             <p>{sentence}</p>
//           </div>
//         ))}
//       </div>

//       {/* Variable cards */}
//       <div className="variable-cards">
//         {shuffledVariables.map((variable) => {
//           const answer = response?.variables?.[variable.key] || {};
//           const expected = expectedVars[variable.key];
//           const cardState = getCardState(variable);
//           const isCardLocked =
//             cardState === "is-correct" || cardState === "is-revealed";
//           // const isCardLocked =
//           //   cardState === "is-correct" ||
//           //   cardState === "is-revealed" ||
//           //   (isDummyMode && expected?.role === "find");

//           const displayRole = isRevealed ? expected?.role : answer.role;
//           // const displayRole = isRevealed
//           //   ? expected?.role
//           //   : isDummyMode && expected?.role === "find"
//           //     ? "find"
//           //     : answer.role;

//           const displayValue = isRevealed ? expected?.value : answer.value;

//           return (
//             <div
//               className={`variable-row-horizontal ${cardState}`}
//               key={variable.key}
//             >
//               {/* Left Side: Variable Name with Yellow Accent */}
//               <div className="variable-row-horizontal__name">
//                 {variable.label}
//               </div>

//               {/* Right Side: Split Controls */}
//               <div className="variable-row-horizontal__controls">
//                 {/* Control 1: Role Selection */}
//                 <div className="control-group">
//                   <span className="control-label">ROLE</span>
//                   <CustomSelect
//                     options={roleOptions}
//                     value={displayRole || ""}
//                     onChange={(val) =>
//                       updateVariable(variable.key, "role", val)
//                     }
//                     placeholder="Select"
//                     disabled={isCardLocked}
//                   />
//                 </div>

//                 {/* Control 2: Value Input or Placeholder */}
//                 <div className="control-group">
//                   <span className="control-label">VALUE</span>
//                   {displayRole === "find" ? (
//                     <div className="find-placeholder">?</div>
//                   ) : (
//                     <input
//                       type="text"
//                       inputMode="numeric"
//                       value={displayValue || ""}
//                       disabled={isCardLocked || displayRole !== "given"}
//                       placeholder="?"
//                       onChange={(e) =>
//                         updateVariable(variable.key, "value", e.target.value)
//                       }
//                     />
//                   )}
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {/* Feedback bar */}
//       {/* {hasFeedback && !isDummyMode && (
//         <div
//           className={`variable-feedback-bar ${
//             shuffledVariables.every((v) => getCardState(v) === "is-correct")
//               ? "variable-feedback-bar--success"
//               : "variable-feedback-bar--error"
//           }`}
//         >
//           {shuffledVariables.every((v) => getCardState(v) === "is-correct")
//             ? "Correct! You have identified all given and unknown variables."
//             : "Some classifications or values are wrong — check the highlighted cards."}
//         </div>
//       )} */}
//       {/*
//       {isRevealed && (
//         <div className="variable-feedback-bar variable-feedback-bar--success">
//           Correct answers have been revealed above.
//         </div>
//       )} */}
//     </div>
//   );
// };

// ===========================================
// Change Module 2: Two-Step Identification
// Step 2a: Is the quantity increasing or decreasing?
// Step 2b: Pick the correct bar model layout
// ===========================================
const ChangeIdentificationPanel = ({
  question,
  response,
  setResponse,
  disabled,
  hasFeedback,
  feedbackData,
}) => {
  const subStep = response?.subStep || "2a";
  const labels = question?.visualData?.labels || {};
  const changeFeedback = getChangeIdentificationFeedback(question, response);
  const hasDirectionFeedback =
    hasFeedback &&
    subStep === "2a" &&
    feedbackData?.changeDirectionCorrect !== undefined;
  const hasBarModelFeedback =
    hasFeedback &&
    subStep === "2b" &&
    feedbackData?.barModelCorrect !== undefined;

  // Step 2a feedback
  const step2aCorrect =
    hasFeedback &&
    subStep === "2a" &&
    feedbackData?.changeDirectionCorrect;
  const step2aWrong =
    hasFeedback &&
    subStep === "2a" &&
    feedbackData?.changeDirectionCorrect === false;

  // Step 2b feedback
  const step2bCorrect =
    hasFeedback &&
    subStep === "2b" &&
    feedbackData?.barModelCorrect;
  const step2bWrong =
    hasFeedback &&
    subStep === "2b" &&
    feedbackData?.barModelCorrect === false;

  const handleDirectionSelect = (dir) => {
    if (disabled) return;
    setResponse((prev) => ({
      ...prev,
      changeDirection: dir,
    }));
  };

  const handleBarModelSelect = (model) => {
    if (disabled) return;
    setResponse((prev) => ({
      ...prev,
      barModel: model,
    }));
  };

  const getDirectionClass = (direction) =>
    [
      response?.changeDirection === direction ? "is-selected" : "",
      hasDirectionFeedback && changeFeedback.correctDirection === direction
        ? "is-correct"
        : "",
      hasDirectionFeedback &&
      changeFeedback.selectedDirection === direction &&
      changeFeedback.correctDirection !== direction
        ? "is-wrong"
        : "",
    ]
      .filter(Boolean)
      .join(" ");

  const getBarModelClass = (model) =>
    [
      response?.barModel === model ? "is-selected" : "",
      hasBarModelFeedback && changeFeedback.correctBarModel === model
        ? "is-correct"
        : "",
      hasBarModelFeedback &&
      changeFeedback.selectedBarModel === model &&
      changeFeedback.correctBarModel !== model
        ? "is-wrong"
        : "",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <div className="change-identify">
      {/* Step 2a: Increase or Decrease? */}
      {subStep === "2a" && (
        <div className="change-identify__step">
          <h3 className="change-identify__title">
            Is the quantity <strong>increasing</strong> or{" "}
            <strong>decreasing</strong>?
          </h3>
          <div className="change-identify__options">
            <button
              type="button"
              className={`change-identify__option change-identify__option--increase ${getDirectionClass("increase")}`}
              onClick={() => handleDirectionSelect("increase")}
              disabled={disabled}
            >
              <span className="change-identify__option-icon">📈</span>
              <span className="change-identify__option-label">Increase</span>
            </button>
            <button
              type="button"
              className={`change-identify__option change-identify__option--decrease ${getDirectionClass("decrease")}`}
              onClick={() => handleDirectionSelect("decrease")}
              disabled={disabled}
            >
              <span className="change-identify__option-icon">📉</span>
              <span className="change-identify__option-label">Decrease</span>
            </button>
          </div>
          {step2aCorrect && (
            <div className="change-identify__feedback change-identify__feedback--correct">
              ✓ Correct! The quantity is{" "}
              <strong>{response?.changeDirection === "increase" ? "increasing" : "decreasing"}</strong>.
            </div>
          )}
          {step2aWrong && (
            <div className="change-identify__feedback change-identify__feedback--wrong">
              ✕ Not quite. The correct answer is{" "}
              <strong>
                {question?.validation?.changeDirection === "increase"
                  ? "Increase"
                  : "Decrease"}
              </strong>.
            </div>
          )}
        </div>
      )}

      {/* Step 2b: Pick the bar model */}
      {subStep === "2b" && (
        <div className="change-identify__step">
          <h3 className="change-identify__title">
            Pick the correct bar model for this problem:
          </h3>
          <div className="change-identify__bar-options">
            {/* Increase bar: End on top (bigger), Start + Change on bottom */}
            <button
              type="button"
              className={`change-identify__bar-option ${getBarModelClass("increase_bar")}`}
              onClick={() => handleBarModelSelect("increase_bar")}
              disabled={disabled}
            >
              <div className="change-identify__bar-label">Increase Model</div>
              <div className="static-bar-model static-bar-model--increase">
                <div className="static-bar-model__top">
                  <div className="static-bar__block static-bar__block--end">
                    {labels.end || "End"}
                  </div>
                </div>
                <div className="static-bar-model__bottom">
                  <div className="static-bar__block static-bar__block--start">
                    {labels.start || "Start"}
                  </div>
                  <div className="static-bar__block static-bar__block--change">
                    {labels.change || "Change"}
                  </div>
                </div>
              </div>
            </button>

            {/* Decrease bar: Start on top (bigger), End + Change on bottom */}
            <button
              type="button"
              className={`change-identify__bar-option ${getBarModelClass("decrease_bar")}`}
              onClick={() => handleBarModelSelect("decrease_bar")}
              disabled={disabled}
            >
              <div className="change-identify__bar-label">Decrease Model</div>
              <div className="static-bar-model static-bar-model--decrease">
                <div className="static-bar-model__top">
                  <div className="static-bar__block static-bar__block--start">
                    {labels.start || "Start"}
                  </div>
                </div>
                <div className="static-bar-model__bottom">
                  <div className="static-bar__block static-bar__block--end">
                    {labels.end || "End"}
                  </div>
                  <div className="static-bar__block static-bar__block--change">
                    {labels.change || "Change"}
                  </div>
                </div>
              </div>
            </button>
          </div>
          {step2bCorrect && (
            <div className="change-identify__feedback change-identify__feedback--correct">
              ✓ Correct! That is the right bar model.
            </div>
          )}
          {step2bWrong && (
            <div className="change-identify__feedback change-identify__feedback--wrong">
              ✕ Not quite. The correct bar model is the{" "}
              <strong>
                {question?.validation?.correctBarModel === "increase_bar"
                  ? "Increase"
                  : "Decrease"}
              </strong>{" "}
              model.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const VariableIdentificationPanel = ({
  question,
  response,
  setResponse,
  disabled,
  hasFeedback,
  isDummyMode,
  isRevealed,
  animateCards = false,
}) => {
  const sentences = question?.visualData?.sentences || [];
  const variables = question?.visualData?.variables || [];
  const expectedVars = question?.validation?.variables || {};
  const { userInfo } = useSelector((state) => state.auth);
  // const [variableCardsReady, setVariableCardsReady] = useState(false);

  // useEffect(() => {
  //   setVariableCardsReady(false);
  //   const timer = setTimeout(() => setVariableCardsReady(true), 250); // same delay
  //   return () => clearTimeout(timer);
  // }, [question?.id]);

  const { hasCompleted, markCompleted } = useSchemaProgress(
    question?.schemaKind,
    userInfo?.id || userInfo?._id,
  );
  // For change schema: fixed chronological order (start → change → end)
  // For other schemas: seeded shuffle as before
  const shuffledVariables = useMemo(() => {
    if (question?.schemaKind === "change") {
      const order = ["start", "change", "end"];
      const sorted = [...variables].sort(
        (a, b) => order.indexOf(a.key) - order.indexOf(b.key),
      );
      // Only use sorted if all 3 keys matched; else fall through to shuffle
      if (sorted.length === variables.length && sorted.every((v, i) => order.indexOf(v.key) === i)) {
        return sorted;
      }
    }
    return seededShuffle(variables, hashString(question?.text));
  }, [variables, question?.text, question?.schemaKind]);

  // 1. GHOST LOGIC: Check if the user has started interacting
  // Returns true if ANY variable has a 'role' or 'value' defined in the response state
  const hasStarted = Object.values(response?.variables || {}).some(
    (v) => v?.role || v?.value,
  );

  // const updateVariable = (key, field, value) => {
  //   if (disabled && !isDummyMode) return;
  //   if (!hasStarted) {
  //     markCompleted();
  //   }
  //   setResponse((current) => ({
  //     ...(current || {}),
  //     variables: {
  //       ...(current?.variables || {}),
  //       [key]: {
  //         ...(current?.variables?.[key] || {}),
  //         [field]: value,
  //         // When switching to "find", automatically clear the value field
  //         ...(field === "role" && value === "find" ? { value: "" } : {}),
  //       },
  //     },
  //   }));
  // };

  // Determine per-card feedback state

  const updateVariable = (key, field, value) => {
    if (disabled && !isDummyMode) return;

    // Only mark as completed on real first interaction, not dummy mode
    if (!hasStarted && !isDummyMode) {
      markCompleted();
    }

    setResponse((current) => ({
      ...(current || {}),
      variables: {
        ...(current?.variables || {}),
        [key]: {
          ...(current?.variables?.[key] || {}),
          [field]: value,
          ...(field === "role" && value === "find" ? { value: "" } : {}),
        },
      },
    }));
  };

  const getCardState = (variable) => {
    const answer = response?.variables?.[variable.key] || {};
    const expected = expectedVars[variable.key];
    if (!expected) return "";

    if (isRevealed) return "is-revealed";

    if (!hasFeedback) return "";

    // Check role correctness
    const isRoleCorrect = answer.role === expected.role;
    // For "given" variables, also check value. For "find", value check isn't strictly necessary here based on your logic, but we ensure it matches the expected condition.
    const isValueCorrect =
      expected.role === "find" ||
      String(answer.value) === String(expected.value);

    if (isRoleCorrect && isValueCorrect) return "is-correct";
    return "is-wrong";
  };

  // Options for the Custom Select Dropdown
  const roleOptions = [
    { value: "given", label: "✓ Given Value" },
    { value: "find", label: "? Unknown Value " },
  ];

  return (
    <div className="variable-identification">
      {/* Sentences at top */}
      <div className="variable-identification__sentences">
        {sentences.map((sentence, index) => (
          <div className="variable-sentence" key={`${index}-${sentence}`}>
            <span>{index + 1}</span>
            <p>{sentence}</p>
          </div>
        ))}
      </div>

      {/* Variable cards */}
      {/* <div className="variable-cards"> */}
      <div className={`variable-cards ${animateCards ? "animate-unfold" : ""}`}>
        {shuffledVariables.map((variable) => {
          const answer = response?.variables?.[variable.key] || {};
          const expected = expectedVars[variable.key];
          const cardState = getCardState(variable);
          const isCardLocked =
            cardState === "is-correct" || cardState === "is-revealed";

          const displayRole = isRevealed ? expected?.role : answer.role;
          const displayValue = isRevealed ? expected?.value : answer.value;

          // 🔥 2. GHOST LOGIC: Apply to ALL cards until the user starts
          const hasStartedForVar = answer.role || answer.value;
          const isGhostHint =
            !hasStartedForVar && !isDummyMode && !hasCompleted;

          // const isGhostHint = !hasStarted && !isDummyMode && !hasCompleted;
          // 🔥 3. DYNAMIC TEXT: Tailor the hint to the specific expected answer
          const ghostRoleText =
            expected?.role === "given"
              ? "e.g: Given Value"
              : "e.g:Unknown Value";

          const ghostValueText =
            expected?.role === "given" ? `e.g., ${expected?.value}` : "?";

          return (
            <div
              className={`variable-row-horizontal ${cardState} ${isGhostHint ? "is-hinted" : ""}`}
              key={variable.key}
            >
              {/* Left Side: Variable Name with Tag */}
              <div className="variable-row-horizontal__name">
                {question?.schemaKind === "change" && (
                  <span className={`variable-tag variable-tag--${variable.key}`}>
                    {variable.key === "start" ? "Start" : variable.key === "change" ? "Change" : "End"}
                  </span>
                )}
                {variable.label}
              </div>

              {/* Right Side: Split Controls */}
              <div className="variable-row-horizontal__controls">
                {/* Control 1: Role Selection */}
                <div className="control-group">
                  <span className="control-label">ROLE</span>
                  <CustomSelect
                    options={roleOptions}
                    value={displayRole || ""}
                    onChange={(val) =>
                      updateVariable(variable.key, "role", val)
                    }
                    placeholder="Select"
                    disabled={isCardLocked}
                    /* 🔥 Pass Ghosting Props */
                    isGhosted={isGhostHint}
                    ghostPlaceholder={isGhostHint ? ghostRoleText : ""}
                  />
                </div>

                {/* Control 2: Value Input or Placeholder
                <div className="control-group">
                  <span className="control-label">VALUE</span>
                  {displayRole === "find" ? (
                    <div className="find-placeholder">?</div>
                  ) : (
                    <input
                      type="text"
                      inputMode="numeric"
                      // 🔥 Add Ghost Input Class
                      className={`worksheet-input ${isGhostHint && !displayValue ? "ghost-input" : ""}`}
                      value={displayValue || ""}
                      disabled={isCardLocked || displayRole !== "given"}
                      // 🔥 Use dynamic value text for placeholder
                      placeholder={isGhostHint ? ghostValueText : "?"}
                      onChange={(e) =>
                        updateVariable(variable.key, "value", e.target.value)
                      }
                    />
                  )}
                </div> */}
                {/* Control 2: Value Input or Placeholder */}
                <div className="control-group">
                  <span className="control-label">VALUE</span>
                  {displayRole === "find" ? (
                    <div className="find-placeholder">?</div>
                  ) : (
                    <>
                      {isGhostHint && !displayValue ? (
                        // 👇 Ghost mode: contenteditable div with shimmer
                        <div
                          className="worksheet-input ghost-input shimmer-div"
                          contentEditable={
                            !isCardLocked && displayRole === "given"
                          }
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const newValue = e.currentTarget.innerText.trim();
                            if (newValue) {
                              updateVariable(variable.key, "value", newValue);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.currentTarget.blur();
                            }
                          }}
                        >
                          {ghostValueText}
                        </div>
                      ) : (
                        <input
                          type="text"
                          inputMode="numeric"
                          className={`worksheet-input ${isGhostHint && !displayValue ? "ghost-input" : ""}`}
                          value={displayValue || ""}
                          disabled={isCardLocked || displayRole !== "given"}
                          placeholder={isGhostHint ? ghostValueText : "?"}
                          onChange={(e) =>
                            updateVariable(
                              variable.key,
                              "value",
                              e.target.value,
                            )
                          }
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const getTrueExpectedValue = (questionData, key) => {
  // 1. Check Equation Template
  const templateItem = questionData?.equationSpec?.template?.find(
    (t) => t.key === key,
  );
  if (templateItem) return String(templateItem.value || "").trim();

  // 2. Check Bar Model Spec (Finds any bar name: muffins, stamps, toys, etc.)
  const spec = questionData?.barModelSpec;
  if (spec) {
    const match = Object.values(spec).find((v) => v?.key === key);
    if (match) return String(match.value || "").trim();
  }
  return "";
};
// 🔥 FIX: Perfect Algebraic Solver (Handles both + and - automatically)
// const solveMissingValue = (q) => {
//   const template = q?.equationSpec?.template || [];
//   const slotItems = template.filter((t) => t.type === "slot");
//   if (slotItems.length < 3) return null;

//   // 1. Get the true expected values for all slots
//   const vals = slotItems.map((s) => {
//     const v = getTrueExpectedValue(q, s.key);
//     return { key: s.key, num: parseFloat(v), isUnknown: v === "?" || v === "" };
//   });

//   const unknown = vals.find((v) => v.isUnknown);
//   const equalIdx = template.findIndex((t) => t.value === "=");
//   if (!unknown || equalIdx === -1) return null;

//   // 2. Find the operator (Defaults to +, but looks for -)
//   let operator = "+";
//   const opItem = template.find((t) => t.type === "operator");
//   if (opItem && (opItem.value === "+" || opItem.value === "-")) {
//     operator = opItem.value;
//   } else if (q?.equationSpec?.operator) {
//     operator = q.equationSpec.operator;
//   } else if (q?.operator) {
//     operator = q.operator;
//   }

//   // 3. Identify the "Result" side of the "=" sign (the side with only 1 slot)
//   const resultSlot = vals.find((v) => {
//     const idx = template.findIndex((t) => t.key === v.key);
//     const onLeft = idx < equalIdx;
//     const countOnSide = vals.filter(
//       (v2) =>
//         template.findIndex((t2) => t2.key === v2.key) < equalIdx === onLeft,
//     ).length;
//     return countOnSide === 1;
//   });

//   if (!resultSlot) return null;

//   // 4. Identify the two "Terms" on the other side
//   const terms = vals.filter((v) => v.key !== resultSlot.key);
//   if (terms.length !== 2) return null;

//   const [term1, term2] = terms; // term1 is left of the operator, term2 is right

//   // --- ALGEBRA SOLVER ---
//   // Case A: The unknown is the Result (e.g., 12 - 5 = ?)
//   if (unknown.key === resultSlot.key) {
//     return operator === "-"
//       ? String(term1.num - term2.num)
//       : String(term1.num + term2.num);
//   }

//   // Case B: The unknown is Term 1 (e.g., ? - 5 = 7)
//   if (unknown.key === term1.key) {
//     return operator === "-"
//       ? String(resultSlot.num + term2.num)
//       : String(Math.abs(resultSlot.num - term2.num));
//   }

//   // Case C: The unknown is Term 2 (e.g., 12 - ? = 7)
//   if (unknown.key === term2.key) {
//     return operator === "-"
//       ? String(term1.num - resultSlot.num)
//       : String(Math.abs(resultSlot.num - term1.num));
//   }

//   return null;
// };
const solveMissingValue = (q) => {
  // --- 1. EXISTING TEMPLATE SOLVER (For Modules 3 & 4) ---
  const template = q?.equationSpec?.template || [];
  const slotItems = template.filter((t) => t.type === "slot");

  // Only run the algebra solver if we actually have an equation template
  if (slotItems.length >= 3) {
    // 1. Get the true expected values for all slots
    const vals = slotItems.map((s) => {
      const v = getTrueExpectedValue(q, s.key);
      return {
        key: s.key,
        num: parseFloat(v),
        isUnknown: v === "?" || v === "",
      };
    });

    const unknown = vals.find((v) => v.isUnknown);
    const equalIdx = template.findIndex((t) => t.value === "=");

    if (unknown && equalIdx !== -1) {
      // 2. Find the operator (Defaults to +, but looks for -)
      let operator = "+";
      const opItem = template.find((t) => t.type === "operator");
      if (opItem && (opItem.value === "+" || opItem.value === "-")) {
        operator = opItem.value;
      } else if (q?.equationSpec?.operator) {
        operator = q.equationSpec.operator;
      } else if (q?.operator) {
        operator = q.operator;
      }

      // 3. Identify the "Result" side of the "=" sign
      const resultSlot = vals.find((v) => {
        const idx = template.findIndex((t) => t.key === v.key);
        const onLeft = idx < equalIdx;
        const countOnSide = vals.filter(
          (v2) =>
            template.findIndex((t2) => t2.key === v2.key) < equalIdx === onLeft,
        ).length;
        return countOnSide === 1;
      });

      if (resultSlot) {
        // 4. Identify the two "Terms" on the other side
        const terms = vals.filter((v) => v.key !== resultSlot.key);
        if (terms.length === 2) {
          const [term1, term2] = terms; // term1 is left of the operator, term2 is right

          // --- ALGEBRA SOLVER ---
          if (unknown.key === resultSlot.key) {
            return operator === "-"
              ? String(term1.num - term2.num)
              : String(term1.num + term2.num);
          }
          if (unknown.key === term1.key) {
            return operator === "-"
              ? String(resultSlot.num + term2.num)
              : String(Math.abs(resultSlot.num - term2.num));
          }
          if (unknown.key === term2.key) {
            return operator === "-"
              ? String(term1.num - resultSlot.num)
              : String(Math.abs(resultSlot.num - term1.num));
          }
        }
      }
    }
  }

  // --- 2. FALLBACK SCHEMA SOLVER (For Module 5 - No Template) ---
  const slots = q?.validation?.slots || {};
  const schema = q?.schemaKind?.toLowerCase();

  if (schema === "combine") {
    const l = parseFloat(slots.left || slots.leftTerm);
    const r = parseFloat(slots.right || slots.rightTerm);
    const t = parseFloat(slots.total || slots.result);

    if ((slots.total === "?" || isNaN(t)) && !isNaN(l) && !isNaN(r))
      return String(l + r);
    if ((slots.left === "?" || isNaN(l)) && !isNaN(t) && !isNaN(r))
      return String(t - r);
    if ((slots.right === "?" || isNaN(r)) && !isNaN(t) && !isNaN(l))
      return String(t - l);
  }

  if (schema === "change") {
    const s = parseFloat(slots.start);
    const c = parseFloat(slots.change);
    const r = parseFloat(slots.result || slots.end);
    const op = q?.equationSpec?.operator || q?.operator || "+";

    if (
      (slots.result === "?" || slots.end === "?" || isNaN(r)) &&
      !isNaN(s) &&
      !isNaN(c)
    ) {
      return op === "-" ? String(s - c) : String(s + c);
    }
    if ((slots.change === "?" || isNaN(c)) && !isNaN(s) && !isNaN(r)) {
      return op === "-" ? String(s - r) : String(Math.abs(r - s));
    }
    if ((slots.start === "?" || isNaN(s)) && !isNaN(c) && !isNaN(r)) {
      return op === "-" ? String(r + c) : String(Math.abs(r - c));
    }
  }

  // --- 3. ABSOLUTE LAST RESORT ---
  if (q?.validation?.textAnswer !== undefined)
    return String(q.validation.textAnswer);
  if (q?.validation?.answer !== undefined) return String(q.validation.answer);

  return null;
};

const SchemaQuestion = ({
  question,
  response,
  setResponse,
  feedback,
  onCheck,
  onNext,
  isSubmitting,
  isDummyMode,
  setIsDummyMode,
  isRevealed,
  setIsRevealed,
  stageResults = {},
  autoNextCountdown,
  disableAutoNext = false,
  isExiting = false,
}) => {
  const hasFeedback = Boolean(feedback);
  const isBarModelStage = Boolean(question?.barModelSpec);
  const isEquationStage = ["bar_to_equation", "schema_equation"].includes(
    question?.moduleStage,
  );

  // --- Change Identification: local 2a feedback state ---
  const [changeIdLocalFeedback, setChangeIdLocalFeedback] = useState(null);

  // Ghost setup for equation board (Module 3)
  const { userInfo } = useSelector((state) => state.auth);
  const userId = userInfo?.id || userInfo?._id;
  // console.log(userInfo); // inspect this
  const keypadWrapperRef = useRef(null);
  const {
    hasCompleted: equationGhostCompleted,
    markCompleted: markEquationGhostCompleted,
  } = useSchemaProgress(
    `equation_${question?.schemaKind}_${userId}`, // ← userId now part of the key
    userId,
  );

  // Identify practice schemas so we can apply the Equation Board rules
  const isPracticeStage = ["practice", "equations"].includes(
    question?.moduleStage,
  );

  const isEquationBoardActive = isEquationStage || isPracticeStage;
  const mathResult = useMemo(() => solveMissingValue(question), [question]);

  // Only apply ghost logic when the equation board is shown
  const isEquationGhostHint =
    isEquationBoardActive &&
    !isDummyMode &&
    !isRevealed &&
    !equationGhostCompleted &&
    !!userInfo;

  const displayQuestion = useMemo(() => {
    if (!isEquationStage) return question;
    // if (!isEquationBoardActive) return question;
    const qClone = JSON.parse(JSON.stringify(question));
    const studentSlots = response?.slots || {};
    const isCorrect = hasFeedback && feedback?.isCorrect;

    const isUnknownSlot = (key) => {
      return getTrueExpectedValue(question, key) === "?";
    };

    if (qClone.equationSpec) {
      if (question?.schemaKind === "change") {
        qClone.equationSpec.operatorEditable = false;
      }
      if (isDummyMode || isRevealed || isCorrect) {
        qClone.equationSpec.operatorEditable = false;
      }
    }

    if (qClone.equationSpec?.template) {
      qClone.equationSpec.template.forEach((item) => {
        // --- 1. OPERATOR LOGIC ---
        if (item?.type === "operator") {
          const isChangeOperator = question?.schemaKind === "change";
          const blueprintOp =
            (question?.equationSpec?.template || []).find(
              (t) => t.type === "operator" || t.key === "operator",
            )?.value || (question?.schemaKind === "combine" ? "+" : "");

          // Sync the value: show the blueprint sign in Reveal
          if (isRevealed) {
            item.value = blueprintOp;
          } else if (response?.operator) {
            item.value = response.operator;
          }

          // LOCKING & FEEDBACK LOGIC
          if (isRevealed) {
            // 🔥 REVEAL: Show default/neutral UI (No green/red borders)
            item.editable = !isChangeOperator;
            item.isCorrect = false;
            item.isWrong = false;
          } else if (isDummyMode && !isCorrect) {
            // DUMMY MODE: Locked hint (neutral look)
            item.editable = false;
            item.isCorrect = false;
            item.isWrong = false;
          } else {
            // MAIN SCREEN / SUCCESS
            item.editable = !isChangeOperator;

            // Show feedback only on Main Screen/Success
            if (hasFeedback) {
              const signIsCorrect =
                response?.operator === blueprintOp || isCorrect;
              item.isCorrect = signIsCorrect;
              item.isWrong = !signIsCorrect;
            }
          }
        }

        // --- 2. SLOT LOGIC (Preserved exactly as is) ---
        if (item?.type === "slot") {
          const isUnknown = isUnknownSlot(item.key);

          if (item.key && studentSlots[item.key] !== undefined) {
            item.value = studentSlots[item.key];
          }

          if (isRevealed) {
            const isFinalAnswerStage =
              question?.moduleStage === "schema_solve" ||
              question?.moduleStage === "schema_direct_solve" ||
              (Number(question?.stageTotal) > 1 &&
                question?.stageIndex === question?.stageTotal) ||
              question?.moduleStage === "direct";

            if (isUnknown) {
              item.value = isFinalAnswerStage ? mathResult || "?" : "?";
            } else {
              item.value = getTrueExpectedValue(question, item.key);
            }
            item.editable = true;
            item.isUnknown = false;
          } else if (isCorrect) {
            if (
              isUnknown &&
              (!item.value || String(item.value).trim() === "")
            ) {
              item.value = "?";
            }
            item.editable = true;
            item.isUnknown = false;
          } else if (isDummyMode) {
            if (isUnknown) {
              item.value = "?";
              item.editable = false;
              item.isUnknown = true;
            } else {
              item.editable = true;
              item.isUnknown = false;
            }
          } else {
            if (
              isUnknown &&
              (!item.value || String(item.value).trim() === "")
            ) {
              item.value = "?";
            } else if (!isUnknown && String(item.value).trim() === "?") {
              item.value = "";
            }
            item.editable = true;
            item.isUnknown = false;
          }
        }
      });
    }
    return qClone;
  }, [
    question,
    isEquationBoardActive,
    isEquationStage,
    isDummyMode,
    hasFeedback,
    feedback,
    isRevealed,
    mathResult,
    response,
  ]);

  const isBarModelFullyFilled = useMemo(() => {
    if (!isBarModelStage || isEquationStage) return true;

    const spec = question?.barModelSpec;
    const requiredKeys = [];

    if (spec) {
      if (
        question?.schemaKind === "change" ||
        spec.layout === "change" ||
        spec.change
      ) {
        requiredKeys.push((spec.start || spec.left)?.key);
        requiredKeys.push((spec.change || spec.right)?.key);
        requiredKeys.push((spec.end || spec.total || spec.result)?.key);
      } else {
        requiredKeys.push(spec.total?.key);
        requiredKeys.push(spec.left?.key);
        requiredKeys.push(spec.right?.key);
      }
    }

    if (requiredKeys.length === 0) return false;

    const requiredCount = requiredKeys.filter((key) => {
      const correctVal = String(
        question?.validation?.slots?.[key] ?? spec?.[key]?.value ?? "",
      ).trim();
      return correctVal !== "" && correctVal !== "?";
    }).length;

    const enteredCount = requiredKeys.filter((key) => {
      const val = String(response?.slots?.[key] || "").trim();
      return val !== "" && val !== "?";
    }).length;

    return enteredCount >= requiredCount;
  }, [
    isBarModelStage,
    isEquationStage,
    response?.slots,
    question,
    isDummyMode,
  ]);

  // --- THE STRICT LOCK: Protection for Bar Model Stage ---
  // let isBarModelFullyFilled = true;
  // if (isBarModelStage && !isEquationStage) {
  //   const spec = question?.barModelSpec;
  //   const requiredKeys = [];
  //   if (spec) {
  //     if (question?.schemaKind === "change" || spec.layout === "change") {
  //       requiredKeys.push(
  //         (spec.start || spec.left)?.key,
  //         (spec.change || spec.right)?.key,
  //         (spec.end || spec.total || spec.result)?.key,
  //       );
  //     } else {
  //       requiredKeys.push(spec.total?.key, spec.left?.key, spec.right?.key);
  //     }
  //   }
  //   isBarModelFullyFilled = requiredKeys.every((key) => {
  //     const val = response?.slots?.[key];
  //     return val !== undefined && String(val).trim() !== "";
  //   });
  // }

  // const isEquationFilled = useMemo(() => {
  //   if (!isEquationStage) return true;
  //   const slots = response?.slots || {};
  //   const filledCount = Object.values(slots).filter(
  //     (v) => String(v || "").trim() !== "",
  //   ).length;
  //   return filledCount >= 3;
  // }, [isEquationStage, response?.slots]);

  const isEquationFilled = useMemo(() => {
    if (!isEquationStage) return true;
    if (!isEquationBoardActive) return true;
    const slots = response?.slots || {};

    // 1. Only look at keys belonging to the CURRENT question template
    const currentKeys = (question?.equationSpec?.template || [])
      .filter((item) => item.type === "slot" && item.key)
      .map((item) => item.key);

    if (currentKeys.length === 0) return false;

    const isFinalAnswerStage =
      question?.moduleStage === "schema_solve" ||
      question?.moduleStage === "schema_direct_solve" ||
      (Number(question?.stageTotal) > 1 &&
        question?.stageIndex === question?.stageTotal) ||
      question?.moduleStage === "direct";

    const opItem = (question?.equationSpec?.template || []).find(
      (i) => i.type === "operator",
    );
    const requiresOperator =
      opItem && opItem.editable !== false && question?.schemaKind !== "combine";
    const hasOperator = !requiresOperator || Boolean(response?.operator);
    if (isFinalAnswerStage) {
      return (
        currentKeys.every((key) => {
          const val = String(slots[key] || "").trim();
          return val !== "" && val !== "?";
        }) && hasOperator
      );
    } else {
      const requiredCount = currentKeys.filter((key) => {
        const correctVal = getTrueExpectedValue(question, key);
        return correctVal !== "" && correctVal !== "?";
      }).length;

      const enteredCount = currentKeys.filter((key) => {
        const val = String(slots[key] || "").trim();
        return val !== "" && val !== "?";
      }).length;

      return enteredCount >= requiredCount && hasOperator;
    }
    // 🔥 Make sure isDummyMode is in the dependency array
  }, [
    isEquationBoardActive,
    isEquationStage,
    response?.slots,
    response?.operator,
    question,
    isDummyMode,
  ]);

  // const canCheck =
  //   (isEquationStage
  //     ? isEquationFilled
  //     : isQuestionResponseReady(question, response)) &&
  //   !isSubmitting &&
  //   !hasFeedback;

  const isDirectSchemaSolve = question?.moduleStage === "schema_direct_solve";
  const isSolveStage =
    question?.moduleStage === "schema_solve" || isDirectSchemaSolve;

  const canCheck =
    (isVariableIdentificationQuestion(question)
      ? isQuestionResponseReady(question, response)
      : isEquationBoardActive
        ? isEquationFilled
        : isBarModelStage
          ? isBarModelFullyFilled
          : isQuestionResponseReady(question, response)) &&
    !isSubmitting &&
    !hasFeedback;

  const isSchemaStage = Number(question?.stageTotal) > 1;
  const isCompareAnswerInput = isCompareAnswerInputQuestion(question);
  const isVariableIdentification = isVariableIdentificationQuestion(question);
  const isChangeIdentification = isChangeIdentificationQuestion(question);
  const showPromptStrip = !["practice", "equations"].includes(
    question?.moduleStage,
  );
  const [keypadReady, setKeypadReady] = useState(false);

  const locksUnknownSlots = ["word_to_bar", "schema_bar_model"].includes(
    question?.moduleStage,
  );
  const compareAnswerLabel = isCompareAnswerInput
    ? getBarLabel(question?.barModelSpec?.smaller, question?.barModelSpec)
    : "";
  const compareAnswerCopy = buildCompareAnswerPrompt(compareAnswerLabel);

  const showUnknownButton =
    isEquationStage ||
    (!locksUnknownSlots &&
      Object.values(question?.validation?.slots || {}).some(
        (value) => String(value).trim() === "?",
      ));

  const showOperatorPad =
    question?.inputMode === "keypad_equation" &&
    question?.equationSpec?.operatorEditable &&
    response?.activeField === "__operator__" &&
    question?.schemaKind !== "combine" &&
    !isDummyMode;

  const activeInputLabel = isCompareAnswerInput
    ? ""
    : getActiveInputLabel(question, response?.activeField);

  const triggerCheck = () => {
    if (!canCheck) return;

    // --- Change Identification 2-step intercept ---
    if (isChangeIdentification && response?.subStep === "2a") {
      const directionCorrect =
        response?.changeDirection === question?.validation?.changeDirection;

      if (directionCorrect) {
        // Correct! Advance to step 2b
        setChangeIdLocalFeedback({ step: "2a", correct: true });
        setTimeout(() => {
          setChangeIdLocalFeedback(null);
          setResponse((prev) => ({
            ...prev,
            subStep: "2b",
            barModel: "",
          }));
        }, 1200);
      } else {
        // Wrong direction: submit immediately so server feedback can show
        // the selected wrong option and the correct option on the same screen.
        onCheck();
      }
      return;
    }

    onCheck();
  };

  const isSlotLockedInDummy = (field) => {
    if (!isDummyMode || !isEquationStage || !field) return false;
    const expected = String(question?.validation?.slots?.[field] || "").trim();
    return expected === "?" || expected === "";
  };

  const updateActiveSlotValue = (nextValue) => {
    if (hasFeedback) return;

    if (isEquationGhostHint) {
      markEquationGhostCompleted();
    }

    //  Strict operator validation
    if (response?.activeField === "__operator__") {
      if (nextValue === "+" || nextValue === "-") {
        setResponse((current) => ({ ...(current || {}), operator: nextValue }));
      }
      return; // If it's not a + or -, drop it completely
    }
    if (response?.activeField === "__operator__") {
      setResponse((current) => ({ ...(current || {}), operator: nextValue }));
      return;
    }
    const targetField = response?.activeField;
    if (!targetField || isSlotLockedInDummy(targetField)) return;
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
    if (
      response?.activeField === "__operator__" &&
      question?.schemaKind === "combine"
    )
      return;
    if (hasFeedback || response?.activeField === "__operator__") return;
    const targetField = response?.activeField;
    if (!targetField || isSlotLockedInDummy(targetField)) return;
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
    if (!targetField || isSlotLockedInDummy(targetField)) return;
    if (targetField === "__operator__" && question?.schemaKind === "combine")
      return;
    setResponse((current) => {
      if (targetField === "__operator__") return { ...current, operator: "" };
      return { ...current, slots: { ...current?.slots, [targetField]: "" } };
    });
  };

  // 🔥 FIX: Push the correct math result AND correct story numbers into the memory on success OR reveal
  // useEffect(() => {
  //   if ((hasFeedback && feedback?.isCorrect) || isRevealed) {
  //     const numericResult = solveMissingValue(question);

  //     setResponse((prev) => {
  //       const newSlots = { ...prev.slots };
  //       let changed = false;

  //       // Get all keys used in the equation
  //       const templateKeys = (question?.equationSpec?.template || [])
  //         .filter((item) => item.type === "slot" && item.key)
  //         .map((item) => item.key);

  //       templateKeys.forEach((key) => {
  //         const trueExpected = getTrueExpectedValue(question, key);
  //         const isTrueUnknown = trueExpected === "?";

  //         // 1. If it's the unknown box, inject the calculated math result
  //         if (isTrueUnknown && numericResult) {
  //           if (newSlots[key] !== numericResult) {
  //             newSlots[key] = numericResult;
  //             changed = true;
  //           }
  //         }
  //         // 2. REVEAL FIX: If it's a number box, overwrite the student's wrong answer with the original story number
  //         else if (!isTrueUnknown) {
  //           if (newSlots[key] !== trueExpected) {
  //             newSlots[key] = trueExpected;
  //             changed = true;
  //           }
  //         }
  //       });

  //       return changed ? { ...prev, slots: newSlots } : prev;
  //     });
  //   }
  // }, [hasFeedback, feedback?.isCorrect, isRevealed, question, setResponse]);
  // 🔥 FIX 4: Push the correct numbers into memory AND clear the active selection
  useEffect(() => {
    if ((hasFeedback && feedback?.isCorrect) || isRevealed) {
      // 🔥 ADD THIS: If they solved the equation successfully, take the training wheels off!
      if (isEquationStage && !isDummyMode) {
        markEquationGhostCompleted();
      }
      const numericResult = solveMissingValue(question);
      const isFinalAnswerStage =
        question?.moduleStage === "schema_solve" ||
        question?.moduleStage === "schema_direct_solve" ||
        (Number(question?.stageTotal) > 1 &&
          question?.stageIndex === question?.stageTotal) ||
        question?.moduleStage === "direct";

      setResponse((prev) => {
        const newSlots = { ...prev.slots };
        let changed = false;

        const templateKeys = (question?.equationSpec?.template || [])
          .filter((item) => item.type === "slot" && item.key)
          .map((item) => item.key);

        templateKeys.forEach((key) => {
          const trueExpected = getTrueExpectedValue(question, key);
          const isTrueUnknown = trueExpected === "?";

          // 1. Inject the math answer if final stage, otherwise keep "?"
          if (isTrueUnknown && numericResult) {
            const desiredUnknownValue = isFinalAnswerStage
              ? numericResult
              : "?";
            if (newSlots[key] !== desiredUnknownValue) {
              newSlots[key] = desiredUnknownValue;
              changed = true;
            }
          }
          // 2. Overwrite student's wrong numbers with correct story numbers
          else if (!isTrueUnknown) {
            if (newSlots[key] !== trueExpected) {
              newSlots[key] = trueExpected;
              changed = true;
            }
          }
        });

        // 🔥 THE FIX: Clear the active field so the dark blue ring disappears, making all boxes identical
        if (prev.activeField !== null) {
          changed = true;
        }

        return changed ? { ...prev, slots: newSlots, activeField: null } : prev;
      });
    }
  }, [hasFeedback, feedback?.isCorrect, isRevealed, question, setResponse]);

  const handleTryAgain = () => {
    setIsDummyMode(true);
    // --- Scenario D: Solve Stage ---
    if (isSolveStage) {
      setResponse((prev) => ({
        ...(prev || {}),
        textAnswer: "",
      }));
      return;
    }

    // --- Scenario A: Equation Stage ---
    if (isEquationStage) {
      const newSlots = {};
      let autoFocusKey = null;

      const templateKeys = (question?.equationSpec?.template || [])
        .filter((item) => item.type === "slot" && item.key)
        .map((item) => item.key);

      templateKeys.forEach((key) => {
        const isTrueUnknown = getTrueExpectedValue(question, key) === "?";

        if (isTrueUnknown) {
          newSlots[key] = "?";
        } else {
          newSlots[key] = "";
          if (!autoFocusKey && key !== "operator") autoFocusKey = key;
        }
      });

      // Find the exact operator (+ or -) from the template blueprint
      const expectedOp =
        (question?.equationSpec?.template || []).find(
          (item) =>
            item.type === "operator" &&
            (item.value === "+" || item.value === "-"),
        )?.value || (question?.schemaKind === "combine" ? "+" : "");

      setResponse((prev) => ({
        ...prev,
        slots: newSlots,
        operator: expectedOp, // Automatically sets the + or - sign!
        activeField: autoFocusKey || "leftTerm",
      }));
      return;
    }

    // --- Scenario C: Variable Identification Stage ---
    if (isVariableIdentification) {
      // In dummy mode for variable ID, clear wrong cards' responses
      // but keep correct ones intact
      const newVars = {};
      const currentVars = response?.variables || {};
      const expected = question?.validation?.variables || {};

      Object.keys(expected).forEach((key) => {
        const submitted = currentVars[key] || {};
        const exp = expected[key];
        const isRoleCorrect = submitted.role === exp.role;
        const isValueCorrect =
          exp.role === "find" || String(submitted.value) === String(exp.value);

        if (isRoleCorrect && isValueCorrect) {
          // Keep correct answers locked
          newVars[key] = { ...submitted };
        } else {
          // Reset wrong answers
          newVars[key] = { role: "", value: "" };
        }
      });

      setResponse((prev) => ({
        ...prev,
        variables: newVars,
      }));
      return;
    }

    // --- Scenario B: Bar Model Stage (RESTORED TO ORIGINAL) ---
    const spec = question?.barModelSpec;
    let autoFocusKey = null;

    if (spec) {
      const keys =
        question?.schemaKind === "change" ||
        spec.layout === "change" ||
        spec.change
          ? [
              (spec.start || spec.left)?.key,
              (spec.change || spec.right)?.key,
              (spec.end || spec.total || spec.result)?.key,
            ]
          : [spec.total?.key, spec.left?.key, spec.right?.key];

      autoFocusKey = keys.find((key) => {
        const expected = String(
          question?.validation?.slots?.[key] ?? spec?.[key]?.value ?? "",
        ).trim();
        return expected !== "?" && expected !== "";
      });
    }

    setResponse((prev) => ({
      ...prev,
      slots: {},
      activeField: autoFocusKey,
    }));
  };

  useEffect(() => {
    if (!question || hasFeedback || isSubmitting) return;
    const isCombine = question?.schemaKind?.toLowerCase() === "combine";
    if (isEquationStage && !isDummyMode) {
      setResponse((current) => {
        const newSlots = { ...current?.slots };
        let changed = false;
        question?.equationSpec?.template?.forEach((item) => {
          if (item?.type === "slot" && item.key && newSlots[item.key] !== "") {
            newSlots[item.key] = "";
            changed = true;
          }
        });
        if (isCombine && current?.operator !== "+") changed = true;
        // if (current?.activeField !== "leftTerm") changed = true;
        if (current?.activeField !== (isEquationGhostHint ? null : "leftTerm"))
          changed = true;
        return changed
          ? {
              ...current,
              slots: newSlots,
              operator: isCombine ? "+" : current?.operator,
              // activeField: "leftTerm",
              activeField: isEquationGhostHint ? null : "leftTerm",
            }
          : current;
      });
    }
    // }, [question?.id, isEquationStage, isDummyMode, isEquationGhostHint]);
  }, [question?.id, isEquationStage, isDummyMode]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      // 1. Global Enter key handler for workflow progression
      if (event.key === "Enter") {
        if (canCheck && !isSubmitting) {
          event.preventDefault();
          triggerCheck();
          return;
        }

        const showNext =
          feedback?.isCorrect ||
          isRevealed ||
          (!isBarModelStage &&
            !isVariableIdentification &&
            !isSolveStage &&
            !isPracticeStage &&
            hasFeedback &&
            !feedback?.isCorrect);

        if (showNext && !isSubmitting) {
          event.preventDefault();
          onNext();
          return;
        }

        const showTryAgain =
          hasFeedback &&
          !feedback?.isCorrect &&
          (isBarModelStage ||
            isEquationStage ||
            isVariableIdentification ||
            isSolveStage) &&
          !isDummyMode &&
          !isRevealed;

        if (showTryAgain && !isSubmitting) {
          event.preventDefault();
          handleTryAgain();
          return;
        }

        const showReveal =
          (isDummyMode || isPracticeStage) &&
          hasFeedback &&
          !feedback?.isCorrect &&
          !isRevealed;

        if (showReveal && !isSubmitting) {
          event.preventDefault();
          setIsRevealed(true);
          return;
        }
      }

      const targetTag = event.target?.tagName;
      const isTypingField =
        targetTag === "INPUT" ||
        targetTag === "TEXTAREA" ||
        event.target?.isContentEditable;

      if (question?.inputMode === "text_answer" || isCompareAnswerInput) {
        // Handled enter above for text inputs
        return;
      }

      if (isTypingField || hasFeedback || isSubmitting) return;
      if (/^\d$/.test(event.key) || event.key === "?") {
        event.preventDefault();
        if (response?.activeField === "__operator__") return; // Drops the keypress completely
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
      if (
        response?.activeField === "__operator__" &&
        (event.key === "+" || event.key === "-")
      ) {
        event.preventDefault();
        // 🔥 ADD THIS: Kill the hint if they type the operator
        if (isEquationGhostHint) markEquationGhostCompleted();
        setResponse((current) => ({ ...(current || {}), operator: event.key }));
        return;
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
    feedback,
    isRevealed,
    isBarModelStage,
    isVariableIdentification,
    isSolveStage,
    isPracticeStage,
    isDummyMode,
    isEquationStage,
    onNext,
    question,
    setIsRevealed,
  ]);

  // ------------------------ Conditional Auto-Scroll & Unfold (Module 2-5)------------------------
  useEffect(() => {
    if (hasFeedback) return; // Never scroll or animate after feedback

    setKeypadReady(false); // Reset animation state on new question

    const initTimer = setTimeout(() => {
      const wrapperEl = keypadWrapperRef.current;
      if (!wrapperEl) {
        setKeypadReady(true);
        return;
      }

      // 1. Calculate if the keypad will fit on the screen
      const rect = wrapperEl.getBoundingClientRect();
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;

      // We estimate the keypad needs about 300px of space to unfold safely
      const needsScroll = rect.top + 300 > viewportHeight;

      if (needsScroll) {
        // SCROLL NEEDED: Add 200ms delay before scrolling, then wait 650ms to unfold
        setTimeout(() => {
          wrapperEl.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => setKeypadReady(true), 300);
        }, 200);
      } else {
        // NO SCROLL NEEDED: Fast unfold after 200ms
        setTimeout(() => setKeypadReady(true), 200);
      }
    }, 50); // Tiny initial delay to let React paint the DOM

    return () => clearTimeout(initTimer);
  }, [question?.id, hasFeedback]);

  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    setShowHint(false);
  }, [question]);

  // ------------------------ Conditional Auto-Scroll & Unfold (Module 1)------------------------
  const [animateCards, setAnimateCards] = useState(false);
  const actionsRef = useRef(null);
  useEffect(() => {
    if (question?.moduleStage !== "schema_variables" || hasFeedback) return;

    setAnimateCards(false); // reset animation

    const initTimer = setTimeout(() => {
      const actionsEl = actionsRef.current;
      if (!actionsEl) {
        setAnimateCards(true);
        return;
      }

      const rect = actionsEl.getBoundingClientRect();
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      const needsScroll = rect.bottom > viewportHeight;

      if (needsScroll) {
        setTimeout(() => {
          actionsEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
          setTimeout(() => setAnimateCards(true), 300);
        }, 200);
      } else {
        setTimeout(() => setAnimateCards(true), 200);
      }
    }, 50);

    return () => clearTimeout(initTimer);
  }, [question?.id, hasFeedback]);

  return (
    <div className={`worksheet ${hasFeedback ? "is-completed" : ""}`}>
      <div className="worksheet-utility-bar">
        {/* Left Side: Title & Badge */}
        <div className="worksheet-utility-bar__left">
          <div className="worksheet-title">
            {question?.promptTitle || "practice"}
          </div>
          {question?.schemaKind && (
            <div
              className={`schema-badge schema-badge--${question.schemaKind}`}
            >
              {question.schemaKind} Schema
            </div>
          )}
        </div>
        {/* Right Side: The "Reveal Clue" button */}
        <div className="worksheet-utility-bar__right">
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
                  <span className="hint-text-reveal">{helpText}</span>
                ) : (
                  <span className="sparkle__main">
                    <span className="sparkle">✨</span> How to Play?
                  </span>
                )}
              </button>
            );
          })()}
        </div>
      </div>
      {/* Only render the top line wrapper if there is actually a tab to show inside it */}
      {(question?.moduleStage === "practice" || question?.moduleStage === "equations" || isSchemaStage) && (
        <div className="worksheet__topline">
          <div className="worksheet__topline-main">
            {question?.moduleStage === "practice" && (
              <PracticeTabs activeKey={question?.practiceMode} />
            )}
            {question?.moduleStage === "equations" && (
              <EquationTabs activeKey={question?.practiceMode} />
            )}
            {isSchemaStage && (
              <StageTabs
                currentStage={question?.stageIndex || 1}
                stageResults={stageResults}
                stageTotal={question?.stageTotal || 3}
              />
            )}
          </div>
        </div>
      )}

      {showPromptStrip && (
        <div className="worksheet-prompt">
          {"Q,"} {question?.text}
        </div>
      )}

      {/* MODULE 3: EQUATION BUILDING */}
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
                isDummyMode={isDummyMode}
                isRevealed={isRevealed}
                isReadOnly={isEquationStage}
              />
            )}
          <div className={isRevealed ? "is-revealed-board" : ""}>
            <EquationBoard
              question={displayQuestion}
              response={response}
              setResponse={setResponse}
              locked={hasFeedback}
              feedback={isRevealed ? null : feedback}
              isGhostHint={isEquationGhostHint} // add
              markCompleted={markEquationGhostCompleted} // add
            />
          </div>
        </>
      )}

      {/* MODULE 2: BAR MODEL BUILDING */}
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
            isDummyMode={isDummyMode}
            isRevealed={isRevealed}
            isReadOnly={false}
          />
        ))}

      {isVariableIdentification && (
        <VariableIdentificationPanel
          question={question}
          response={response}
          setResponse={setResponse}
          disabled={hasFeedback || isSubmitting}
          hasFeedback={hasFeedback}
          isDummyMode={isDummyMode}
          isRevealed={isRevealed}
          animateCards={animateCards}
        />
      )}

      {isChangeIdentification && (
        <ChangeIdentificationPanel
          question={question}
          response={response}
          setResponse={setResponse}
          disabled={hasFeedback || isSubmitting || changeIdLocalFeedback !== null}
          hasFeedback={hasFeedback || changeIdLocalFeedback !== null}
          feedbackData={{
            changeDirectionCorrect:
              changeIdLocalFeedback?.step === "2a"
                ? changeIdLocalFeedback.correct
                : hasFeedback
                  ? response?.changeDirection === question?.validation?.changeDirection
                  : undefined,
            barModelCorrect:
              hasFeedback
                ? response?.barModel === question?.validation?.correctBarModel
                : undefined,
          }}
        />
      )}

      {(question?.moduleStage === "schema_solve" || isDirectSchemaSolve) && (
        <div className="worksheet-solve">
          {(question?.validation?.displayEquation ||
            question?.equationSpec?.displayEquation) && (
            <div
              className={`worksheet-solve__equation ${hasFeedback ? (feedback?.isCorrect ? "is-correct" : "is-wrong") : ""}`}
            >
              {question?.validation?.displayEquation ||
                question?.equationSpec?.displayEquation}
            </div>
          )}

          {/* <label
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
          </label> */}
          <label
            // 🔥 FIX: Added '|| isRevealed' so the box turns green
            className={`worksheet-answer-field ${hasFeedback ? (feedback?.isCorrect || isRevealed ? "is-correct" : "is-wrong") : ""}`}
          >
            <input
              type="number"
              inputMode="numeric"
              onWheel={(e) => e.target.blur()}
              // value={
              //   isRevealed
              //     ? mathResult ||
              //       feedback?.correctAnswer ||
              //       feedback?.expected ||
              //       ""
              //     : getDisplayedTextAnswer(response) || ""
              // }
              value={
                isRevealed
                  ? mathResult ||
                    feedback?.correctAnswer ||
                    feedback?.expected ||
                    question?.answer ||
                    question?.correctAnswer ||
                    question?.validation?.answer ||
                    ""
                  : getDisplayedTextAnswer(response) || ""
              }
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
          <div
            key={question?.id || question?.text}
            ref={keypadWrapperRef}
            // className={`keypad-animator ${hasFeedback ? "is-hidden" : ""}`}
            className={`keypad-animator ${hasFeedback ? "is-hidden" : ""} ${keypadReady ? "animate-unfold" : ""}`}
          >
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
        </div>
      )}

      {question?.inputMode !== "text_answer" && !isCompareAnswerInput && !isChangeIdentification && (
        <div
          ref={keypadWrapperRef}
          key={question?.id || question?.text}
          // className={`keypad-animator ${hasFeedback ? "is-hidden" : ""}`}
          className={`keypad-animator ${hasFeedback ? "is-hidden" : ""} ${keypadReady ? "animate-unfold" : ""}`}
        >
          <Keypad
            title={showOperatorPad ? "Choose the operator" : "Enter the number"}
            showUnknown={showUnknownButton}
            showOperatorPad={showOperatorPad}
            onDigit={updateActiveSlotValue}
            onUnknown={() => updateActiveSlotValue("?")}
            onBackspace={handleBackspace}
            onClear={handleClear}
            onOperator={(operator) => {
              if (isEquationGhostHint) markEquationGhostCompleted();
              setResponse((current) => ({ ...(current || {}), operator }));
            }}
            disabled={hasFeedback || isSubmitting}
          />
        </div>
      )}

      <div className="worksheet-actions" ref={actionsRef}>
        {!hasFeedback && !isDummyMode && changeIdLocalFeedback === null && (
          <button
            type="button"
            className="worksheet-button worksheet-button--primary"
            onClick={triggerCheck}
            disabled={!canCheck || isSubmitting}
          >
            SUBMIT ✓
          </button>
        )}

        {hasFeedback &&
          !feedback?.isCorrect &&
          (isBarModelStage ||
            isEquationStage ||
            isVariableIdentification ||
            isSolveStage) &&
          !isChangeIdentification &&
          !isDummyMode &&
          !isRevealed && (
            <button
              type="button"
              className="worksheet-button worksheet-button--primary"
              onClick={handleTryAgain}
            >
              Try Again
            </button>
          )}

        {isDummyMode && !hasFeedback && (
          <button
            type="button"
            className="worksheet-button worksheet-button--primary"
            onClick={() => {
              triggerCheck();
            }}
            disabled={!canCheck || isSubmitting}
          >
            {isVariableIdentification
              ? "SUBMIT ✓"
              : isEquationStage
                ? "SUBMIT ✓"
                : "SUBMIT ✓"}
          </button>
        )}

        {/* {isDummyMode && hasFeedback && !feedback?.isCorrect && !isRevealed && (
          <button
            type="button"
            className="worksheet-button worksheet-button--primary"
            onClick={() => setIsRevealed(true)}
          >
            Reveal Answers
          </button>
        )} */}

        {/* 4. REVEAL BUTTON: For variable identification, only show on 2nd failure (isDummyMode + hasFeedback + wrong) */}
        {/* For other stages: show when isDummyMode or solve/practice stage fails */}
        {(isDummyMode || isPracticeStage) &&
          hasFeedback &&
          !feedback?.isCorrect &&
          !isRevealed &&
          !isChangeIdentification && (
            <button
              type="button"
              className="worksheet-button worksheet-button--reveal"
              onClick={() => setIsRevealed(true)}
            >
              Reveal Answer
            </button>
          )}

        {/* 5. NEXT PROBLEM: Show after correct answer OR after reveal */}
        {/* For variable identification: only after correct or revealed (never on wrong without reveal) */}
        {/* {(feedback?.isCorrect ||
          isRevealed ||
          (!isBarModelStage &&
            !isVariableIdentification &&
            !isSolveStage &&
            !isPracticeStage &&
            hasFeedback &&
            !feedback?.isCorrect)) && (
          <button
            type="button"
            className="worksheet-button worksheet-button--continue"
            onClick={onNext}
          >
            {isSchemaStage && question?.stageIndex < question?.stageTotal
              ? "Next Step →"
              : "Next Problem →"}
          </button>
        )} */}
        {(feedback?.isCorrect ||
          isRevealed ||
          (!isBarModelStage &&
            !isVariableIdentification &&
            !isSolveStage &&
            !isPracticeStage &&
            hasFeedback &&
            !feedback?.isCorrect)) && (
          <button
            type="button"
            className="worksheet-button worksheet-button worksheet-button--primary"
            onClick={onNext}
            disabled={
              autoNextCountdown !== null || disableAutoNext || isExiting
            }
          >
            {autoNextCountdown !== null
              ? `Next Problem in ${autoNextCountdown}s`
              : isExiting
                ? "Loading…"
                : isSchemaStage && question?.stageIndex < question?.stageTotal
                  ? "Next Step →"
                  : "Next Problem →"}
          </button>
        )}
      </div>
    </div>
  );
};

export default SchemaQuestion;
