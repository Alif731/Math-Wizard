import React from "react";
import { Delete, Check, Lock } from "lucide-react";
import {
  getSlotDisplayValue,
  getEquationFixedValue,
} from "../../../utils/questionValidation";
import { getLearnerFacingLabel } from "./SchemaUtils";

const PRACTICE_PILLS = [
  { key: "single_add", label: "Single +" },
  { key: "single_sub", label: "Single -" },
  { key: "multi_add", label: "Multi +" },
  { key: "multi_sub", label: "Multi -" },
];

const SCHEMA_STAGES = [
  { key: 1, label: "1. Bar model" },
  { key: 2, label: "2. Equation" },
  { key: 3, label: "3. Solve" },
];

export const PracticeTabs = ({ activeKey }) => {
  // Find where the user currently is in the sequence
  const activeIndex = PRACTICE_PILLS.findIndex(
    (pill) => pill.key === activeKey,
  );

  return (
    <div className="worksheet-tabs progression-track">
      {PRACTICE_PILLS.map((pill, index) => {
        // Determine the state of each pill based on its index
        let statusClass = "";
        if (index < activeIndex) statusClass = "is-completed";
        else if (index === activeIndex) statusClass = "is-active";
        else statusClass = "is-locked";

        return (
          <div key={pill.key} className={`worksheet-tab ${statusClass}`}>
            {/* Optional: Add icons based on state */}
            {statusClass === "is-completed" && (
              <Check size={14} className="tab-icon" />
            )}
            {statusClass === "is-locked" && (
              <Lock size={12} className="tab-icon" />
            )}

            <span>{pill.label}</span>
          </div>
        );
      })}
    </div>
  );
};

// export const StageTabs = ({ currentStage }) => (
//   <div className="worksheet-stage-tabs">
//     {STAGE_PILLS.map((pill) => (
//       <div
//         key={pill.index}
//         className={`worksheet-stage-tab ${pill.index < currentStage ? "is-complete" : pill.index === currentStage ? "is-active" : ""}`}
//       >
//         {pill.index < currentStage ? `✓ ${pill.label}` : pill.label}
//       </div>
//     ))}
//   </div>
// );

export const StageTabs = ({ currentStage }) => {
  return (
    <div className="worksheet-tabs progression-track">
      {SCHEMA_STAGES.map((stage) => {
        // Determine the state based on the current stage number (1, 2, or 3)
        let statusClass = "";

        if (stage.key < currentStage) {
          statusClass = "is-completed";
        } else if (stage.key === currentStage) {
          statusClass = "is-active";
        } else {
          statusClass = "is-locked";
        }

        return (
          <div key={stage.key} className={`worksheet-tab ${statusClass}`}>
            {statusClass === "is-completed" && (
              <Check size={14} className="tab-icon" />
            )}
            {statusClass === "is-locked" && (
              <Lock size={12} className="tab-icon" />
            )}

            <span>{stage.label}</span>
          </div>
        );
      })}
    </div>
  );
};
export const BarBox = ({
  box,
  label,
  value,
  active,
  onClick,
  style,
  className = "",
}) => (
  <button
    type="button"
    className={`bar-box bar-box--${box.color} ${box.editable ? "is-editable" : ""} ${active ? "is-active" : ""} ${box.accent === "unknown" ? "is-unknown" : ""} ${className}`}
    onClick={onClick}
    disabled={!box.editable}
    style={style}
  >
    <strong>{value || <span className="hide-on-focus">?</span>}</strong>
    <span>{label || box.label}</span>
  </button>
);

export const EquationBoard = ({
  question,
  response,
  setResponse,
  locked,
  feedback,
}) => {
  const setActiveField = (field) =>
    !locked &&
    setResponse((current) => ({ ...(current || {}), activeField: field }));

  // 1. NEW: Check if there is feedback and set the correct/wrong class
  const validationClass = feedback
    ? feedback.isCorrect
      ? "is-correct"
      : "is-wrong"
    : "";

  return (
    <div className="equation-board">
      {(question?.equationSpec?.template || []).map((item, index) => {
        if (item.type === "symbol") {
          return (
            <span key={`symbol-${index}`} className="equation-board__symbol">
              {item.value}
            </span>
          );
        }

        if (item.type === "operator") {
          const operatorValue =
            response?.operator || (item.editable ? "" : item.value) || "?";
          return (
            <button
              type="button"
              key="operator"
              // 2. NEW: Add validationClass here (only if it was an editable operator)
              className={`equation-box equation-box--operator ${response?.activeField === "__operator__" ? "is-active" : ""} ${locked ? "is-locked" : ""} ${item.editable ? validationClass : ""}`}
              onClick={() => item.editable && setActiveField("__operator__")}
              disabled={locked || !item.editable}
            >
              <strong>
                {operatorValue || <span className="hide-on-focus">?</span>}
              </strong>{" "}
              <span>{item.label || "operator"}</span>
            </button>
          );
        }

        const isEditable = item.editable !== false;
        const displayValue = isEditable
          ? getSlotDisplayValue(response, item.key) || (
              <span className="hide-on-focus">?</span>
            )
          : getEquationFixedValue(item);
        const displayLabel = getLearnerFacingLabel(question, item);

        return (
          <button
            type="button"
            key={item.key}
            // 3. NEW: Add validationClass here (only on boxes the student actually answered)
            className={`equation-box ${isEditable ? "is-editable" : "is-fixed"} ${response?.activeField === item.key ? "is-active" : ""} ${locked ? "is-locked" : ""} ${isEditable ? validationClass : ""}`}
            onClick={() => isEditable && setActiveField(item.key)}
            disabled={locked || !isEditable}
          >
            <strong>{displayValue}</strong>
            <span>{displayLabel}</span>
          </button>
        );
      })}
    </div>
  );
};

export const Keypad = ({
  title,
  showUnknown,
  showOperatorPad,
  onDigit,
  onUnknown,
  onBackspace,
  onClear,
  onOperator,
  disabled,
}) => (
  <div className="worksheet-keypad">
    <div className="worksheet-keypad__title">{title}</div>
    {showOperatorPad ? (
      <div className="worksheet-keypad__operators">
        {["+", "-"].map((operator) => (
          <button
            type="button"
            key={operator}
            className="worksheet-keypad__operator"
            onClick={() => onOperator(operator)}
            disabled={disabled}
          >
            {operator}
          </button>
        ))}
      </div>
    ) : (
      <div className="worksheet-keypad__grid">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <button
            type="button"
            key={digit}
            className="worksheet-keypad__key"
            onClick={() => onDigit(digit)}
            disabled={disabled}
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          className="worksheet-keypad__key"
          onClick={onBackspace}
          disabled={disabled}
        >
          {/* ⌫ */}
          <Delete size={28} />
        </button>
        <button
          type="button"
          className="worksheet-keypad__key"
          onClick={() => onDigit("0")}
          disabled={disabled}
        >
          0
        </button>
        <button
          type="button"
          className="worksheet-keypad__key"
          onClick={showUnknown ? onUnknown : onClear}
          disabled={disabled}
        >
          {/* {showUnknown ? "?" : "Clr"} */}
          {showUnknown ? "AC" : "AC"}
        </button>
      </div>
    )}
  </div>
);

export const VerificationPanel = ({ question }) => {
  const verificationEquation = question?.validation?.verificationEquation;
  const solutionLabel = question?.validation?.solutionLabel;

  if (!verificationEquation) return null;

  return (
    <div className="worksheet-verification">
      {solutionLabel && (
        <div className="worksheet-feedback is-success">{solutionLabel}</div>
      )}
      <p>Substitute your answer back. Does the equation hold?</p>
      <div className="worksheet-verification__equation">
        {verificationEquation}
      </div>
    </div>
  );
};
