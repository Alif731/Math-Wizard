import { useState, useEffect } from "react";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import "../sass/components/DragDropQuestion.jsx.scss";

import { TbAppleFilled } from "react-icons/tb";
import { FaCar, FaStar, FaDog, FaCat, FaQuestionCircle } from "react-icons/fa";
import { GiBanana, GiOrangeSlice } from "react-icons/gi";
import { BsFillPencilFill } from "react-icons/bs";

const ICON_MAP = {
  apple: TbAppleFilled,
  car: FaCar,
  star: FaStar,
  dog: FaDog,
  cat: FaCat,
  banana: GiBanana,
  orange: GiOrangeSlice,
  pencil: BsFillPencilFill,
};

// --- 1. Draggable Option ---
const DraggableOption = ({ id, text, isDropped, isDisabled, iconName }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id,
    disabled: isDropped || isDisabled, // Disable if game over
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
      }
    : undefined;

  const IconComponent = ICON_MAP[iconName] || FaQuestionCircle;
  const count = parseInt(text, 10) || 0;

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`draggable-option ${isDisabled ? "draggable-option--disabled" : ""}`}
    >
      <div className="option-icon-grid">
        {Array.from({ length: count }).map((_, i) => (
          <IconComponent key={i} />
        ))}
      </div>
      <span className="option-number">{text}</span>
    </button>
  );
};

// --- 2. Droppable Zone ---
const DroppableZone = ({ isCorrect, isWrong, droppedValue, iconName }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: "droppable-zone",
  });

  let className = "droppable-zone";
  if (isOver && !isCorrect && !isWrong) className += " droppable-zone--over";
  if (isCorrect) className += " droppable-zone--correct";
  if (isWrong) className += " droppable-zone--error";

  const IconComponent = ICON_MAP[iconName] || FaQuestionCircle;
  // Show icons if Correct OR Wrong (we want to show what they dropped)
  const showContent = isCorrect || isWrong;
  const count = showContent ? parseInt(droppedValue, 10) : 0;

  return (
    <div ref={setNodeRef} className={className}>
      {showContent ? (
        <div className="option-icon-grid">
          <div>
            {" "}
            {Array.from({ length: count }).map((_, i) => (
              <IconComponent key={i} />
            ))}
          </div>
          <span className="zone-number">{droppedValue}</span>
        </div>
      ) : (
        "?"
      )}
    </div>
  );
};

// --- 3. Main Component ---
const DragDropQuestion = ({
  options,
  correctAnswer,
  onCorrect,
  onWrong,
  iconName,
}) => {
  const [isCorrect, setIsCorrect] = useState(false);
  const [isWrong, setIsWrong] = useState(false);
  const [droppedValue, setDroppedValue] = useState(null);

  useEffect(() => {
    setIsCorrect(false);
    setIsWrong(false);
    setDroppedValue(null);
  }, [correctAnswer]);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    // If game is already over, do nothing
    if (isCorrect || isWrong) return;

    if (over && over.id === "droppable-zone") {
      const droppedId = active.id;
      setDroppedValue(droppedId); // Lock the value in the box

      if (droppedId === correctAnswer) {
        setIsCorrect(true);
        onCorrect(droppedId);
      } else {
        setIsWrong(true);
        onWrong(droppedId); // Trigger parent error flow
      }
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="drag-drop-container">
        <div className="drop-area">
          {/* <span className="equals-sign">=</span> */}
          <DroppableZone
            isCorrect={isCorrect}
            isWrong={isWrong}
            droppedValue={droppedValue}
            iconName={iconName}
          />
        </div>

        <div className="options-area">
          {options.map((opt) =>
            // Hide if it's the one currently in the box (right or wrong)
            (isCorrect || isWrong) && opt === droppedValue ? null : (
              <DraggableOption
                key={opt}
                id={opt}
                text={opt}
                isDropped={isCorrect || isWrong} // Prevent dragging others
                isDisabled={isCorrect || isWrong} // Visual disabled state
                iconName={iconName}
              />
            ),
          )}
        </div>
      </div>
    </DndContext>
  );
};

export default DragDropQuestion;
