import React from "react";
import { getBarValue } from "../../../utils/questionValidation";
import { BarBox } from "./WorksheetParts";
import {
  resolveTotalPartsMagnitudes,
  getSegmentPercentages,
  getBarLabel,
  resolveCompareMagnitudes,
  getExactTrackPercentages,
  getGuidedCompareValue,
} from "./SchemaUtils";

// ==========================================
// THE TOTAL PARTS SCHEMA
// ==========================================
const TotalPartsBarModel = ({
  spec,
  response,
  activeField,
  setActiveField,
  question,
  isAttempted,
  isCorrect,
  targetField,
}) => {
  const {
    total: totalMagnitude,
    left: leftMagnitude,
    right: rightMagnitude,
  } = resolveTotalPartsMagnitudes(spec, response);
  const percentages = getSegmentPercentages(
    leftMagnitude,
    rightMagnitude,
    totalMagnitude,
  );

  const valTotal = getBarValue(response, spec.total);
  const valLeft = getBarValue(response, spec.left);
  const valRight = getBarValue(response, spec.right);

  // Helper to get Feedback status
  const getFeedbackStatus = (boxKey) => {
    if (!isAttempted || boxKey !== targetField) return null;
    return isCorrect ? "correct" : "wrong";
  };

  const isUnk = (val, boxSpec) => {
    if (!boxSpec || boxSpec.editable) return false;
    return String(val || "").trim() === "?";
  };

  // We need this helper here too to prevent inline-style conflicts
  const getBoxStyle = (box, hashed, widthPercent, status) => {
    const style = widthPercent ? { width: `${widthPercent}%` } : {};

    // 1. Check for feedback colors first
    if (status === "correct")
      return {
        ...style,
        backgroundColor: "#f0fdf4",
        border: "2px solid #4ade80",
      };
    if (status === "wrong")
      return {
        ...style,
        backgroundColor: "#fef2f2",
        border: "2px solid #f87171",
      };

    // 2. Fallback to normal hashed/colored logic
    if (hashed) {
      return {
        ...style,
        backgroundColor: "white",
        backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(148, 163, 184, 0.15) 8px, rgba(148, 163, 184, 0.15) 10px)`,
        border: "2px dashed #94a3b8",
      };
    }
    const colors = {
      green: "#f0fdf4",
      blue: "#eff6ff",
      orange: "#fff7ed",
      red: "#fef2f2",
    };
    return { ...style, backgroundColor: colors[box?.color] || "white" };
  };

  return (
    <div className="bar-model bar-model--total-parts">
      {!spec.hideTopBar && (
        <div className="bar-model__top">
          <BarBox
            box={spec.total}
            label={getBarLabel(spec.total, spec)}
            value={valTotal}
            active={activeField === spec.total.key}
            onClick={() => setActiveField(spec.total.key)}
            className={`bar-box--wide ${getFeedbackStatus(spec.total.key) === "correct" ? "is-correct" : getFeedbackStatus(spec.total.key) === "wrong" ? "is-wrong" : ""}`}
            style={getBoxStyle(
              spec.total,
              isUnk(valTotal, spec.total),
              null,
              getFeedbackStatus(spec.total.key),
            )}
          />
        </div>
      )}

      <div className="bar-model__bottom">
        <BarBox
          box={spec.left}
          label={getBarLabel(spec.left, spec)}
          value={valLeft}
          active={activeField === spec.left.key}
          onClick={() => setActiveField(spec.left.key)}
          className={`bar-box--segment ${getFeedbackStatus(spec.left.key) === "correct" ? "is-correct" : getFeedbackStatus(spec.left.key) === "wrong" ? "is-wrong" : ""}`}
          style={getBoxStyle(
            spec.left,
            isUnk(valLeft, spec.left),
            percentages.first,
            getFeedbackStatus(spec.left.key),
          )}
        />
        <BarBox
          box={spec.right}
          label={getBarLabel(spec.right, spec)}
          value={valRight}
          active={activeField === spec.right.key}
          onClick={() => setActiveField(spec.right.key)}
          className={`bar-box--segment ${getFeedbackStatus(spec.right.key) === "correct" ? "is-correct" : getFeedbackStatus(spec.right.key) === "wrong" ? "is-wrong" : ""}`}
          style={getBoxStyle(
            spec.right,
            isUnk(valRight, spec.right),
            percentages.second,
            getFeedbackStatus(spec.right.key),
          )}
        />
      </div>
    </div>
  );
};

// ==========================================
// THE CHANGE SCHEMA
// ==========================================
const ChangeBarModel = ({
  spec,
  response,
  activeField,
  setActiveField,
  question,
  isAttempted,
  isCorrect,
  targetField,
}) => {
  const isSubtraction = (() => {
    const op = question?.operator || question?.equationSpec?.operator;
    if (op === "-") return true;
    if (op === "+") return false;

    const label = String(
      spec?.change?.label || spec?.right?.label || "",
    ).toLowerCase();
    const endLabel = String(
      spec?.end?.label || spec?.total?.label || "",
    ).toLowerCase();

    // ----------------------------  Check for common subtraction keywords (so the total/larger number  is always at top) ----------------------------------------
    const subWords = [
      "spent",
      "flew",
      "away",
      "lost",
      "gave",
      "left",
      "remaining",
      "ate",
      "sold",
    ];
    return subWords.some(
      (word) => label.includes(word) || endLabel.includes(word),
    );
  })();

  const isMod1 = question?.moduleStage === "word_to_bar";
  const startBox = spec.start || spec.left;
  const changeBox = spec.change || spec.right;
  const endBox = spec.end || spec.total || spec.result;

  let topBox, b1, b2;
  if (isSubtraction) {
    topBox = startBox;
    b1 = endBox;
    b2 = changeBox;
  } else {
    topBox = endBox;
    b1 = startBox;
    b2 = changeBox;
  }

  const isUnk = (val, boxSpec) => {
    if (!boxSpec) return false;
    const cleanVal = String(val || "").trim();
    return (cleanVal === "?" || boxSpec.value === "?") && !boxSpec.editable;
  };

  // Helper for feedback
  const getFeedbackStatus = (boxKey) => {
    if (!isAttempted || boxKey !== targetField) return null;
    return isCorrect ? "correct" : "wrong";
  };

  // UPDATED: Handle feedback colors inside the style function
  const getBoxStyle = (box, hashed, widthPercent, status) => {
    const style = widthPercent ? { width: `${widthPercent}%` } : {};

    // 1. If there is feedback, use those colors (Overriding the rest)
    if (status === "correct") {
      return {
        ...style,
        backgroundColor: "#f0fdf4",
        border: "2px solid #4ade80",
      };
    }
    if (status === "wrong") {
      return {
        ...style,
        backgroundColor: "#fef2f2",
        border: "2px solid #f87171",
      };
    }

    // 2. Normal hashing logic
    if (hashed) {
      return {
        ...style,
        backgroundColor: "white",
        backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(148, 163, 184, 0.15) 8px, rgba(148, 163, 184, 0.15) 10px)`,
        border: "2px dashed #94a3b8",
        backgroundClip: "padding-box",
      };
    }

    // 3. Normal coloring logic
    const colors = {
      green: "#f0fdf4",
      blue: "#eff6ff",
      orange: "#fff7ed",
      red: "#fef2f2",
    };
    return { ...style, backgroundColor: colors[box?.color] || "white" };
  };

  const vTop = getBarValue(response, topBox);
  const v1 = b1 ? getBarValue(response, b1) : null;
  const v2 = b2 ? getBarValue(response, b2) : null;
  const m1 = b1?.magnitude || 50;
  const m2 = b2?.magnitude || 50;
  const total = m1 + m2;

  console.log("--- SUBMIT DEBUG ---");
  console.log("1. Is Attempted:", question?.isAttempted);
  console.log("2. Target Field:", question?.targetField);
  console.log("3. Is Correct:", question?.isCorrect);
  console.log("--------------------");

  console.log("--- FINDING THE STATE ---");
  console.log("Full Question Object:", question);
  console.log("Full Response Object:", response);
  console.log("-------------------------");
  return (
    <div
      className={`bar-model bar-model--change ${isMod1 ? "is-pill-model" : "is-solid-classic"}`}
    >
      <div className="bar-model__top">
        <BarBox
          box={topBox}
          label={getBarLabel(topBox, spec)}
          value={vTop}
          active={activeField === topBox.key}
          onClick={() => setActiveField(topBox.key)}
          className={`bar-box--wide ${isMod1 ? "bar-box--top-pill" : ""} ${getFeedbackStatus(topBox.key) === "correct" ? "is-correct" : getFeedbackStatus(topBox.key) === "wrong" ? "is-wrong" : ""}`}
          style={getBoxStyle(
            topBox,
            isUnk(vTop, topBox),
            null,
            getFeedbackStatus(topBox.key),
          )}
        />
      </div>

      <div className="bar-model__bottom">
        {b1 && (
          <BarBox
            box={b1}
            label={getBarLabel(b1, spec)}
            value={v1}
            active={activeField === b1.key}
            onClick={() => setActiveField(b1.key)}
            className={`bar-box--segment ${isMod1 ? "bar-box--tray-pill token-1" : ""} ${getFeedbackStatus(b1.key) === "correct" ? "is-correct" : getFeedbackStatus(b1.key) === "wrong" ? "is-wrong" : ""}`}
            style={getBoxStyle(
              b1,
              isUnk(v1, b1),
              (m1 / total) * 100,
              getFeedbackStatus(b1.key),
            )}
          />
        )}

        {b2 && (
          <BarBox
            box={b2}
            label={getBarLabel(b2, spec)}
            value={v2}
            active={activeField === b2.key}
            onClick={() => setActiveField(b2.key)}
            className={`bar-box--segment ${isMod1 ? "bar-box--tray-pill token-2" : ""} ${getFeedbackStatus(b2.key) === "correct" ? "is-correct" : getFeedbackStatus(b2.key) === "wrong" ? "is-wrong" : ""}`}
            style={getBoxStyle(
              b2,
              isUnk(v2, b2),
              (m2 / total) * 100,
              getFeedbackStatus(b2.key),
            )}
          />
        )}
      </div>
    </div>
  );
};

// const TotalPartsBarModel = ({
//   spec,
//   response,
//   activeField,
//   setActiveField,
//   question,
// }) => {
//   const getFeedbackClass = (boxKey) => {
//     if (!question?.isAttempted) return "";
//     return boxKey === question?.targetField
//       ? question.isCorrect
//         ? "is-correct"
//         : "is-wrong"
//       : "";
//   };
//   const {
//     total: totalMagnitude,
//     left: leftMagnitude,
//     right: rightMagnitude,
//   } = resolveTotalPartsMagnitudes(spec, response);
//   const percentages = getSegmentPercentages(
//     leftMagnitude,
//     rightMagnitude,
//     totalMagnitude,
//   );

//   const valTotal = getBarValue(response, spec.total);
//   const valLeft = getBarValue(response, spec.left);
//   const valRight = getBarValue(response, spec.right);

//   // THE FINAL FIX: Ignore editable placeholders!
//   const isUnk = (val, boxSpec) => {
//     if (!boxSpec) return false;

//     // 1. If the student is supposed to type into this box, keep it solid!
//     // (This stops the Mod 1 placeholders from getting dashed)
//     if (boxSpec.editable) return false;

//     // 2. If the box is locked and displays a "?", it's the true unknown. Dash it!
//     const cleanVal = String(val || "").trim();
//     if (cleanVal === "?") return true;

//     return false;
//   };

//   return (
//     <div className="bar-model bar-model--total-parts">
//       {!spec.hideTopBar && (
//         <div className="bar-model__top">
//           <BarBox
//             box={spec.total}
//             label={getBarLabel(spec.total, spec)}
//             value={valTotal}
//             active={activeField === spec.total.key}
//             onClick={() => setActiveField(spec.total.key)}
//             className={`bar-box--wide ${isUnk(valTotal, spec.total) ? "is-missing-value" : ""} ${getFeedbackClass(spec.total.key)}`}
//             // className={`bar-box--wide ${isUnk(valTotal, spec.total) ? "is-missing-value" : ""}`}
//           />
//         </div>
//       )}

//       <div className="bar-model__bottom">
//         <BarBox
//           box={spec.left}
//           label={getBarLabel(spec.left, spec)}
//           value={valLeft}
//           active={activeField === spec.left.key}
//           onClick={() => setActiveField(spec.left.key)}
//           // className={`bar-box--segment ${isUnk(valLeft, spec.left) ? "is-missing-value" : ""}`}
//           className={`bar-box--segment ${isUnk(valLeft, spec.left) ? "is-missing-value" : ""} ${getFeedbackClass(spec.left.key)}`}
//           style={{ width: `${percentages.first}%` }}
//         />
//         <BarBox
//           box={spec.right}
//           label={getBarLabel(spec.right, spec)}
//           value={valRight}
//           active={activeField === spec.right.key}
//           onClick={() => setActiveField(spec.right.key)}
//           // className={`bar-box--segment ${isUnk(valRight, spec.right) ? "is-missing-value" : ""}`}
//           className={`bar-box--segment ${isUnk(valRight, spec.right) ? "is-missing-value" : ""} ${getFeedbackClass(spec.right.key)}`}
//           style={{ width: `${percentages.second}%` }}
//         />
//       </div>
//     </div>
//   );
// };
// const ChangeBarModel = ({
//   spec,
//   response,
//   activeField,
//   setActiveField,
//   question,
// }) => {
//   // 1. MATHEMATICAL STRUCTURE DETECTION
//   const isSubtraction = (() => {
//     const op = question?.operator || question?.equationSpec?.operator;
//     if (op === "-") return true;
//     if (op === "+") return false;

//     const label = String(
//       spec?.change?.label || spec?.right?.label || "",
//     ).toLowerCase();
//     const endLabel = String(
//       spec?.end?.label || spec?.total?.label || "",
//     ).toLowerCase();
//     return (
//       label.includes("gave") ||
//       label.includes("ate") ||
//       label.includes("lost") ||
//       label.includes("away") ||
//       label.includes("flew") ||
//       label.includes("spent") ||
//       endLabel.includes("left over") ||
//       endLabel.includes("remaining")
//     );
//   })();

//   const isMod1 = question?.moduleStage === "word_to_bar";

//   // 2. BOX MAPPING
//   const startBox = spec.start || spec.left;
//   const changeBox = spec.change || spec.right;
//   const endBox = spec.end || spec.total || spec.result;

//   let topBox, b1, b2;
//   if (isSubtraction) {
//     topBox = startBox;
//     b1 = endBox;
//     b2 = changeBox;
//   } else {
//     topBox = endBox;
//     b1 = startBox;
//     b2 = changeBox;
//   }

//   // 3. THE "ONLY HASH THE UNKNOWN" LOGIC
//   const isUnk = (val, boxSpec) => {
//     if (!boxSpec) return false;
//     const cleanVal = String(val || "").trim();
//     return (cleanVal === "?" || boxSpec.value === "?") && !boxSpec.editable;
//   };

//   // 4. STYLE FIX: White background for hashed boxes, original colors for solid boxes
//   const getBoxStyle = (box, hashed, widthPercent = null) => {
//     const style = widthPercent ? { width: `${widthPercent}%` } : {};

//     if (hashed) {
//       return {
//         ...style,
//         backgroundColor: "white", // Removed background color for hashed boxes
//         backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(148, 163, 184, 0.15) 8px, rgba(148, 163, 184, 0.15) 10px)`,
//         border: "2px dashed #94a3b8",
//         backgroundClip: "padding-box",
//       };
//     }

//     // Colors only for non-hashed, solid boxes
//     const colors = {
//       green: "#f0fdf4",
//       blue: "#eff6ff",
//       orange: "#fff7ed",
//       red: "#fef2f2",
//     };
//     return { ...style, backgroundColor: colors[box?.color] || "white" };
//   };

//   const vTop = getBarValue(response, topBox);
//   const v1 = b1 ? getBarValue(response, b1) : null;
//   const v2 = b2 ? getBarValue(response, b2) : null;

//   const m1 = b1?.magnitude || 50;
//   const m2 = b2?.magnitude || 50;
//   const total = m1 + m2;

//   const getFeedbackClass = (boxKey) => {
//     if (!question?.isAttempted) return "";
//     return boxKey === question?.targetField
//       ? question.isCorrect
//         ? "is-correct"
//         : "is-wrong"
//       : "";
//   };

//   return (
//     <div
//       className={`bar-model bar-model--change ${isMod1 ? "is-pill-model" : "is-solid-classic"}`}
//     >
//       {/* TOP ROW */}
//       <div className="bar-model__top">
//         <BarBox
//           box={topBox}
//           label={getBarLabel(topBox, spec)}
//           value={vTop}
//           active={activeField === topBox.key}
//           onClick={() => setActiveField(topBox.key)}
//           // className={`bar-box--wide ${isMod1 ? "bar-box--top-pill" : ""}`}
//           className={`bar-box--wide ${isMod1 ? "bar-box--top-pill" : ""} ${getFeedbackClass(topBox.key)}`}
//           style={getBoxStyle(topBox, isUnk(vTop, topBox))}
//         />
//       </div>

//       {/* BOTTOM ROW */}
//       <div className="bar-model__bottom">
//         {b1 && (
//           <BarBox
//             box={b1}
//             label={getBarLabel(b1, spec)}
//             value={v1}
//             active={activeField === b1.key}
//             onClick={() => setActiveField(b1.key)}
//             // className={`bar-box--segment ${isMod1 ? "bar-box--tray-pill token-1" : ""}`}
//             className={`bar-box--segment ${isMod1 ? "bar-box--tray-pill token-1" : ""} ${getFeedbackClass(b1.key)}`}
//             style={getBoxStyle(b1, isUnk(v1, b1), (m1 / total) * 100)}
//           />
//         )}

//         {b2 && (
//           <BarBox
//             box={b2}
//             label={getBarLabel(b2, spec)}
//             value={v2}
//             active={activeField === b2.key}
//             onClick={() => setActiveField(b2.key)}
//             className={`bar-box--segment ${isMod1 ? "bar-box--tray-pill token-2" : ""} ${getFeedbackClass(b2.key)}`}
//             // className={`bar-box--segment ${isMod1 ? "bar-box--tray-pill token-2" : ""}`}
//             style={getBoxStyle(b2, isUnk(v2, b2), (m2 / total) * 100)}
//           />
//         )}
//       </div>
//     </div>
//   );
// };

const CompareStackedBarModel = ({
  spec,
  response,
  activeField,
  setActiveField,
}) => {
  const {
    bigger: biggerMagnitude,
    smaller: smallerMagnitude,
    difference: differenceMagnitude,
  } = resolveCompareMagnitudes(spec, response);
  const percentages = getExactTrackPercentages(
    smallerMagnitude,
    differenceMagnitude,
    biggerMagnitude,
  );

  return (
    <div className="bar-model bar-model--compare">
      <div className="bar-model__compare-top">
        <BarBox
          box={spec.bigger}
          label={getBarLabel(spec.bigger, spec)}
          value={getBarValue(response, spec.bigger)}
          active={activeField === spec.bigger.key}
          onClick={() => setActiveField(spec.bigger.key)}
          className="bar-box--wide"
        />
      </div>
      <div className="bar-model__compare-bottom">
        <div className="bar-model__compare-row">
          <BarBox
            box={spec.smaller}
            label={getBarLabel(spec.smaller, spec)}
            value={getBarValue(response, spec.smaller)}
            active={activeField === spec.smaller.key}
            onClick={() => setActiveField(spec.smaller.key)}
            className="bar-box--segment"
            style={{ flex: `0 0 ${percentages.first}%` }}
          />
          <BarBox
            box={spec.difference}
            label={getBarLabel(spec.difference, spec)}
            value={getBarValue(response, spec.difference)}
            active={activeField === spec.difference.key}
            onClick={() => setActiveField(spec.difference.key)}
            className="bar-box--segment"
            style={{ flex: `0 0 ${percentages.second}%` }}
          />
        </div>
      </div>
      {spec?.barDecorations?.showBracket && spec.bracket && (
        <div className="bar-model__compare-bracket">
          <div className="bar-model__compare-line" />
          <span>{spec.bracket.label}</span>
        </div>
      )}
    </div>
  );
};

const CompareGapSegment = ({ box, label, value, active, onClick, style }) => {
  const displayValue =
    box.editable && String(value || "").trim() === "?" ? "" : value;

  return (
    <div
      className={`compare-gap__left ${box.editable ? "is-editable" : ""} ${active ? "is-active" : ""} ${box.accent === "unknown" ? "is-unknown" : ""}`}
      style={style}
    >
      <button
        type="button"
        className={`bar-box bar-box--${box.color} ${box.editable ? "is-editable" : ""} ${active ? "is-active" : ""} ${displayValue ? "is-filled" : ""} ${box.accent === "unknown" ? "is-unknown" : ""}`}
        onClick={onClick}
        disabled={!box.editable}
        style={style}
      >
        <strong>
          {displayValue || <span className="hide-on-focus">?</span>}
        </strong>{" "}
        <span>{label}</span>
      </button>
    </div>
  );
};

const CompareGapBarModel = ({
  spec,
  response,
  activeField,
  setActiveField,
}) => {
  const {
    bigger: biggerMagnitude,
    smaller: smallerMagnitude,
    difference: differenceMagnitude,
  } = resolveCompareMagnitudes(spec, response);
  const percentages = getExactTrackPercentages(
    smallerMagnitude,
    differenceMagnitude,
    biggerMagnitude,
  );
  const guideWidth = percentages.first;

  return (
    <div className="bar-model bar-model--compare-gap">
      <div className="bar-model__compare-top">
        <BarBox
          box={spec.bigger}
          label={getBarLabel(spec.bigger, spec)}
          value={getBarValue(response, spec.bigger)}
          active={activeField === spec.bigger.key}
          onClick={() => setActiveField(spec.bigger.key)}
          className="bar-box--wide"
        />
      </div>
      <div className="bar-model__compare-gap-track">
        <div
          className={`compare-gap__measure compare-gap__measure--track ${activeField === spec.smaller.key ? "is-active" : ""}`}
          style={{ width: `${guideWidth}%` }}
          aria-hidden="true"
        />
        <CompareGapSegment
          box={spec.smaller}
          label={getBarLabel(spec.smaller, spec)}
          value={getBarValue(response, spec.smaller)}
          active={activeField === spec.smaller.key}
          onClick={() => setActiveField(spec.smaller.key)}
          style={{ flex: `0 0 ${percentages.first}%` }}
        />
        <BarBox
          box={spec.difference}
          label={getBarLabel(spec.difference, spec)}
          value={getBarValue(response, spec.difference)}
          active={activeField === spec.difference.key}
          onClick={() => setActiveField(spec.difference.key)}
          className="bar-box--segment compare-gap__difference"
          style={{ flex: `0 0 ${percentages.second}%` }}
        />
      </div>
    </div>
  );
};

export const CompareGuidedAnswerModel = ({ question }) => {
  const spec = question?.barModelSpec;
  if (!spec) return null;

  const percentages = getExactTrackPercentages(
    spec?.smaller?.magnitude,
    spec?.difference?.magnitude,
    spec?.bigger?.magnitude,
  );
  const col1 = Number(percentages.first.toFixed(4));
  const col2 = Number((100 - col1).toFixed(4));
  const gridTracks = `minmax(0, ${col1}%) minmax(0, ${col2}%)`;

  return (
    <div className="bar-model bar-model--compare-guided">
      <div className="bar-model__compare-top">
        <BarBox
          box={{ ...spec.bigger, editable: false }}
          label={getBarLabel(spec.bigger, spec)}
          value={getGuidedCompareValue(question, "bigger", spec?.bigger?.value)}
          active={false}
          className="bar-box--wide"
        />
      </div>
      <div
        className="bar-model__compare-guided-row"
        style={{ gridTemplateColumns: gridTracks }}
      >
        <div className="compare-guided__unknown-column">
          <div className="compare-guided__measure" aria-hidden="true" />
          <div className="compare-guided__unknown">
            <strong className="compare-guided__mark">?</strong>
          </div>
        </div>
        <BarBox
          box={{ ...spec.difference, editable: false }}
          label={getBarLabel(spec.difference, spec)}
          value={getGuidedCompareValue(
            question,
            "difference",
            spec?.difference?.value,
          )}
          active={false}
          className="bar-box--segment compare-guided__difference"
        />
      </div>
    </div>
  );
};

// const BarModel = ({ question, response, setResponse }) => {
//   const spec = question?.barModelSpec;
//   if (!spec) return null;

//   const setActiveField = (field) =>
//     setResponse((current) => ({ ...(current || {}), activeField: field }));

//   if (question?.schemaKind === "change" || spec.layout === "change") {
//     return (
//       <ChangeBarModel
//         spec={spec}
//         response={response}
//         activeField={response?.activeField}
//         setActiveField={setActiveField}
//         question={question}
//       />
//     );
//   }

//   if (
//     spec.layout === "compare_offset" &&
//     spec.compareVariant === "fewer_than_gap"
//   ) {
//     return (
//       <CompareGapBarModel
//         spec={spec}
//         response={response}
//         activeField={response?.activeField}
//         setActiveField={setActiveField}
//       />
//     );
//   }

//   if (spec.layout === "compare_offset") {
//     return (
//       <CompareStackedBarModel
//         spec={spec}
//         response={response}
//         activeField={response?.activeField}
//         setActiveField={setActiveField}
//       />
//     );
//   }

//   return (
//     <TotalPartsBarModel
//       spec={spec}
//       response={response}
//       activeField={response?.activeField}
//       setActiveField={setActiveField}
//     />
//   );
// };
const BarModel = ({
  question,
  response,
  setResponse,
  isAttempted,
  isCorrect,
  targetField,
}) => {
  const spec = question?.barModelSpec;
  if (!spec) return null;

  const setActiveField = (field) =>
    setResponse((current) => ({ ...(current || {}), activeField: field }));

  if (question?.schemaKind === "change" || spec.layout === "change") {
    return (
      <ChangeBarModel
        spec={spec}
        response={response}
        activeField={response?.activeField}
        setActiveField={setActiveField}
        question={question}
        isAttempted={isAttempted}
        isCorrect={isCorrect}
        targetField={targetField}
      />
    );
  }

  if (
    spec.layout === "compare_offset" &&
    spec.compareVariant === "fewer_than_gap"
  ) {
    return (
      <CompareGapBarModel
        spec={spec}
        response={response}
        activeField={response?.activeField}
        setActiveField={setActiveField}
      />
    );
  }

  if (spec.layout === "compare_offset") {
    return (
      <CompareStackedBarModel
        spec={spec}
        response={response}
        activeField={response?.activeField}
        setActiveField={setActiveField}
      />
    );
  }

  return (
    <TotalPartsBarModel
      spec={spec}
      response={response}
      activeField={response?.activeField}
      setActiveField={setActiveField}
      question={question}
      isAttempted={isAttempted}
      isCorrect={isCorrect}
      targetField={targetField}
    />
  );
};

export default BarModel;
