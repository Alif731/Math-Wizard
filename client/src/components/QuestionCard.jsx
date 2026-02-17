import  { useState,useEffect } from "react";
import "../sass/components/questionCard.scss"; 
import DragDropQuestion from "./DragDropQuestion";

const QuestionCard = ({ problem, onSubmit }) => {
  

  const [answer, setAnswer] = useState("");
  const [isSuccess, setIsSuccess] = useState(false); 
  const [isError, setIsError] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);


  // Reset state when the problem changes
  useEffect(() => {
    setAnswer("");
    setIsSuccess(false);
    setIsError(false);
    setSelectedOption(null);
  }, [problem]);


  const handleOptionClick = (option) => {
    // Prevent clicking other buttons while animating
    if (isSuccess || isError) return;

    setSelectedOption(option); // Remember which button we clicked

    const rawCorrect = problem?.question?.correctAnswer || problem?.answer;
    if (rawCorrect === undefined || rawCorrect === null) {
      onSubmit(option);
      return;
    }

    const isCorrect = String(option).trim() === String(rawCorrect).trim();

    if (isCorrect) {
      setIsSuccess(true);
      setTimeout(() => onSubmit(option), 1500);
    } else {
      setIsError(true);
      setTimeout(() => onSubmit(option), 1500);
    }
  };
  

const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    // SAFETY: Check for empty input
    if (answer === "" || answer === null || answer === undefined) return;

    // 2. SAFETY: Check if backend data exists (prevents crash)
    const rawCorrect = problem?.question?.correctAnswer;
    if (rawCorrect === undefined || rawCorrect === null) {
      onSubmit(answer); // Submit blindly if data is missing
      return;
    }

    // Convert both to Strings so "15" == 15
    const userAnswer = String(answer).trim();
    const dbAnswer = String(rawCorrect).trim();
    const isCorrect = userAnswer === dbAnswer;

    // ANIMATION LOGIC
    const shouldAnimate = problem.question.type === "visual" || problem.question.type === "icons_items" || problem.question.type === "direct";
   if (shouldAnimate) {
      if (isCorrect) {
        // SUCCESS ANIMATION
        setIsSuccess(true);
        setTimeout(() => {
          onSubmit(userAnswer);
        }, 1500);
      } else {
        // ERROR ANIMATION
        setIsError(true);
        setTimeout(() => {
            onSubmit(userAnswer);
        }, 1500);
      }
    } else {
      // If not visual, submit immediately without animation
      onSubmit(userAnswer);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  if (!problem) return <div className="loading-state">Loading...</div>;

  // Check if this is a "Multiple Choice" style question
  const questionType = problem.question.type;
  const isConceptual = problem.question.type === "conceptual";
  const visualData = problem.question.visualData;
  const isIconsItems = questionType === "icons_items";


  // Helper to determine bars container class based on state
  const getInputClass = () => {
      if (isSuccess) return "visual__input visual__input__success";
      if (isError) return "visual__input visual__input__error";
      return "visual__input";
  };


  // ------------------------------------------------------------------------------------------------------- // 
  return (
    <div className="question__card">
      {isConceptual && (
          <h2 className="card__header__type">
          <span className="highlight1">S</span>elect{" "}
          <span className="highlight2">C</span>orrect{" "}
          <span className="highlight2">O</span>perator{" "} 
        </h2>
      )} 
      <div className="question__text">
        {" "}
        <span className="highlight3">Q,</span> {problem.question.text}
      </div>

      {/* ---ICONS ITEMS SECTION --- */}
      {isIconsItems && problem.question.visualData && (
        <div className="icons-items__container">
        {/* Drag MCA Options and Answer Box */}
        <DragDropQuestion 
             options={problem.question.visualData.dragOptions || ["5", "7", "10", "6"]} 
             correctAnswer={problem.question.correctAnswer}
             
             // Pass the icon type (e.g., 'apple') to render correct icons
             iconName={problem.question.visualData.groups?.[0]?.icon || "icon"}
             
             onCorrect={(val) => {
                setIsSuccess(true);
                setAnswer(val); 
                setTimeout(() => onSubmit(val), 1500); 
             }}
             onWrong={(val) => {
                setIsError(true); // Triggers Red State in Main Card
                setAnswer(val);
                setTimeout(() => onSubmit(val), 1500); // Auto-submit wrong answer
             }}
          />
        </div>
      )}

   {/* ---------------------- SECTION 2: VISUAL BAR MODEL -------------------- */}
      {questionType === "visual" && visualData && (
        <div className="visual__container">
          {/* Top Bracket with INPUT instead of '?' */}
          {visualData.showTotal && (
            <div className="visual__bracket">
                 <input
                type="number"
                className={getInputClass()}
                value={answer }
                onChange={(e) => !isSuccess &&  !isError && setAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="?"
                autoComplete="off"
                readOnly={isSuccess || isError}
              />
              <div className="visual__line"><span className = 'visual__line__span'>|</span></div>
            </div>
          )}
  {/* Bars */}
  {/* <div className={`visual__bars ${isSuccess ? "visual__bars__success" : ""}`}> */}
  <div className={`visual__bars`}> 
  {visualData.parts.map((part, index) => (
    <div
      key={index}
      className="visual__segment"
      style={{
        backgroundColor: part.color,
        flex: part.value,
      }}
    >
      <span className="visual__label">{part.label}</span>
    </div>
  ))}
</div>
</div>
      )}
      {/* ---------------------- SECTION 3: BAR MODEL -------------------- */}
      {isConceptual ? (
        // 1. OPTION MODE (For Signs)
        <div className="card__options">
          {problem.question.options?.map((option) => {
            // Determine class for this specific button
            let btnClass = "card__options__btn";
            if (selectedOption === option) {
              if (isSuccess) btnClass += " card__options__btn__success";
              if (isError) btnClass += " card__options__btn__error";
            }

            return (
              <button
                key={option}
                className={btnClass}
                onClick={() => handleOptionClick(option)} 
                disabled={isSuccess || isError} // Disable all buttons during animation
              >
                <span className="sike">{option}</span>
              </button>
            );
          })}
        </div>
      ) : (
            // ---------------------- SECTION 4: Normal Questions-------------------- 
        <div>
       {!isConceptual && questionType !== "visual" && !isIconsItems && (
             <form onSubmit={handleSubmit} className="answer__form"> 
               <input
                  type="number"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className={isSuccess ? "answer__input visual__input__success" : isError ? "answer__input visual__input__error" : "answer__input"}
                  autoFocus
                />
               <button onClick={handleSubmit} className="submit__btn" disabled={isSuccess || isError}>
                 {isSuccess ? "Correct!" : isError ? "Wrong..." : "Submit Answer"}
               </button>
             </form>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionCard;


//  {/* Loop through the groups (e.g., 4 Apples, then 3 Cars) */}
//           {problem.question?.visualData.groups.map((group, index) => {
//             // Find the correct icon component from our map
//             const IconComponent = ICON_MAP[group.icon] || FaQuestionCircle;

//             return (
//               <div key={index} className="icons-items__group-wrapper">
                
//                 {/* The Grid of Icons dynamically */}
//                 <div className="icons-items__grid">
//                   {Array.from({ length: group.count }).map((_, i) => (
//                     <span 
//                       key={i} 
//                       className="icons-items__icon" 
//                       style={{ animationDelay: `${i * 0.1}s` }}
//                     >
//                       <IconComponent />
//                     </span>
//                   ))}
//                 </div>
                
//                 {/* Label under the icons (e.g. "4 Apples") */}
//                 <span className="icons-items__label">{group.label}</span>

//                 {/* Show Operator (like +) if it's not the last group */}
//                 {index < problem.question.visualData.groups.length - 1 && (
//                    <div className="icons-items__operator">
//                      {problem.question.visualData.operator || "+"}
//                    </div>
//                 )}
//               </div>
//             );
//           })}

//           {/* Equals Sign */}
//           <div className="icons-items__operator">=</div>
