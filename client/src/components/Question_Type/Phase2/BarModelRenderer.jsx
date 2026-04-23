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

const TotalPartsBarModel = ({
  spec,
  response,
  activeField,
  setActiveField,
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

  return (
    <div className="bar-model bar-model--total-parts">
      {/* NEW: We only render the top bar if hideTopBar is NOT true */}
      {!spec.hideTopBar && (
        <div className="bar-model__top">
          <BarBox
            box={spec.total}
            label={getBarLabel(spec.total, spec)}
            value={getBarValue(response, spec.total)}
            active={activeField === spec.total.key}
            onClick={() => setActiveField(spec.total.key)}
            className="bar-box--wide"
          />
        </div>
      )}

      <div className="bar-model__bottom">
        <BarBox
          box={spec.left}
          label={getBarLabel(spec.left, spec)}
          value={getBarValue(response, spec.left)}
          active={activeField === spec.left.key}
          onClick={() => setActiveField(spec.left.key)}
          className="bar-box--segment"
          style={{ width: `${percentages.first}%` }}
        />
        <BarBox
          box={spec.right}
          label={getBarLabel(spec.right, spec)}
          value={getBarValue(response, spec.right)}
          active={activeField === spec.right.key}
          onClick={() => setActiveField(spec.right.key)}
          className="bar-box--segment"
          style={{ width: `${percentages.second}%` }}
        />
      </div>
    </div>
  );
};

// ==========================================
// THE CHANGE SCHEMA
// ==========================================
// const ChangeBarModel = ({
//   spec,
//   response,
//   activeField,
//   setActiveField,
//   question,
// }) => {
//   // 1. DETECTION LOGIC
//   const isSubtraction = (() => {
//     if (question?.operator === "-" || question?.equationSpec?.operator === "-")
//       return true;
//     const endLabel = String(
//       spec?.end?.label || spec?.total?.label || "",
//     ).toLowerCase();
//     if (endLabel.includes("total")) return false;
//     if (endLabel.includes("left over") || endLabel.includes("remaining"))
//       return true;
//     const slots =
//       question?.validation?.slots || question?.validationSlots || {};
//     if (!isNaN(slots.start) && !isNaN(slots.end))
//       return Number(slots.start) > Number(slots.end);
//     return true;
//   })();

//   // 2. Identify if this is Mod 1 (Game Style) or Mod 2 (Word to Bar)
//   const isMod1 =
//     question?.concept === "change_mod1" ||
//     question?.moduleStage === "bar_to_equation";

//   const startBox = spec.start || spec.left;
//   const changeBox = spec.change || spec.right;
//   const endBox = spec.end || spec.total || spec.result;

//   const topBox = isSubtraction ? startBox : endBox;
//   const bottomBox1 = isSubtraction ? endBox : startBox;
//   const bottomBox2 = changeBox;

//   const b1Mag = bottomBox1?.magnitude > 0 ? bottomBox1.magnitude : 50;
//   const b2Mag = bottomBox2?.magnitude > 0 ? bottomBox2.magnitude : 50;
//   const totalScale = b1Mag + b2Mag;
//   const percent1 = (b1Mag / totalScale) * 100;
//   const percent2 = (b2Mag / totalScale) * 100;

//   // -- MOD1 THEME COLORS --
//   const color1 = "#f97316"; // Active Orange
//   const color2 = "#a855f7"; // Active Purple

//   return (
//     <div
//       className={`bar-model bar-model--change ${isMod1 ? "is-pill-model" : "is-solid-classic"}`}
//       style={
//         isMod1
//           ? {
//               gap: "12px",
//               display: "flex",
//               flexDirection: "column",
//               padding: "10px 0",
//             }
//           : {}
//       }
//     >
//       {/* --- TOP ROW --- */}
//       <div className="bar-model__top">
//         {isMod1 ? (
//           /* MOD 1 HD: TACTILE, "3D" TOP PILL */
//           <div
//             style={{
//               width: "100%",
//               display: "flex",
//               justifyContent: "center",
//               position: "relative",
//             }}
//           >
//             <BarBox
//               box={topBox}
//               label={getBarLabel(topBox, spec)}
//               value={getBarValue(response, topBox)}
//               active={activeField === topBox.key}
//               onClick={() => setActiveField(topBox.key)}
//               className="bar-box--wide"
//               style={{
//                 padding: "20px",
//                 width: "100%",
//                 boxSizing: "border-box",
//                 margin: 0,
//                 borderRadius: "20px",
//                 border: "3px solid #cbd5e1",
//                 boxShadow:
//                   activeField === topBox.key
//                     ? "inset 0 4px 8px rgba(0,0,0,0.1), 0 1px 0 #e2e8f0"
//                     : "0 5px 0 #e2e8f0",
//                 minHeight: "85px",
//                 transition: "all 0.15s ease-out",
//                 transform:
//                   activeField === topBox.key
//                     ? "translateY(4px)"
//                     : "translateY(0)",
//                 backgroundColor: "#fff",
//                 position: "relative",
//                 zIndex: 2,
//               }}
//             />
//           </div>
//         ) : (
//           /* MOD 2: THE OLD STYLE (SOLID BOX) */
//           <BarBox
//             box={topBox}
//             label={getBarLabel(topBox, spec)}
//             value={getBarValue(response, topBox)}
//             active={activeField === topBox.key}
//             onClick={() => setActiveField(topBox.key)}
//             className="bar-box--wide"
//           />
//         )}
//       </div>

//       {/* --- BOTTOM ROW --- */}
//       <div
//         className="bar-model__bottom"
//         style={
//           isMod1
//             ? {
//                 boxSizing: "border-box",
//                 gap: "0px",
//                 display: "flex",
//                 width: "100%",
//                 border: "3px solid #cbd5e1",
//                 borderRadius: "20px",
//                 backgroundColor: "#f1f5f9",
//                 boxShadow: "inset 0 4px 8px rgba(0,0,0,0.04), 0 4px 0 #e2e8f0",
//                 padding: "6px",
//                 position: "relative",
//                 zIndex: 1,
//               }
//             : { gap: "2px" }
//         }
//       >
//         {/* Token 1: Stays solid */}
//         {bottomBox1 && (
//           <div
//             style={{
//               width: `${percent1}%`,
//               position: "relative",
//               transition: "all 0.15s ease-out",
//               transform:
//                 activeField === bottomBox1.key
//                   ? "translateY(2px)"
//                   : "translateY(0)",
//             }}
//           >
//             <BarBox
//               box={bottomBox1}
//               label={getBarLabel(bottomBox1, spec)}
//               value={getBarValue(response, bottomBox1)}
//               active={activeField === bottomBox1.key}
//               onClick={() => setActiveField(bottomBox1.key)}
//               className="bar-box--segment"
//               style={{
//                 width: "100%",
//                 borderRadius: "16px",
//                 border:
//                   activeField === bottomBox1.key
//                     ? `3px solid ${color1}`
//                     : "3px solid transparent",
//                 backgroundColor: "#fff",
//                 boxShadow:
//                   activeField === bottomBox1.key
//                     ? `inset 0 4px 10px rgba(0,0,0,0.06), 0 0 15px rgba(249, 115, 22, 0.2)`
//                     : "inset 0 4px 6px rgba(0,0,0,0.03)",
//                 transition: "all 0.1s ease",
//               }}
//             />
//           </div>
//         )}

//         {/* Token 2: The "Hollow Silhouette" */}
//         {bottomBox2 && (
//           <div
//             style={{
//               width: `${percent2}%`,
//               position: "relative",
//               transition: "all 0.15s ease-out",
//               // No weird floating! Just a subtle squish when pressed.
//               transform:
//                 activeField === bottomBox2.key ? "scale(0.98)" : "scale(1)",
//             }}
//           >
//             <BarBox
//               box={bottomBox2}
//               label={getBarLabel(bottomBox2, spec)}
//               value={getBarValue(response, bottomBox2)}
//               active={activeField === bottomBox2.key}
//               onClick={() => setActiveField(bottomBox2.key)}
//               className="bar-box--segment"
//               style={{
//                 width: "100%",
//                 borderRadius: "16px",

//                 // --- THE "MISSING SLOT" EFFECT ---
//                 // 1. Semi-transparent background so the grey tray shows through
//                 backgroundColor: isSubtraction
//                   ? "rgba(255, 255, 255, 0.4)"
//                   : "#fff",

//                 // 2. Crisp, clear diagonal hash lines that turn red when clicked
//                 backgroundImage: isSubtraction
//                   ? activeField === bottomBox2.key
//                     ? "repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(248, 113, 113, 0.3) 8px, rgba(248, 113, 113, 0.3) 10px)"
//                     : "repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(148, 163, 184, 0.4) 8px, rgba(148, 163, 184, 0.4) 10px)"
//                   : "none",

//                 // 3. Dashed grey border (turns dashed red when clicked)
//                 border: isSubtraction
//                   ? activeField === bottomBox2.key
//                     ? "3px dashed #f87171"
//                     : "3px dashed #cbd5e1"
//                   : activeField === bottomBox2.key
//                     ? `3px solid ${color2}`
//                     : "3px solid transparent",

//                 // 4. Heavy inset shadow so it looks sunken in like a hole
//                 boxShadow: isSubtraction
//                   ? "inset 0 4px 10px rgba(0,0,0,0.08)"
//                   : activeField === bottomBox2.key
//                     ? `inset 0 4px 10px rgba(0,0,0,0.06), 0 0 15px rgba(168, 85, 247, 0.15)`
//                     : "inset 0 4px 6px rgba(0,0,0,0.03)",

//                 // 5. Fade the text out slightly so it feels "gone", but turns red when clicked
//                 color: isSubtraction
//                   ? activeField === bottomBox2.key
//                     ? "#ef4444"
//                     : "#64748b"
//                   : "inherit",

//                 transition: "all 0.15s ease",
//               }}
//             />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };
const ChangeBarModel = ({
  spec,
  response,
  activeField,
  setActiveField,
  question,
}) => {
  // 1. DETECTION LOGIC
  const isSubtraction = (() => {
    if (question?.operator === "-" || question?.equationSpec?.operator === "-")
      return true;
    const endLabel = String(
      spec?.end?.label || spec?.total?.label || "",
    ).toLowerCase();
    if (endLabel.includes("total")) return false;
    if (endLabel.includes("left over") || endLabel.includes("remaining"))
      return true;
    const slots =
      question?.validation?.slots || question?.validationSlots || {};
    if (!isNaN(slots.start) && !isNaN(slots.end))
      return Number(slots.start) > Number(slots.end);
    return true;
  })();

  // 2. Identify if this is Mod 1 (Game Style) or Mod 2 (Word to Bar)
  const isMod1 =
    question?.concept === "change_mod1" ||
    question?.moduleStage === "bar_to_equation";

  const startBox = spec.start || spec.left;
  const changeBox = spec.change || spec.right;
  const endBox = spec.end || spec.total || spec.result;

  const topBox = isSubtraction ? startBox : endBox;
  const bottomBox1 = isSubtraction ? endBox : startBox;
  const bottomBox2 = changeBox;

  const b1Mag = bottomBox1?.magnitude > 0 ? bottomBox1.magnitude : 50;
  const b2Mag = bottomBox2?.magnitude > 0 ? bottomBox2.magnitude : 50;
  const totalScale = b1Mag + b2Mag;
  const percent1 = (b1Mag / totalScale) * 100;
  const percent2 = (b2Mag / totalScale) * 100;

  return (
    <div
      className={`bar-model bar-model--change ${
        isMod1 ? "is-pill-model" : "is-solid-classic"
      }`}
      style={
        isMod1
          ? {
              gap: "12px",
              display: "flex",
              flexDirection: "column",
              padding: "10px 0",
            }
          : {}
      }
    >
      {/* --- TOP ROW --- */}
      <div className="bar-model__top">
        {isMod1 ? (
          /* MOD 1 HD: TACTILE, "3D" TOP PILL */
          <div className="bar-model__top-wrapper">
            <BarBox
              box={topBox}
              label={getBarLabel(topBox, spec)}
              value={getBarValue(response, topBox)}
              active={activeField === topBox.key}
              onClick={() => setActiveField(topBox.key)}
              className={`bar-box--wide bar-box--top-pill ${
                activeField === topBox.key ? "is-active" : ""
              }`}
            />
          </div>
        ) : (
          /* MOD 2: THE OLD STYLE (SOLID BOX) */
          <BarBox
            box={topBox}
            label={getBarLabel(topBox, spec)}
            value={getBarValue(response, topBox)}
            active={activeField === topBox.key}
            onClick={() => setActiveField(topBox.key)}
            className="bar-box--wide"
          />
        )}
      </div>

      {/* --- BOTTOM ROW --- */}
      <div
        className="bar-model__bottom"
        style={
          isMod1
            ? {
                boxSizing: "border-box",
                gap: "0px",
                display: "flex",
                width: "100%",
                border: "3px solid #cbd5e1",
                borderRadius: "20px",
                backgroundColor: "#f1f5f9",
                boxShadow: "inset 0 4px 8px rgba(0,0,0,0.04), 0 4px 0 #e2e8f0",
                padding: "6px",
                position: "relative",
                zIndex: 1,
              }
            : { gap: "2px" }
        }
      >
        {isMod1 ? (
          /* ========================================= */
          /* MOD 1: THE TRAY & ANIMATED PILLS          */
          /* ========================================= */
          <>
            {/* Token 1: Stays solid */}
            {bottomBox1 && (
              <div
                className={`bar-box-wrapper ${
                  activeField === bottomBox1.key ? "is-active" : ""
                }`}
                style={{ width: `${percent1}%` }}
              >
                <BarBox
                  box={bottomBox1}
                  label={getBarLabel(bottomBox1, spec)}
                  value={getBarValue(response, bottomBox1)}
                  active={activeField === bottomBox1.key}
                  onClick={() => setActiveField(bottomBox1.key)}
                  className={`bar-box--segment bar-box--tray-pill token-1 ${
                    activeField === bottomBox1.key ? "is-active" : ""
                  }`}
                />
              </div>
            )}

            {/* Token 2: Dynamic (Addition solid, Subtraction hollow) */}
            {bottomBox2 && (
              <div
                className={`bar-box-wrapper ${
                  isSubtraction ? "bar-box-wrapper--subtraction" : ""
                } ${activeField === bottomBox2.key ? "is-active" : ""}`}
                style={{ width: `${percent2}%` }}
              >
                <BarBox
                  box={bottomBox2}
                  label={getBarLabel(bottomBox2, spec)}
                  value={getBarValue(response, bottomBox2)}
                  active={activeField === bottomBox2.key}
                  onClick={() => setActiveField(bottomBox2.key)}
                  className={`bar-box--segment bar-box--tray-pill token-2 ${
                    isSubtraction ? "is-subtraction" : ""
                  } ${activeField === bottomBox2.key ? "is-active" : ""}`}
                />
              </div>
            )}
          </>
        ) : (
          /* ========================================= */
          /* MOD 2: THE OLD STYLE (SOLID BLOCKS)       */
          /* ========================================= */
          <>
            {bottomBox1 && (
              <BarBox
                box={bottomBox1}
                label={getBarLabel(bottomBox1, spec)}
                value={getBarValue(response, bottomBox1)}
                active={activeField === bottomBox1.key}
                onClick={() => setActiveField(bottomBox1.key)}
                className="bar-box--segment"
                style={{ width: `${percent1}%` }} // Width applied directly to box!
              />
            )}
            {bottomBox2 && (
              <BarBox
                box={bottomBox2}
                label={getBarLabel(bottomBox2, spec)}
                value={getBarValue(response, bottomBox2)}
                active={activeField === bottomBox2.key}
                onClick={() => setActiveField(bottomBox2.key)}
                className="bar-box--segment"
                style={{ width: `${percent2}%` }} // Width applied directly to box!
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
// -------------------------------------------------------------------------------------- //

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

const CompareGapSegment = ({ box, label, value, active, onClick, style }) => (
  <div
    className={`compare-gap__left ${box.editable ? "is-editable" : ""} ${active ? "is-active" : ""} ${box.accent === "unknown" ? "is-unknown" : ""}`}
    style={style}
  >
    <button
      type="button"
      className={`bar-box bar-box--${box.color} ${box.editable ? "is-editable" : ""} ${active ? "is-active" : ""} ${value ? "is-filled" : ""} ${box.accent === "unknown" ? "is-unknown" : ""} ${className}`}
      onClick={onClick}
      disabled={!box.editable}
      style={style}
    >
      <strong>{value || <span className="hide-on-focus">?</span>}</strong>{" "}
      <span>{label}</span>
    </button>
  </div>
);

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

const BarModel = ({ question, response, setResponse }) => {
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
    />
  );
};

export default BarModel;
