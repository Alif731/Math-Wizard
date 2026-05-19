// QuestionCard.jsx
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
  evaluateBarModelStageResponse,
  evaluateEquationStageResponse,
  isQuestionResponseReady,
} from "../utils/questionValidation";

const audioSuccess = new Audio("/success1.mp3");
const audioFailure = new Audio("/failure.mp3");
// const NEXT_PROBLEM_DELAY_MS = 1800;

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

  // Dummy Practice for Bar Modal
  const [isDummyMode, setIsDummyMode] = useState(false);
  const [failedFirstTry, setFailedFirstTry] = useState(false);
  const [hasFeedback, setHasFeedback] = useState(false);

  // NEW: Holds our animation state safely
  const [statAnim, setStatAnim] = useState({ key: 0, colorClass: "" });
  const [isRevealed, setIsRevealed] = useState(false);

  // 1. When a new question loads, completely reset everything (including the animation)
  useEffect(() => {
    setAnswer(createInitialResponse(problem?.question));
    setFeedback(null);
    setIsSuccess(false);
    setIsError(false);
    setSelectedOption(null);
    setStatAnim({ key: 0, colorClass: "" }); // Ensures no popping on question load!
    setIsDummyMode(false);
    setFailedFirstTry(false);
    setIsRevealed(false);
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
    if (isDummyMode) {
      setFeedback(null);
      setIsError(false);
    }
  }, [isDummyMode]);
  useEffect(() => {
    const handleResize = () => setViewportSize(getViewportSize());

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const playSuccessSound = () => {
    audioSuccess.currentTime = 0;
    audioSuccess.play().catch(() => {});
  };

  const playErrorSound = () => {
    audioFailure.currentTime = 0;
    audioFailure.play().catch(() => {});
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

  const handleNext = async () => {
    // Standard local reset
    setIsDummyMode(false);
    setFailedFirstTry(false);
    setFeedback(null);
    setIsSuccess(false);
    setIsError(false);
    setIsRevealed(false);
    setAnswer(createInitialResponse(problem?.question));
    onNext();
  };

  const submitStructuredResponse = async (overrideResponse) => {
    if (!problem?.question || disabled) return;

    const responseToSubmit = buildSubmissionResponse(problem.question, answer);
    const isEquationStage = ["bar_to_equation", "schema_equation"].includes(
      problem.question.moduleStage,
    );
    const isSolveStage = ["schema_solve", "schema_direct_solve"].includes(
      problem.question.moduleStage,
    );

    const isBarModelStage = Boolean(problem.question.barModelSpec);

    if (!isEquationStage && !isBarModelStage && !isQuestionResponseReady(problem.question, answer))
      return;

    // ====================================================
    // 🔥 1. DUMMY MODE GRADER (Practice Mode)
    // ====================================================
    if (isDummyMode) {
      let isDummyCorrect = true;
      const detailedFeedback = { isCorrect: true, slots: {} };

      if (isSolveStage) {
        const expectedAnswers = problem.question.validation?.acceptableAnswers || [
          problem.question.correctAnswer,
        ];
        const submittedAnswer = String(answer?.textAnswer || "").trim();
        isDummyCorrect = expectedAnswers.some(
          (expected) =>
            String(expected ?? "").trim().toLowerCase() ===
            submittedAnswer.toLowerCase(),
        );
        setFeedback({ isCorrect: isDummyCorrect });
      } else if (problem.question.moduleStage === "schema_variables") {
        const expected = problem.question.validation?.variables || {};
        const studentVars = answer?.variables || {};

        Object.keys(expected).forEach((key) => {
          const student = studentVars[key] || {};
          const exp = expected[key];
          const isRoleCorrect = student.role === exp.role;
          const isValueCorrect =
            exp.role === "find" ||
            String(student.value) === String(exp.value);

          if (!isRoleCorrect || !isValueCorrect) {
            isDummyCorrect = false;
          }
        });
        setFeedback({ isCorrect: isDummyCorrect });
      } else if (isEquationStage) {
        const result = evaluateEquationStageResponse(problem.question, answer);
        isDummyCorrect = result.isCorrect;
        detailedFeedback.isCorrect = result.isCorrect;
        detailedFeedback.slots = result.feedback;
        if (result.operatorFeedback) {
          detailedFeedback.operator = result.operatorFeedback;
        }
        setFeedback(detailedFeedback);
      } else {
        // Module 2 Practice Grading
        const result = evaluateBarModelStageResponse(problem.question, answer);
        isDummyCorrect = result.isCorrect;
        setFeedback({ isCorrect: isDummyCorrect, slots: result.feedback });
      }

      setIsSuccess(isDummyCorrect);
      setIsError(!isDummyCorrect);
      return;
    }

    // ====================================================
    // 🔥 2. MAIN SCREEN GRADER (Equation Stages)
    // ====================================================
    if (isEquationStage) {
      const expectedSlots = problem.question.validation?.slots || {};
      const result = evaluateEquationStageResponse(problem.question, answer);
      const isLocalCorrect = result.isCorrect;
      const detailedFeedback = {
        isCorrect: result.isCorrect,
        slots: result.feedback,
      };

      if (result.operatorFeedback) {
        detailedFeedback.operator = result.operatorFeedback;
      }

      setFeedback(detailedFeedback);
      setIsSuccess(isLocalCorrect);
      setIsError(!isLocalCorrect);

      if (!isLocalCorrect) setFailedFirstTry(true);

      try {
        if (isLocalCorrect) {
          responseToSubmit.slots = { ...result.canonicalSlots };
          const expectedOp =
            problem.question.validation?.operator ||
            problem.question.equationSpec?.operator ||
            problem.question.operator;
          if (expectedOp) responseToSubmit.operator = expectedOp;
        } else {
          responseToSubmit.slots = { ...expectedSlots };
          const givenBoxKey = Object.keys(expectedSlots).find(
            (k) =>
              String(expectedSlots[k]).trim() !== "?" &&
              String(expectedSlots[k]).trim() !== "",
          );
          if (givenBoxKey)
            responseToSubmit.slots[givenBoxKey] = "FORCED_FAIL_BY_FRONTEND";
        }
        const serverResult = await onSubmit(responseToSubmit);
        if (serverResult?.isCorrect === isLocalCorrect) {
          applyFeedback({ ...serverResult, ...detailedFeedback });
        } else {
          applyFeedback(serverResult);
        }
      } catch (e) {
        if (e?.status === 409) handleNext();
      }
      return;
    }

    // ====================================================
    // 🔥 3. MODULE 2 MAIN SCREEN SABOTAGE (The Emma Fix)
    // ====================================================
    if (isBarModelStage && !isEquationStage) {
      const result = evaluateBarModelStageResponse(problem.question, answer);
      const isModelPerfect = result.isCorrect;

      if (!isModelPerfect) {
        setFailedFirstTry(true);
        setIsError(true);
        setFeedback({ isCorrect: false, slots: result.feedback });
        try {
          if (responseToSubmit.slots) {
            const givenBoxKey = Object.keys(problem.question.validation?.slots || {}).find(
              (key) => {
                const value = String(problem.question.validation.slots[key]).trim();
                return value !== "?" && value !== "";
              },
            );
            if (givenBoxKey)
              responseToSubmit.slots[givenBoxKey] = "FORCED_FAIL_BY_FRONTEND";
          }
          await onSubmit(responseToSubmit);
        } catch (e) {
          if (e?.status === 409) handleNext();
        }
        return;
      }

      responseToSubmit.slots = { ...result.canonicalSlots };
    }

    // --- STANDARD FALLBACK SUBMIT ---
    try {
      const result = await onSubmit(responseToSubmit);
      applyFeedback(result);
      if (!result.isCorrect && isBarModelStage && !isDummyMode)
        setFailedFirstTry(true);
    } catch (error) {
      if (error?.status === 409) handleNext();
    }
  };

  // const submitStructuredResponse = async (overrideResponse) => {
  //   if (!problem?.question || disabled) return;
  //   const responseToSubmit = buildSubmissionResponse(problem.question, answer);
  //   const isEquationStage = ["bar_to_equation", "schema_equation"].includes(
  //     problem.question.moduleStage,
  //   );

  //   if (!isEquationStage && !isQuestionResponseReady(problem.question, answer))
  //     return;
  //   const isBarModelStage = Boolean(problem.question.barModelSpec);

  //   // ====================================================
  //   // 🔥 1. DUMMY MODE GRADER (Practice Mode)
  //   // ====================================================
  //   if (isDummyMode) {
  //     let isDummyCorrect = true;
  //     const studentSlots = answer?.slots || {};
  //     const detailedFeedback = { isCorrect: true, slots: {} };

  //     if (isEquationStage) {
  //       const templateSlots = (
  //         problem.question.equationSpec?.template || []
  //       ).filter((item) => item.type === "slot" && item.key);
  //       const isCombine =
  //         problem.question.schemaKind?.toLowerCase() === "combine";
  //       let isFlexibleMatch = false;

  //       // Helper to extract the true story number
  //       const getExpected = (key) => {
  //         const validationVal = problem.question.validation?.slots?.[key];
  //         if (
  //           validationVal !== undefined &&
  //           validationVal !== null &&
  //           String(validationVal).trim() !== ""
  //         ) {
  //           return String(validationVal).trim();
  //         }
  //         const tItem = templateSlots.find((t) => t.key === key);
  //         return String(tItem?.value || "").trim();
  //       };

  //       // Flexible Math Check (e.g. 8+5 is the same as 5+8)
  //       if (isCombine && templateSlots.length >= 2) {
  //         const lKey = templateSlots[0].key;
  //         const rKey = templateSlots[1].key;
  //         const tL = String(studentSlots[lKey] || "").trim();
  //         const tR = String(studentSlots[rKey] || "").trim();

  //         const eL = getExpected(lKey);
  //         const eR = getExpected(rKey);

  //         if (tL === eR && tR === eL && tL !== "" && tR !== "") {
  //           isFlexibleMatch = true;
  //         }
  //       }

  //       // Grade every known box strictly
  //       templateSlots.forEach((item, index) => {
  //         const key = item.key;
  //         const student = String(studentSlots[key] || "").trim();
  //         const expected = getExpected(key);

  //         // If expected is "?" or "", it's the unknown box. Skip grading it.
  //         const isUnknownBox = expected === "?" || expected === "";
  //         let isSlotCorrect = true;

  //         if (!isUnknownBox) {
  //           if (isFlexibleMatch && (index === 0 || index === 1)) {
  //             isSlotCorrect = true;
  //           } else {
  //             isSlotCorrect = student === expected;
  //           }
  //           if (!isSlotCorrect) isDummyCorrect = false;
  //         }

  //         detailedFeedback.slots[key] = { isCorrect: isSlotCorrect };
  //       });

  //       // 🔥 FIX 1: Check Operator (Always set explicit feedback)
  //       if (
  //         problem.question.schemaKind === "change" &&
  //         problem.question.equationSpec?.operatorEditable
  //       ) {
  //         const expectedOp =
  //           problem.question.equationSpec?.operator ||
  //           problem.question.operator;

  //         const isOpCorrect = answer?.operator === expectedOp;
  //         if (!isOpCorrect) isDummyCorrect = false;

  //         // Always set the explicit status so the UI knows it is correct
  //         detailedFeedback.operator = { isCorrect: isOpCorrect };
  //       }

  //       detailedFeedback.isCorrect = isDummyCorrect;
  //       setFeedback(detailedFeedback);
  //     } else {
  //       // MODULE 2 GRADING (Untouched)
  //       const spec = problem.question.barModelSpec || {};
  //       const boxes = [
  //         spec.total,
  //         spec.left,
  //         spec.right,
  //         spec.start,
  //         spec.change,
  //         spec.end,
  //         spec.result,
  //       ].filter(Boolean);
  //       boxes.forEach((box) => {
  //         let expected = getExpectedVal(problem.question, box);
  //         if (expected !== "" && expected !== "?") {
  //           if (String(studentSlots[box.key] || "").trim() !== expected)
  //             isDummyCorrect = false;
  //         }
  //       });
  //       setFeedback({ isCorrect: isDummyCorrect });
  //     }

  //     setIsSuccess(isDummyCorrect);
  //     setIsError(!isDummyCorrect);
  //     return; // 🔥 EXIT here so Main Screen Logic NEVER runs!
  //   }

  //   // ====================================================
  //   // 🔥 2. MAIN SCREEN GRADER & BACKEND SYNC
  //   // ====================================================
  //   if (isEquationStage) {
  //     const studentSlots = answer?.slots || {};
  //     const expectedSlots = problem.question.validation?.slots || {};
  //     const spec = problem.question.barModelSpec || {};
  //     const calcAnswer = solveMath(problem.question, spec);

  //     const templateKeys = (problem.question.equationSpec?.template || [])
  //       .filter((item) => item.type === "slot" && item.key)
  //       .map((item) => item.key);

  //     let isLocalCorrect = true;
  //     const detailedFeedback = { isCorrect: true, slots: {} };

  //     templateKeys.forEach((key) => {
  //       const student = String(studentSlots[key] || "").trim();
  //       let expected = String(expectedSlots[key] || "").trim();

  //       if (!student) {
  //         const item = problem.question.equationSpec.template.find(
  //           (t) => t.key === key,
  //         );
  //         if (item) expected = String(item.value).trim();
  //       }

  //       if (expected === "?" || expected === "") expected = String(calcAnswer);

  //       const isSlotCorrect =
  //         student === expected || (!student && expected === student);
  //       if (!isSlotCorrect) isLocalCorrect = false;

  //       detailedFeedback.slots[key] = { isCorrect: isSlotCorrect };
  //     });

  //     // 🔥 FIX 2: Check Operator (Always set explicit feedback)
  //     if (
  //       problem.question.schemaKind === "change" &&
  //       problem.question.equationSpec?.operatorEditable
  //     ) {
  //       const expectedOp =
  //         problem.question.equationSpec?.operator || problem.question.operator;

  //       const isOpCorrect = answer?.operator === expectedOp;
  //       if (!isOpCorrect) isLocalCorrect = false;

  //       // Always set the explicit status so the UI knows it is correct
  //       detailedFeedback.operator = { isCorrect: isOpCorrect };
  //     }

  //     detailedFeedback.isCorrect = isLocalCorrect;
  //     setFeedback(detailedFeedback);
  //     setIsSuccess(isLocalCorrect);
  //     setIsError(!isLocalCorrect);

  //     if (!isLocalCorrect) setFailedFirstTry(true);

  //     try {
  //       if (isLocalCorrect) {
  //         responseToSubmit.slots = { ...expectedSlots };
  //         const expectedOp =
  //           problem.question.equationSpec?.operator ||
  //           problem.question.operator;
  //         if (expectedOp) responseToSubmit.operator = expectedOp;
  //       } else {
  //         responseToSubmit.slots = { ...expectedSlots };
  //         const givenBoxKey = Object.keys(expectedSlots).find(
  //           (k) =>
  //             String(expectedSlots[k]).trim() !== "?" &&
  //             String(expectedSlots[k]).trim() !== "",
  //         );

  //         if (givenBoxKey) {
  //           responseToSubmit.slots[givenBoxKey] = "FORCED_FAIL_BY_FRONTEND";
  //         } else if (Object.keys(expectedSlots).length > 0) {
  //           responseToSubmit.slots[Object.keys(expectedSlots)[0]] =
  //             "FORCED_FAIL_BY_FRONTEND";
  //         }
  //         responseToSubmit.operator = "FAIL";
  //       }
  //       await onSubmit(responseToSubmit);
  //     } catch (e) {
  //       if (e?.status === 409) handleNext();
  //     }
  //     return;
  //   }

  //   // ====================================================
  //   // --- MODULE 2 MAIN SCREEN SABOTAGE (UNTOUCHED) ---
  //   // ====================================================
  //   if (isBarModelStage && !isEquationStage) {
  //     const spec = problem.question.barModelSpec || {};
  //     const boxes = [
  //       spec.total,
  //       spec.left,
  //       spec.right,
  //       spec.start,
  //       spec.change,
  //       spec.end,
  //       spec.result,
  //     ].filter(Boolean);

  //     // ✅ FIX: Detect subtraction by keywords FIRST, same as BarModelRenderer does
  //     const changeBox = spec.change || spec.right;
  //     const endBox = spec.end || spec.total || spec.result;
  //     const changeLabel = String(changeBox?.label || "").toLowerCase();
  //     const endLabel = String(endBox?.label || "").toLowerCase();
  //     const subWords = [
  //       "spent",
  //       "flew",
  //       "away",
  //       "lost",
  //       "gave",
  //       "left",
  //       "remaining",
  //       "ate",
  //       "sold",
  //     ];
  //     const isSubByKeyword = subWords.some(
  //       (w) => changeLabel.includes(w) || endLabel.includes(w),
  //     );
  //     const isSubByOperator =
  //       problem.question.operator === "-" ||
  //       problem.question.equationSpec?.operator === "-";
  //     const forceSub = isSubByKeyword || isSubByOperator;

  //     // ✅ Pass forceSub so the math is always correct
  //     const calcAnswer = solveMath(problem.question, spec, forceSub);

  //     let isModelPerfect = true;
  //     const studentSlots = answer?.slots || {};

  //     boxes.forEach((box) => {
  //       let expected = getExpectedVal(problem.question, box);
  //       let student = String(studentSlots[box.key] || "").trim();
  //       if (expected === "" || expected === "?") {
  //         if (student === calcAnswer && calcAnswer !== "") {
  //           if (responseToSubmit.slots) responseToSubmit.slots[box.key] = "?";
  //         } else {
  //           isModelPerfect = false;
  //         }
  //       } else {
  //         if (student !== expected) isModelPerfect = false;
  //       }
  //     });

  //     if (!isModelPerfect) {
  //       setFailedFirstTry(true);
  //       setIsError(true);
  //       setFeedback({ isCorrect: false });
  //       try {
  //         if (responseToSubmit.slots) {
  //           const givenBox = boxes.find(
  //             (b) =>
  //               getExpectedVal(problem.question, b) !== "?" &&
  //               getExpectedVal(problem.question, b) !== "",
  //           );
  //           if (givenBox)
  //             responseToSubmit.slots[givenBox.key] = "FORCED_FAIL_BY_FRONTEND";
  //         }
  //         await onSubmit(responseToSubmit);
  //       } catch (e) {
  //         if (e?.status === 409) handleNext();
  //       }
  //       return;
  //     }
  //   }

  //   // --- MODULE 2 STANDARD SUBMIT (UNTOUCHED) ---
  //   try {
  //     const result = await onSubmit(responseToSubmit);
  //     applyFeedback(result);
  //     if (!result.isCorrect && isBarModelStage && !isDummyMode)
  //       setFailedFirstTry(true);
  //   } catch (error) {
  //     if (error?.status === 409) handleNext();
  //   }
  // };

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

      // queueNextProblem();
    } catch (error) {
      console.error("Failed to submit:", error);
    }
  };

  const handleMatchComplete = async (isValid) => {
    if (feedback || disabled) return;

    try {
      const result = await onSubmit(isValid ? "matched" : "wrong_answer");
      applyFeedback(result);
      // queueNextProblem();
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
              onNext={handleNext}
              isSubmitting={disabled}
              // for dummy test
              isDummyMode={isDummyMode}
              setIsDummyMode={setIsDummyMode}
              failedFirstTry={failedFirstTry}
              isRevealed={isRevealed}
              setIsRevealed={setIsRevealed}
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
              {(isSuccess || isError) && !isWorksheetDriven && (
                <div className="worksheet-actions">
                  <button
                    className="worksheet-button worksheet-button--continue"
                    onClick={onNext}
                  >
                    Continue →
                  </button>
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
            masteryConfig={problem?.masteryConfig}
          />
        </aside>
      )}
    </div>
  );
};

export default QuestionCard;

