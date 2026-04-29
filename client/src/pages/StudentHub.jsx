import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useJumpToConceptMutation } from "../store/slices/gameApiSlice";
import "../sass/page/studentHub.scss";

const PATHWAYS = [
  {
    id: "practice",
    title: "Start with Practice",
    description:
      "Build your foundation with arithmetic and algebraic thinking before tackling word problems.",
    icon: "",
    recommended: true,
    // No jump needed — this is the default flow starting from single_add
    targetConcept: null,
  },
  {
    id: "equations",
    title: "Missing Number Practice",
    description:
      "Practice finding the missing number in equations to sharpen your algebraic skills.",
    icon: "",
    recommended: true,
    targetConcept: "missing_part_equations",
  },
  {
    id: "schemas",
    title: "Word Problems",
    description:
      "Jump straight into solving word problems using schemas. Best if you're already comfortable with arithmetic.",
    icon: "",
    recommended: false,
    targetConcept: "combine_mod1",
  },
];

const StudentHub = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const username = userInfo?.username;
  const navigate = useNavigate();
  const [jumpToConcept, { isLoading }] = useJumpToConceptMutation();
  const [selectedId, setSelectedId] = useState(null);

  const handleSelect = async (pathway) => {
    setSelectedId(pathway.id);

    if (!pathway.targetConcept) {
      // Default flow — just go to /home
      navigate("/home");
      return;
    }

    try {
      await jumpToConcept({ conceptId: pathway.targetConcept }).unwrap();
      navigate("/home");
    } catch (err) {
      console.error("Jump failed:", err);
      setSelectedId(null);
    }
  };

  if (!username) return <div className="loading-state">Loading...</div>;

  return (
    <div className="student-hub">
      <header className="student-hub__header">
        <h1>
          Welcome, <span className="highlight-name">{username}</span>!
        </h1>
        <p className="student-hub__subtitle">
          Choose how you'd like to start your learning journey.
        </p>
      </header>

      <div className="student-hub__pathways">
        {PATHWAYS.map((pathway) => (
          <button
            key={pathway.id}
            className={`pathway-card ${pathway.recommended ? "pathway-card--recommended" : "pathway-card--skip"} ${selectedId === pathway.id ? "pathway-card--loading" : ""}`}
            onClick={() => handleSelect(pathway)}
            disabled={isLoading}
          >
            <span className="pathway-card__icon">{pathway.icon}</span>
            <h2 className="pathway-card__title">{pathway.title}</h2>
            <p className="pathway-card__desc">{pathway.description}</p>
            {pathway.recommended && (
              <span className="pathway-card__badge">✨ Recommended</span>
            )}
            {!pathway.recommended && (
              <span className="pathway-card__badge pathway-card__badge--skip">
                Skip ahead
              </span>
            )}
          </button>
        ))}
      </div>

      <p className="student-hub__hint">
        💡 We recommend starting with practice sections to build a strong
        foundation before moving to word problems.
      </p>
    </div>
  );
};

export default StudentHub;
