import React, { useState, useEffect } from "react";
import { PiArrowBendDoubleUpLeftBold } from "react-icons/pi";

const VisualBarModel = ({
  problem,
  answer,
  setAnswer,
  isSuccess,
  isError,
  handleKeyDown,
  handleSubmit,
}) => {
  const visualData = problem?.question?.visualData;
  const [showHint, setShowHint] = useState(false);

  // --- HINT STATE ---
  useEffect(() => {
    if (problem?.question?.type === "visual") {
      let hintCount = 0;
      const savedCount = sessionStorage.getItem("visualHintCount");
      const lastSeenId = sessionStorage.getItem("lastHintProblemId");

      if (savedCount) {
        hintCount = parseInt(savedCount, 10);
      }

      const currentProblemId = problem?.question?.id || problem?.question?._id;

      if (hintCount < 2) {
        setShowHint(true);
        if (lastSeenId !== String(currentProblemId)) {
          sessionStorage.setItem("visualHintCount", String(hintCount + 1));
          sessionStorage.setItem("lastHintProblemId", String(currentProblemId));
        }
      }
    }
  }, [problem]);

  const getInputClass = () => {
    if (isSuccess) return "visual__input visual__input__success";
    if (isError) return "visual__input visual__input__error";
    return "visual__input";
  };

  const getDynamicWidth = () => {
    if (!isSuccess && !isError) return undefined;
    if (isSuccess) return "100%";

    const correctNum = Number(problem?.question?.correctAnswer);
    const userNum = Number(answer);

    if (!isNaN(correctNum) && !isNaN(userNum) && correctNum > 0) {
      const percentage = (userNum / correctNum) * 100;
      return `${Math.min(100, Math.max(15, percentage))}%`;
    }
    return "100%";
  };

  if (!visualData) return null;

  // Build the visual segments array using a standard for loop
  const visualSegments = [];
  for (let i = 0; i < visualData.parts.length; i++) {
    const part = visualData.parts[i];
    visualSegments.push(
      <div
        key={i}
        className="visual__segment"
        style={{
          backgroundColor: part.color,
          flex: part.value,
        }}
      >
        <span className="visual__label">{part.label}</span>
      </div>,
    );
  }

  return (
    <div className="visual__container">
      {visualData.showTotal && (
        <div className="visual__bracket">
          {showHint && !isSuccess && !isError && (
            <div className="visual__hint">
              <div className="visual__hint-text">Type here!</div>
              <div className="visual__hint-arrow">
                <PiArrowBendDoubleUpLeftBold />
              </div>
            </div>
          )}
          <input
            type="number"
            className={getInputClass()}
            value={answer}
            onChange={(e) =>
              !isSuccess && !isError && setAnswer(e.target.value)
            }
            onKeyDown={handleKeyDown}
            onBlur={handleSubmit}
            placeholder="?"
            autoComplete="off"
            readOnly={isSuccess || isError}
            style={{ width: getDynamicWidth() }}
          />
          <div className="visual__line">
            <span className="visual__line__span">|</span>
          </div>
        </div>
      )}
      <div className={`visual__bars`}>{visualSegments}</div>
    </div>
  );
};

export default VisualBarModel;
