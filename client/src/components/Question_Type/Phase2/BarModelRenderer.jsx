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

// const TotalPartsBarModel = ({
//   spec,
//   response,
//   activeField,
//   setActiveField,
// }) => {
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

//   return (
//     <div className="bar-model bar-model--total-parts">
//       <div className="bar-model__top">
//         <BarBox
//           box={spec.total}
//           label={getBarLabel(spec.total, spec)}
//           value={getBarValue(response, spec.total)}
//           active={activeField === spec.total.key}
//           onClick={() => setActiveField(spec.total.key)}
//           className="bar-box--wide"
//         />
//       </div>
//       <div className="bar-model__bottom">
//         <BarBox
//           box={spec.left}
//           label={getBarLabel(spec.left, spec)}
//           value={getBarValue(response, spec.left)}
//           active={activeField === spec.left.key}
//           onClick={() => setActiveField(spec.left.key)}
//           className="bar-box--segment"
//           style={{ width: `${percentages.first}%` }}
//         />
//         <BarBox
//           box={spec.right}
//           label={getBarLabel(spec.right, spec)}
//           value={getBarValue(response, spec.right)}
//           active={activeField === spec.right.key}
//           onClick={() => setActiveField(spec.right.key)}
//           className="bar-box--segment"
//           style={{ width: `${percentages.second}%` }}
//         />
//       </div>
//     </div>
//   );
// };
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
