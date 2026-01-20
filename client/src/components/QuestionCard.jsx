import React, { useState } from "react";

const QuestionCard = ({ problem, onSubmit }) => {
  const [answer, setAnswer] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(answer);
    setAnswer("");
  };

  if (!problem) return <div className="text-center p-8">Loading...</div>;

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg mx-auto mt-10 border-4 border-blue-200">
      <h2 className="text-xl font-bold text-gray-700 mb-4 uppercase tracking-wide">
        {problem.concept.title}
      </h2>

      <div className="text-3xl font-bold text-blue-600 mb-8 text-center">
        {problem.question.text}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer here..."
          className="p-4 text-xl border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-center"
          autoFocus
        />
        <button
          type="submit"
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl text-lg transition-transform transform hover:scale-105 active:scale-95"
        >
          Submit Answer
        </button>
      </form>
    </div>
  );
};

export default QuestionCard;
