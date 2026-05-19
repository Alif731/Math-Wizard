// // SchemaQuestion.jsx
// import React, { useEffect, useMemo, useState } from "react";
// import {
//   getDisplayedTextAnswer,
//   isCompareAnswerInputQuestion,
//   isQuestionResponseReady,
//   isVariableIdentificationQuestion,
// } from "../../../utils/questionValidation";
// import {
//   joinSlotValue,
//   buildCompareAnswerPrompt,
//   getActiveInputLabel,
//   getDefaultActiveField,
//   getBarLabel,
// } from "./SchemaUtils";
// import {
//   PracticeTabs,
//   StageTabs,
//   Keypad,
//   VerificationPanel,
//   EquationBoard,
// } from "./WorksheetParts";
// import BarModel, { CompareGuidedAnswerModel } from "./BarModelRenderer";
// import CustomSelect from "../../CustomSelect";

// // Deterministic shuffle
// const seededShuffle = (array, seed) => {
//   const result = [...array];
//   let s = seed;
//   for (let i = result.length - 1; i > 0; i--) {
//     s = (s * 16807 + 11) % 2147483647;
//     const j = s % (i + 1);
//     [result[i], result[j]] = [result[j], result[i]];
//   }
//   return result;
// };

// const hashString = (str) =>
//   (str || "").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

// const VariableIdentificationPanel = ({
//   question,
//   response,
//   setResponse,
//   disabled,
//   hasFeedback,
// }) => {
//   const sentences = question?.visualData?.sentences || [];
//   const variables = question?.visualData?.variables || [];
//   const expectedVars = question?.validation?.variables || {};

//   const shuffledVariables = useMemo(
//     () => seededShuffle(variables, hashString(question?.text)),
//     [variables, question?.text],
//   );

//   const updateVariable = (key, field, value) => {
//     if (disabled) return;
//     setResponse((current) => ({
//       ...(current || {}),
//       variables: {
//         ...(current?.variables || {}),
//         [key]: {
//           ...(current?.variables?.[key] || {}),
//           [field]: value,
//         },
//       },
//     }));
//   };

//   const sentenceOptions = useMemo(() => {
//     return sentences.map((sentence, index) => ({
//       value: String(index + 1),
//       label: String(index + 1),
//     }));
//   }, [sentences]);

//   return (
//     <div className="variable-identification">
//       <div className="variable-identification__sentences">
//         {sentences.map((sentence, index) => (
//           <div className="variable-sentence" key={`${index}-${sentence}`}>
//             <span>{index + 1}</span>
//             <p>{sentence}</p>
//           </div>
//         ))}
//       </div>

//       <div className="variable-table">
//         {shuffledVariables.map((variable) => {
//           const answer = response?.variables?.[variable.key] || {};
//           const isUnknown = expectedVars[variable.key]?.value === "?";

//           let rowStateClass = "";

//           if (hasFeedback) {
//             const isRowComplete =
//               answer.sentence && (answer.value || isUnknown);
//             if (isRowComplete) {
//               const expected = expectedVars[variable.key];
//               const isSentenceCorrect =
//                 String(answer.sentence) === String(expected.sentence);
//               const isValueCorrect =
//                 isUnknown || String(answer.value) === String(expected.value);

//               if (isSentenceCorrect && isValueCorrect) {
//                 rowStateClass = "is-correct";
//               } else {
//                 rowStateClass = "is-wrong";
//               }
//             }
//           }

//           return (
//             <div className={`variable-row ${rowStateClass}`} key={variable.key}>
//               <div className="variable-row__label">{variable.label}</div>

//               <label>
//                 <span>Sentence</span>
//                 <CustomSelect
//                   options={sentenceOptions}
//                   value={answer.sentence || ""}
//                   disabled={disabled || rowStateClass === "is-correct"}
//                   onChange={(selectedValue) =>
//                     updateVariable(variable.key, "sentence", selectedValue)
//                   }
//                   placeholder="Select"
//                 />
//               </label>

//               <label>
//                 <span>Value</span>
//                 <input
//                   type="text"
//                   inputMode="numeric"
//                   value={isUnknown ? "?" : answer.value || ""}
//                   disabled={
//                     disabled || isUnknown || rowStateClass === "is-correct"
//                   }
//                   placeholder="?"
//                   className={isUnknown ? "variable-value--locked" : ""}
//                   onChange={(event) =>
//                     !isUnknown &&
//                     updateVariable(variable.key, "value", event.target.value)
//                   }
//                 />
//               </label>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// const SchemaQuestion = ({
//   question,
//   response,
//   setResponse,
//   feedback,
//   onCheck,
//   onNext,
//   isSubmitting,
//   isDummyMode,
//   setIsDummyMode,
//   isRevealed,
//   setIsRevealed,
// }) => {
//   const hasFeedback = Boolean(feedback);
//   const isBarModelStage = Boolean(question?.barModelSpec);
//   const isEquationStage = ["bar_to_equation", "schema_equation"].includes(
//     question?.moduleStage,
//   );

//   // 🔥 THE ULTIMATE UNLOCK HACK: Scrub the question data to force EquationBoard to unlock all 3 boxes!
//   const displayQuestion = useMemo(() => {
//     if (!isEquationStage) return question;
//     const qClone = JSON.parse(JSON.stringify(question));

//     // SCENARIO 1: Dummy Mode (Retry with Hint)
//     // We WANT the '?' to stay so EquationBoard locks it as a hint for the student.
//     if (isDummyMode) return qClone;

//     // SCENARIO 2: Correct Answer Submitted
//     // Force the UI to expect exactly what the student typed, instantly turning it GREEN!
//     if (hasFeedback && feedback?.isCorrect) {
//       if (qClone.validation?.slots) {
//         Object.keys(qClone.validation.slots).forEach((key) => {
//           qClone.validation.slots[key] = response?.slots?.[key] || "";
//         });
//       }
//       return qClone;
//     }

//     // SCENARIO 3: Main Screen (Before Submit)
//     // We want ALL 3 boxes to be empty and clickable. Aggressively wipe the locks.
//     if (!hasFeedback && !isDummyMode) {
//       // 1. Wipe the expected ? from validation
//       if (qClone.validation?.slots) {
//         Object.keys(qClone.validation.slots).forEach((key) => {
//           if (String(qClone.validation.slots[key]).trim() === "?") {
//             qClone.validation.slots[key] = "";
//           }
//         });
//       }
//       // 2. Aggressively unlock the internal equationSpec parameters
//       if (qClone.equationSpec) {
//         Object.keys(qClone.equationSpec).forEach((key) => {
//           if (
//             qClone.equationSpec[key] !== null &&
//             typeof qClone.equationSpec[key] === "object"
//           ) {
//             qClone.equationSpec[key].editable = true; // Force unlock
//             if (String(qClone.equationSpec[key].value).trim() === "?") {
//               qClone.equationSpec[key].value = ""; // Remove the visual '?'
//             }
//           }
//         });
//       }
//     }

//     return qClone;
//   }, [question, isEquationStage, isDummyMode, hasFeedback, feedback, response]);

//   // --- THE STRICT LOCK: Enforce boxes to be filled ONLY during Bar Model stages ---
//   let isBarModelFullyFilled = true;
//   if (isBarModelStage && !isEquationStage) {
//     const spec = question?.barModelSpec;
//     const requiredKeys = [];

//     if (spec) {
//       if (question?.schemaKind === "change" || spec.layout === "change") {
//         requiredKeys.push((spec.start || spec.left)?.key);
//         requiredKeys.push((spec.change || spec.right)?.key);
//         requiredKeys.push((spec.end || spec.total || spec.result)?.key);
//       } else {
//         requiredKeys.push(spec.total?.key);
//         requiredKeys.push(spec.left?.key);
//         requiredKeys.push(spec.right?.key);
//       }
//     }

//     isBarModelFullyFilled = requiredKeys.every((key) => {
//       if (!key) return true;
//       const correctVal = String(
//         question?.validation?.slots?.[key] ?? spec?.[key]?.value ?? "",
//       ).trim();
//       if (isDummyMode && (correctVal === "?" || correctVal === "")) return true;
//       const val = response?.slots?.[key];
//       return val !== undefined && String(val).trim() !== "";
//     });
//   }

//   const canCheck =
//     isQuestionResponseReady(question, response) &&
//     isBarModelFullyFilled &&
//     !isSubmitting &&
//     !hasFeedback;

//   const isSchemaStage = question?.stageTotal === 3;
//   const isCompareAnswerInput = isCompareAnswerInputQuestion(question);
//   const isVariableIdentification = isVariableIdentificationQuestion(question);
//   const isDirectSchemaSolve = question?.moduleStage === "schema_direct_solve";
//   const showPromptStrip = !["practice", "equations"].includes(
//     question?.moduleStage,
//   );

//   const locksUnknownSlots = ["word_to_bar", "schema_bar_model"].includes(
//     question?.moduleStage,
//   );
//   const compareAnswerLabel = isCompareAnswerInput
//     ? getBarLabel(question?.barModelSpec?.smaller, question?.barModelSpec)
//     : "";
//   const compareAnswerCopy = buildCompareAnswerPrompt(compareAnswerLabel);

//   // 🔥 KEYPAD FIX: Ensure the '?' button is always visible during equation building!
//   const showUnknownButton =
//     isEquationStage ||
//     (!locksUnknownSlots &&
//       Object.values(question?.validation?.slots || {}).some(
//         (value) => String(value).trim() === "?",
//       ));

//   const showOperatorPad =
//     question?.inputMode === "keypad_equation" &&
//     question?.equationSpec?.operatorEditable &&
//     response?.activeField === "__operator__" &&
//     question?.schemaKind !== "combine";

//   const activeInputLabel = isCompareAnswerInput
//     ? ""
//     : getActiveInputLabel(question, response?.activeField);

//   const triggerCheck = () => {
//     if (canCheck) onCheck();
//   };

//   // Helper to prevent typing over the auto-filled '?' in Dummy Mode
//   const isSlotLockedInDummy = (field) => {
//     if (!isDummyMode || !isEquationStage || !field) return false;
//     const expected = String(question?.validation?.slots?.[field] ?? "").trim();
//     return expected === "?";
//   };

//   const updateActiveSlotValue = (nextValue) => {
//     if (hasFeedback) return;
//     if (response?.activeField === "__operator__") {
//       setResponse((current) => ({ ...(current || {}), operator: nextValue }));
//       return;
//     }
//     const targetField = response?.activeField;
//     if (!targetField || isSlotLockedInDummy(targetField)) return;
//     setResponse((current) => ({
//       ...(current || {}),
//       slots: {
//         ...(current?.slots || {}),
//         [targetField]: joinSlotValue(current?.slots?.[targetField], nextValue),
//       },
//     }));
//   };

//   const handleBackspace = () => {
//     if (hasFeedback) return;
//     if (
//       response?.activeField === "__operator__" &&
//       question?.schemaKind === "combine"
//     )
//       return;
//     if (hasFeedback || response?.activeField === "__operator__") return;
//     const targetField = response?.activeField;
//     if (!targetField || isSlotLockedInDummy(targetField)) return;
//     setResponse((current) => ({
//       ...(current || {}),
//       slots: {
//         ...(current?.slots || {}),
//         [targetField]: String(current?.slots?.[targetField] || "").slice(0, -1),
//       },
//     }));
//   };

//   const handleClear = () => {
//     if (hasFeedback) return;
//     const targetField = response?.activeField;
//     if (!targetField || isSlotLockedInDummy(targetField)) return;
//     if (targetField === "__operator__" && question?.schemaKind === "combine")
//       return;
//     setResponse((current) => {
//       if (targetField === "__operator__") return { ...current, operator: "" };
//       return { ...current, slots: { ...current?.slots, [targetField]: "" } };
//     });
//   };

//   useEffect(() => {
//     if (!question || hasFeedback || isSubmitting) return;

//     const isCombine = question?.schemaKind?.toLowerCase() === "combine";

//     // 🔥 MAIN SCREEN INITIALIZATION FIX: Ensure all 3 equation boxes start totally empty in memory!
//     if (isEquationStage && !isDummyMode) {
//       setResponse((current) => {
//         let changed = false;
//         const newSlots = { ...current?.slots };

//         // Wipe any pre-filled "?" out of the memory
//         Object.keys(newSlots).forEach((key) => {
//           if (newSlots[key] === "?") {
//             newSlots[key] = "";
//             changed = true;
//           }
//         });

//         if (isCombine && current?.operator !== "+") changed = true;

//         if (changed) {
//           return {
//             ...current,
//             slots: newSlots,
//             operator: isCombine ? "+" : current?.operator,
//             activeField: current?.activeField || "leftTerm",
//           };
//         }

//         if (isCombine && !current?.activeField)
//           return { ...current, activeField: "leftTerm" };
//         return current;
//       });
//     } else if (isCombine) {
//       if (response?.operator !== "+")
//         setResponse((current) => ({ ...(current || {}), operator: "+" }));
//       if (!response?.activeField)
//         setResponse((current) => ({
//           ...(current || {}),
//           activeField: "leftTerm",
//         }));
//     }
//   }, [
//     question?.id,
//     isEquationStage,
//     isDummyMode,
//     hasFeedback,
//     isSubmitting,
//     setResponse,
//   ]);

//   useEffect(() => {
//     const handleKeyDown = (event) => {
//       const targetTag = event.target?.tagName;
//       const isTypingField =
//         targetTag === "INPUT" ||
//         targetTag === "TEXTAREA" ||
//         event.target?.isContentEditable;

//       if (question?.inputMode === "text_answer" || isCompareAnswerInput) {
//         if (isTypingField && event.key === "Enter" && canCheck) {
//           event.preventDefault();
//           triggerCheck();
//         }
//         return;
//       }

//       if (isTypingField || hasFeedback || isSubmitting) return;
//       if (/^\d$/.test(event.key)) {
//         event.preventDefault();
//         updateActiveSlotValue(event.key);
//         return;
//       }
//       if (event.key === "Backspace") {
//         event.preventDefault();
//         handleBackspace();
//         return;
//       }
//       if (event.key === "Delete") {
//         event.preventDefault();
//         handleClear();
//         return;
//       }
//       if (event.key === "?" && showUnknownButton) {
//         event.preventDefault();
//         updateActiveSlotValue("?");
//         return;
//       }
//       if (
//         response?.activeField === "__operator__" &&
//         (event.key === "+" || event.key === "-")
//       ) {
//         event.preventDefault();
//         setResponse((current) => ({ ...(current || {}), operator: event.key }));
//         return;
//       }
//       if (event.key === "Enter" && canCheck) {
//         event.preventDefault();
//         triggerCheck();
//       }
//     };
//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [
//     canCheck,
//     hasFeedback,
//     isSubmitting,
//     question?.inputMode,
//     isCompareAnswerInput,
//     response,
//     setResponse,
//     showUnknownButton,
//   ]);

//   const [showHint, setShowHint] = useState(false);
//   useEffect(() => {
//     setShowHint(false);
//   }, [question]);

//   return (
//     <div className={`worksheet ${hasFeedback ? "is-completed" : ""}`}>
//       <div className="worksheet__helper">
//         <div className="worksheet__helper__div">
//           <div className="worksheet-title">
//             {question?.promptTitle || "practice"}
//           </div>

//           <div className="worksheet__topline-main">
//             {question?.schemaKind && (
//               <div
//                 className={`schema-badge schema-badge--${question.schemaKind}`}
//               >
//                 {question.schemaKind} Schema
//               </div>
//             )}
//           </div>
//         </div>

//         {(() => {
//           const helpText = isCompareAnswerInput
//             ? "Use the bars to work out the missing amount, then type your answer."
//             : question?.helperText;
//           if (!helpText) return null;
//           return (
//             <button
//               type="button"
//               className={`worksheet-help ${showHint ? "is-open" : ""}`}
//               onClick={() => setShowHint(!showHint)}
//             >
//               {showHint ? (
//                 <span className="hint-text-reveal">{helpText}</span>
//               ) : (
//                 <span>
//                   <span className="sparkle">✨</span> Reveal Clue
//                 </span>
//               )}
//             </button>
//           );
//         })()}
//       </div>
//       <div className="worksheet__topline">
//         <div className="worksheet__topline-main">
//           {question?.moduleStage === "practice" && (
//             <PracticeTabs activeKey={question?.practiceMode} />
//           )}
//           {isSchemaStage && (
//             <StageTabs currentStage={question?.stageIndex || 1} />
//           )}
//         </div>
//       </div>

//       {showPromptStrip && (
//         <div className="worksheet-prompt">
//           {"Q,"} {question?.text}
//         </div>
//       )}

//       {/* MODULE 3: EQUATION BUILDING */}
//       {(question?.moduleStage === "practice" ||
//         question?.moduleStage === "equations" ||
//         question?.moduleStage === "bar_to_equation" ||
//         question?.moduleStage === "schema_equation") && (
//         <>
//           {(question?.moduleStage === "bar_to_equation" ||
//             question?.moduleStage === "schema_equation") &&
//             question?.barModelSpec && (
//               <BarModel
//                 question={question}
//                 response={response}
//                 setResponse={setResponse}
//                 isAttempted={Boolean(feedback)}
//                 isCorrect={feedback?.isCorrect}
//                 targetField={response?.activeField}
//                 isDummyMode={isDummyMode}
//                 isRevealed={isRevealed}
//                 isReadOnly={isEquationStage}
//               />
//             )}
//           {/* 🔥 WE PASS THE "HACKED" DISPLAY QUESTION SO THE EQUATION BOARD BEHAVES PERFECTLY */}
//           <EquationBoard
//             question={displayQuestion}
//             response={response}
//             setResponse={setResponse}
//             locked={hasFeedback}
//             feedback={feedback}
//           />
//         </>
//       )}

//       {/* MODULE 2: BAR MODEL BUILDING */}
//       {(question?.moduleStage === "schema_bar_model" ||
//         question?.moduleStage === "word_to_bar") &&
//         (isCompareAnswerInput ? (
//           <>
//             <CompareGuidedAnswerModel question={question} />
//             <label className="worksheet-answer-field worksheet-answer-field--guided">
//               <span>{compareAnswerCopy.prompt}</span>
//               <input
//                 type="text"
//                 inputMode="numeric"
//                 value={getDisplayedTextAnswer(response)}
//                 onChange={(event) =>
//                   !hasFeedback &&
//                   setResponse((current) => ({
//                     ...(current || {}),
//                     textAnswer: event.target.value,
//                   }))
//                 }
//                 disabled={hasFeedback || isSubmitting}
//                 placeholder={compareAnswerCopy.placeholder}
//               />
//             </label>
//           </>
//         ) : (
//           <BarModel
//             question={question}
//             response={response}
//             setResponse={setResponse}
//             isAttempted={Boolean(feedback)}
//             isCorrect={feedback?.isCorrect}
//             targetField={response?.activeField}
//             isDummyMode={isDummyMode}
//             isRevealed={isRevealed}
//             isReadOnly={false}
//           />
//         ))}

//       {isVariableIdentification && (
//         <VariableIdentificationPanel
//           question={question}
//           response={response}
//           setResponse={setResponse}
//           disabled={hasFeedback || isSubmitting}
//           hasFeedback={hasFeedback}
//         />
//       )}

//       {(question?.moduleStage === "schema_solve" || isDirectSchemaSolve) && (
//         <div className="worksheet-solve">
//           {(question?.validation?.displayEquation ||
//             question?.equationSpec?.displayEquation) && (
//             <div
//               className={`worksheet-solve__equation ${hasFeedback ? (feedback?.isCorrect ? "is-correct" : "is-wrong") : ""}`}
//             >
//               {question?.validation?.displayEquation ||
//                 question?.equationSpec?.displayEquation}
//             </div>
//           )}

//           <label
//             className={`worksheet-answer-field ${hasFeedback ? (feedback?.isCorrect ? "is-correct" : "is-wrong") : ""}`}
//           >
//             <input
//               type="number"
//               inputMode="numeric"
//               value={getDisplayedTextAnswer(response) || ""}
//               onChange={(event) =>
//                 !hasFeedback &&
//                 !isSubmitting &&
//                 setResponse((current) => ({
//                   ...(current || {}),
//                   textAnswer: event.target.value,
//                 }))
//               }
//               disabled={hasFeedback || isSubmitting}
//               placeholder="Type Here"
//             />
//           </label>
//           <div className={`keypad-animator ${hasFeedback ? "is-hidden" : ""}`}>
//             <Keypad
//               title="Enter your answer."
//               showUnknown={false}
//               showOperatorPad={false}
//               disabled={hasFeedback || isSubmitting}
//               onDigit={(digit) => {
//                 if (!hasFeedback) {
//                   setResponse((current) => ({
//                     ...(current || {}),
//                     textAnswer: (current?.textAnswer || "") + digit,
//                   }));
//                 }
//               }}
//               onBackspace={() => {
//                 if (!hasFeedback) {
//                   setResponse((current) => ({
//                     ...(current || {}),
//                     textAnswer: (current?.textAnswer || "").slice(0, -1),
//                   }));
//                 }
//               }}
//               onClear={() => {
//                 if (!hasFeedback) {
//                   setResponse((current) => ({
//                     ...(current || {}),
//                     textAnswer: "",
//                   }));
//                 }
//               }}
//             />
//           </div>
//         </div>
//       )}

//       {question?.inputMode !== "text_answer" && !isCompareAnswerInput && (
//         <div className={`keypad-animator ${hasFeedback ? "is-hidden" : ""}`}>
//           <Keypad
//             title={showOperatorPad ? "Choose the operator" : "Enter the number"}
//             showUnknown={showUnknownButton}
//             showOperatorPad={showOperatorPad}
//             onDigit={updateActiveSlotValue}
//             onUnknown={() => updateActiveSlotValue("?")}
//             onBackspace={handleBackspace}
//             onClear={handleClear}
//             onOperator={(operator) =>
//               setResponse((current) => ({ ...(current || {}), operator }))
//             }
//             disabled={hasFeedback || isSubmitting}
//           />
//         </div>
//       )}

//       <div className="worksheet-actions">
//         {/* 1. INITIAL SUBMIT (Main Screen) */}
//         {!hasFeedback && !isDummyMode && (
//           <button
//             type="button"
//             className="worksheet-button worksheet-button--primary"
//             onClick={triggerCheck}
//             disabled={!canCheck || isSubmitting}
//           >
//             SUBMIT ✓
//           </button>
//         )}

//         {/* 2. TRY WITH HINTS (After Main Screen Fail) */}
//         {hasFeedback &&
//           !feedback?.isCorrect &&
//           (isBarModelStage || isEquationStage) &&
//           !isDummyMode && (
//             <button
//               type="button"
//               className="worksheet-button worksheet-button--primary"
//               onClick={() => {
//                 setIsDummyMode(true);

//                 if (isEquationStage) {
//                   const expectedSlots = question?.validation?.slots || {};
//                   const newSlots = {};
//                   let autoFocusKey = null;

//                   Object.keys(expectedSlots).forEach((key) => {
//                     if (String(expectedSlots[key]).trim() === "?") {
//                       newSlots[key] = "?";
//                     } else if (!autoFocusKey && key !== "operator") {
//                       autoFocusKey = key;
//                     }
//                   });

//                   setResponse((prev) => ({
//                     ...prev,
//                     slots: newSlots,
//                     operator: question?.schemaKind === "combine" ? "+" : "",
//                     activeField: autoFocusKey || "leftTerm",
//                   }));
//                   return;
//                 }

//                 const spec = question?.barModelSpec;
//                 let autoFocusKey = null;
//                 if (spec) {
//                   const keys =
//                     question?.schemaKind === "change" ||
//                     spec.layout === "change"
//                       ? [
//                           (spec.start || spec.left)?.key,
//                           (spec.change || spec.right)?.key,
//                           (spec.end || spec.total || spec.result)?.key,
//                         ]
//                       : [spec.total?.key, spec.left?.key, spec.right?.key];

//                   autoFocusKey = keys.find((key) => {
//                     const expected = String(
//                       question?.validation?.slots?.[key] ??
//                         spec?.[key]?.value ??
//                         "",
//                     ).trim();
//                     return expected !== "?" && expected !== "";
//                   });
//                 }

//                 setResponse((prev) => ({
//                   ...prev,
//                   slots: {},
//                   activeField: autoFocusKey,
//                 }));
//               }}
//             >
//               Retry with Hint
//             </button>
//           )}

//         {/* 3. DUMMY CHECK (While typing retry) */}
//         {isDummyMode && !hasFeedback && (
//           <button
//             type="button"
//             className="worksheet-button worksheet-button--primary"
//             onClick={() => {
//               if (isEquationStage) {
//                 let isDummyCorrect = true;
//                 const studentSlots = response?.slots || {};
//                 const expectedSlots = question?.validation?.slots || {};

//                 Object.keys(expectedSlots).forEach((key) => {
//                   const expected = String(expectedSlots[key]).trim();
//                   if (expected !== "" && expected !== "?") {
//                     if (String(studentSlots[key] || "").trim() !== expected) {
//                       isDummyCorrect = false;
//                     }
//                   }
//                 });

//                 if (
//                   question?.schemaKind === "change" &&
//                   question?.equationSpec?.operatorEditable
//                 ) {
//                   const expectedOp =
//                     question?.equationSpec?.operator || question?.operator;
//                   if (response?.operator !== expectedOp) isDummyCorrect = false;
//                 }

//                 onCheck(isDummyCorrect);
//               } else {
//                 triggerCheck();
//               }
//             }}
//             disabled={!canCheck || isSubmitting}
//           >
//             {isEquationStage ? "CHECK EQUATION ✓" : "CHECK MODEL ✓"}
//           </button>
//         )}

//         {/* 4. REVEAL BUTTON (Visible ONLY after Dummy Fail) */}
//         {isDummyMode && hasFeedback && !feedback?.isCorrect && !isRevealed && (
//           <button
//             type="button"
//             className="worksheet-button worksheet-button--primary"
//             onClick={() => setIsRevealed(true)}
//           >
//             Reveal Answers
//           </button>
//         )}

//         {/* 5. NEXT PROBLEM */}
//         {(feedback?.isCorrect ||
//           isRevealed ||
//           (!isBarModelStage && hasFeedback && !feedback?.isCorrect)) && (
//           <button
//             type="button"
//             className="worksheet-button worksheet-button--continue"
//             onClick={onNext}
//           >
//             Next Problem →
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// export default SchemaQuestion;

// SchemaQuestion.jsx
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
// CustomSelect removed - no longer used in VariableIdentificationPanel

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
      <span key={i} className="variable-sentence__number">{part}</span>
    ) : (
      part
    ),
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
}) => {
  const sentences = question?.visualData?.sentences || [];
  const variables = question?.visualData?.variables || [];
  const expectedVars = question?.validation?.variables || {};

  const shuffledVariables = useMemo(
    () => seededShuffle(variables, hashString(question?.text)),
    [variables, question?.text],
  );

  const updateVariable = (key, field, value) => {
    if (disabled && !isDummyMode) return;
    setResponse((current) => ({
      ...(current || {}),
      variables: {
        ...(current?.variables || {}),
        [key]: {
          ...(current?.variables?.[key] || {}),
          [field]: value,
          // When switching to "find", clear the value
          ...(field === "role" && value === "find" ? { value: "" } : {}),
        },
      },
    }));
  };

  // Determine per-card feedback state
  const getCardState = (variable) => {
    const answer = response?.variables?.[variable.key] || {};
    const expected = expectedVars[variable.key];
    if (!expected) return "";

    if (isRevealed) return "is-revealed";

    if (!hasFeedback) return "";

    // Check role correctness
    const isRoleCorrect = answer.role === expected.role;
    // For "given" variables, also check value
    const isValueCorrect =
      expected.role === "find" || String(answer.value) === String(expected.value);

    if (isRoleCorrect && isValueCorrect) return "is-correct";
    return "is-wrong";
  };

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

      {/* Instruction text */}
      <p className="variable-identification__instruction">
        For each variable, decide: is it <strong>given</strong> in the problem, or is
        it what we <strong>need to find</strong>?
        For given variables, enter the value.
      </p>

      {/* Variable cards */}
      <div className="variable-cards">
        {shuffledVariables.map((variable) => {
          const answer = response?.variables?.[variable.key] || {};
          const expected = expectedVars[variable.key];
          const cardState = getCardState(variable);
          const isCardLocked =
            cardState === "is-correct" || cardState === "is-revealed";

          // In revealed state, show correct answers
          const displayRole = isRevealed ? expected?.role : answer.role;
          const displayValue = isRevealed ? expected?.value : answer.value;

          return (
            <div
              className={`variable-card ${cardState}`}
              key={variable.key}
            >
              {/* Card header with name and badge */}
              <div className="variable-card__header">
                <div className="variable-card__name">{variable.label}</div>
                {displayRole && (
                  <span
                    className={`variable-card__badge variable-card__badge--${
                      displayRole === "given" ? "given" : "find"
                    }`}
                  >
                    {displayRole === "given" ? "Given" : "Find?"}
                  </span>
                )}
              </div>

              {/* Toggle buttons */}
              <div className="variable-card__toggles">
                <button
                  type="button"
                  className={`variable-toggle variable-toggle--given ${
                    displayRole === "given" ? "is-active" : ""
                  }`}
                  disabled={isCardLocked}
                  onClick={() => updateVariable(variable.key, "role", "given")}
                >
                  ✓ Given in the problem
                </button>
                <button
                  type="button"
                  className={`variable-toggle variable-toggle--find ${
                    displayRole === "find" ? "is-active" : ""
                  }`}
                  disabled={isCardLocked}
                  onClick={() => updateVariable(variable.key, "role", "find")}
                >
                  ? We need to find this
                </button>
              </div>

              {/* Conditional content based on role */}
              {displayRole === "given" && (
                <label className="variable-card__value-row">
                  <span>How many?</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={displayValue || ""}
                    disabled={isCardLocked}
                    placeholder="Enter value"
                    onChange={(e) =>
                      updateVariable(variable.key, "value", e.target.value)
                    }
                  />
                </label>
              )}
              {displayRole === "find" && (
                <p className="variable-card__find-note">
                  <em>This is what we need to find.</em>
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Feedback bar */}
      {hasFeedback && !isDummyMode && (
        <div
          className={`variable-feedback-bar ${
            shuffledVariables.every((v) => getCardState(v) === "is-correct")
              ? "variable-feedback-bar--success"
              : "variable-feedback-bar--error"
          }`}
        >
          {shuffledVariables.every((v) => getCardState(v) === "is-correct")
            ? "Correct! You have identified all given and unknown variables."
            : "Some classifications or values are wrong — check the highlighted cards."}
        </div>
      )}

      {isRevealed && (
        <div className="variable-feedback-bar variable-feedback-bar--success">
          Correct answers have been revealed above.
        </div>
      )}
    </div>
  );
};

// 🔥 FIX 1: Universal Spec-Aware Helper
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
}) => {
  const hasFeedback = Boolean(feedback);
  const isBarModelStage = Boolean(question?.barModelSpec);
  const isEquationStage = ["bar_to_equation", "schema_equation"].includes(
    question?.moduleStage,
  );
  // Identify practice schemas so we can apply the Equation Board rules
  const isPracticeStage = ["practice", "equations"].includes(
    question?.moduleStage,
  );
  const isEquationBoardActive = isEquationStage || isPracticeStage;

  const displayQuestion = useMemo(() => {
    if (!isEquationStage) return question;
    if (!isEquationBoardActive) return question;
    const qClone = JSON.parse(JSON.stringify(question));
    const studentSlots = response?.slots || {};
    const isCorrect = hasFeedback && feedback?.isCorrect;

    const mathResult = solveMissingValue(question);

    const isUnknownSlot = (key) => {
      return getTrueExpectedValue(question, key) === "?";
    };

    if (qClone.equationSpec) {
      if (isDummyMode || isRevealed || isCorrect) {
        qClone.equationSpec.operatorEditable = false;
      }
    }

    if (qClone.equationSpec?.template) {
      qClone.equationSpec.template.forEach((item) => {
        // --- 1. OPERATOR LOGIC ---
        if (item?.type === "operator") {
          const blueprintOp =
            (question?.equationSpec?.template || []).find(
              (t) => t.type === "operator",
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
            item.editable = true;
            item.isCorrect = false;
            item.isWrong = false;
          } else if (isDummyMode && !isCorrect) {
            // DUMMY MODE: Locked hint (neutral look)
            item.editable = false;
            item.isCorrect = false;
            item.isWrong = false;
          } else {
            // MAIN SCREEN / SUCCESS
            item.editable = true;

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
              (question?.stageTotal === 3 && question?.stageIndex === 3) ||
              question?.moduleStage === "direct";

            if (isUnknown) {
              item.value = isFinalAnswerStage ? (mathResult || "?") : "?";
            } else {
              item.value = getTrueExpectedValue(question, item.key);
            }
            item.editable = true;
            item.isUnknown = false;
          } else if (isCorrect) {
            if (isUnknown && (!item.value || String(item.value).trim() === "")) {
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
            if (isUnknown && (!item.value || String(item.value).trim() === "")) {
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
    response,
  ]);
  // const displayQuestion = useMemo(() => {
  //   if (!isEquationStage) return question;
  //   const qClone = JSON.parse(JSON.stringify(question));
  //   const studentSlots = response?.slots || {};
  //   const isCorrect = hasFeedback && feedback?.isCorrect;

  //   // Calculate the missing number once
  //   const mathResult = solveMissingValue(question);

  //   const isUnknownSlot = (key) => {
  //     return getTrueExpectedValue(question, key) === "?";
  //   };

  //   // 🔥 THE FIX: Lock the operator box from being clicked in Dummy Mode or Reveal State
  //   if (qClone.equationSpec) {
  //     if (isDummyMode || isRevealed || isCorrect) {
  //       qClone.equationSpec.operatorEditable = false;
  //     }
  //   }

  //   // --- THE STRICT LOCK: Restored to your original working logic ---
  //   if (qClone.equationSpec?.template) {
  //     qClone.equationSpec.template.forEach((item) => {
  //       if (item?.type === "operator") {
  //         // 1. Sync the operator with the student's input
  //         if (response?.operator) {
  //           item.value = response.operator;
  //         }

  //         // 2. Manage UI state for correct grading borders
  //         if (isRevealed) {
  //           item.editable = true; // Neutral standard look (feedback stripped downstream)
  //         } else if (isCorrect) {
  //           item.editable = true; // 🔥 Keeps it true so it gets the GREEN success border!
  //         } else if (isDummyMode) {
  //           if (hasFeedback) {
  //             item.editable = true; // Grades it (red/green) after they click Check
  //           } else {
  //             item.editable = false; // Locks it while they are just typing numbers
  //           }
  //         } else {
  //           item.editable = true; // Main screen: clickable and gradable
  //         }
  //       }

  //       if (item?.type === "slot") {
  //         const isUnknown = isUnknownSlot(item.key);

  //         // 1. Sync visually with student input
  //         if (item.key && studentSlots[item.key] !== undefined) {
  //           item.value = studentSlots[item.key];
  //         }

  //         // 🔥 UI FEEDBACK LOGIC
  //         if (isRevealed) {
  //           // REVEAL STATE: Show correct numbers, apply the EXACT SAME style to all boxes
  //           if (isUnknown) {
  //             item.value = mathResult || "?";
  //           } else {
  //             item.value = getTrueExpectedValue(question, item.key);
  //           }
  //           item.editable = true; // Prevents the gray disabled look
  //           item.isUnknown = false; // 🔥 THE FIX: Forces ALL boxes to use the standard solid border
  //         } else if (isCorrect) {
  //           // SUCCESS STATE: Keep green success styling
  //           if (isUnknown) {
  //             item.value = mathResult || "?";
  //           }
  //           item.editable = true;
  //           item.isUnknown = false;
  //         } else if (isDummyMode) {
  //           if (isUnknown) {
  //             item.value = "?";
  //             item.editable = false; // Keeps the hint background neutral
  //             item.isUnknown = true;
  //           } else {
  //             item.editable = true;
  //             item.isUnknown = false;
  //           }
  //         } else {
  //           // MAIN SCREEN
  //           if (String(item.value).trim() === "?") item.value = "";
  //           item.editable = true;
  //           item.isUnknown = false;
  //         }
  //       }
  //     });
  //   }
  //   return qClone;
  // }, [
  //   question,
  //   isEquationStage,
  //   isDummyMode,
  //   hasFeedback,
  //   feedback,
  //   isRevealed,
  //   response,
  // ]);

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
      (question?.stageTotal === 3 && question?.stageIndex === 3) ||
      question?.moduleStage === "direct";

    const opItem = (question?.equationSpec?.template || []).find((i) => i.type === 'operator');
    const requiresOperator = opItem && opItem.editable !== false && question?.schemaKind !== 'combine';
    const hasOperator = !requiresOperator || Boolean(response?.operator);
    if (isFinalAnswerStage) {
      return currentKeys.every((key) => {
        const val = String(slots[key] || "").trim();
        return val !== "" && val !== "?";
      }) && hasOperator;
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
    question?.moduleStage === "schema_solve" || isDirectSchemaSolve; // 🔥 Added helper

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

  const isSchemaStage = question?.stageTotal === 3;
  const isCompareAnswerInput = isCompareAnswerInputQuestion(question);
  const isVariableIdentification = isVariableIdentificationQuestion(question);
  const mathResult = solveMissingValue(question); // 🔥 Pre-calculate answer for reveal
  const showPromptStrip = !["practice", "equations"].includes(
    question?.moduleStage,
  );

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
    if (canCheck) onCheck();
  };

  const isSlotLockedInDummy = (field) => {
    if (!isDummyMode || !isEquationStage || !field) return false;
    const expected = String(question?.validation?.slots?.[field] || "").trim();
    return expected === "?" || expected === "";
  };

  const updateActiveSlotValue = (nextValue) => {
    if (hasFeedback) return;

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

  // // 🔥 FIX: Push the correct math result AND correct story numbers into the memory on success OR reveal
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
      const numericResult = solveMissingValue(question);
      const isFinalAnswerStage = 
        question?.moduleStage === "schema_solve" || 
        question?.moduleStage === "schema_direct_solve" ||
        (question?.stageTotal === 3 && question?.stageIndex === 3) ||
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
            const desiredUnknownValue = isFinalAnswerStage ? numericResult : "?";
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
          exp.role === "find" ||
          String(submitted.value) === String(exp.value);

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
        if (current?.activeField !== "leftTerm") changed = true;
        return changed
          ? {
              ...current,
              slots: newSlots,
              operator: isCombine ? "+" : current?.operator,
              activeField: "leftTerm",
            }
          : current;
      });
    }
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

  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    setShowHint(false);
  }, [question]);

  return (
    <div className={`worksheet ${hasFeedback ? "is-completed" : ""}`}>
      <div className="worksheet__helper">
        <div className="worksheet__helper__div">
          <div className="worksheet-title">
            {question?.promptTitle || "practice"}
          </div>
          <div className="worksheet__topline-main">
            {question?.schemaKind && (
              <div
                className={`schema-badge schema-badge--${question.schemaKind}`}
              >
                {question.schemaKind} Schema
              </div>
            )}
          </div>
        </div>

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
              // 🔥 FIX: Safely injects the calculated math result or fallback feedback
              value={
                isRevealed
                  ? mathResult ||
                    feedback?.correctAnswer ||
                    feedback?.expected ||
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
          <div className={`keypad-animator ${hasFeedback ? "is-hidden" : ""}`}>
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

      {question?.inputMode !== "text_answer" && !isCompareAnswerInput && (
        <div className={`keypad-animator ${hasFeedback ? "is-hidden" : ""}`}>
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
        </div>
      )}

      <div className="worksheet-actions">
        {!hasFeedback && !isDummyMode && (
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
          !isRevealed && (
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
            className="worksheet-button worksheet-button--continue"
            onClick={onNext}
          >
            Next Problem →
          </button>
        )}
        {/* {(feedback?.isCorrect ||
          isRevealed ||
          (!isBarModelStage && hasFeedback && !feedback?.isCorrect)) && (
          <button
            type="button"
            className="worksheet-button worksheet-button--continue"
            onClick={onNext}
          >
            Next Problem →
          </button>
        )} */}
      </div>
    </div>
  );
};

export default SchemaQuestion;
