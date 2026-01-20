// import React, { useState, useEffect } from "react";
// import { getProblem, submitAnswer, getStatus } from "../services/api.js";

// import QuestionCard from "../components/QuestionCard.jsx";
// import Dashboard from "../components/Dashboard.jsx";

// function Home() {
//   const [username, setUsername] = useState("student1");
//   const [problem, setProblem] = useState(null);
//   const [status, setStatus] = useState(null);
//   const [feedback, setFeedback] = useState(null); // { isCorrect, explanation, correctAnswer }
//   const [loading, setLoading] = useState(false);

//   const loadData = async () => {
//     setLoading(true);
//     try {
//       const p = await getProblem(username);
//       setProblem(p);
//       const s = await getStatus(username);
//       setStatus(s);
//     } catch (e) {
//       console.error(e);
//     }
//     setLoading(false);
//   };

//   useEffect(() => {
//     loadData();
//   }, [username]);

//   const handleAnswerSubmit = async (answer) => {
//     if (!problem) return;

//     try {
//       const result = await submitAnswer({
//         username,
//         conceptId: problem.concept.id,
//         questionId: problem.question.id,
//         response: answer,
//       });

//       setFeedback(result);
//       // Refresh status immediately to show mastery updates
//       const s = await getStatus(username);
//       setStatus(s);
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   const handleNext = async () => {
//     setFeedback(null);
//     setProblem(null); // Show loading state
//     const p = await getProblem(username);
//     setProblem(p);
//   };

//   return (
//     <div className="min-h-screen bg-blue-50 py-10 px-4 font-sans">
//       <header className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
//         <h1 className="text-3xl font-bold text-blue-900">Math Adventure</h1>
//         <div className="bg-white px-4 py-2 rounded-full shadow-sm text-blue-800 font-semibold">
//           Player: {username}
//         </div>
//       </header>

//       <main className="max-w-4xl mx-auto">
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//           {/* Main Game Area */}
//           <div className="md:col-span-2 space-y-6">
//             {!feedback ? (
//               problem && !problem.complete ? (
//                 <QuestionCard problem={problem} onSubmit={handleAnswerSubmit} />
//               ) : problem && problem.complete ? (
//                 <div className="bg-green-100 p-8 rounded-2xl text-center text-green-800 font-bold text-xl">
//                   🎉 You have mastered all available concepts!
//                 </div>
//               ) : (
//                 <div className="text-center p-12 text-gray-500">
//                   Loading your challenge...
//                 </div>
//               )
//             ) : (
//               <div
//                 className={`p-8 rounded-2xl shadow-xl text-center ${feedback.isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
//               >
//                 <div className="text-6xl mb-4">
//                   {feedback.isCorrect ? "🌟" : "❌"}
//                 </div>
//                 <h2 className="text-3xl font-bold mb-4">
//                   {feedback.isCorrect ? "Awesome!" : "Oops!"}
//                 </h2>
//                 <p className="text-xl mb-6">
//                   {feedback.isCorrect
//                     ? feedback.explanation
//                     : `The correct answer was: ${feedback.correctAnswer}`}
//                 </p>
//                 <button
//                   onClick={handleNext}
//                   className="bg-white text-gray-800 font-bold py-3 px-8 rounded-full text-lg shadow-lg hover:bg-gray-100 transition-all"
//                 >
//                   Next Challenge ➡️
//                 </button>
//               </div>
//             )}
//           </div>

//           {/* Sidebar / Dashboard */}
//           <div className="md:col-span-1">
//             <Dashboard status={status} />
//             <div className="mt-8 bg-yellow-100 p-4 rounded-xl border-l-4 border-yellow-400">
//               <h4 className="font-bold text-yellow-800 mb-2">
//                 Zone of Proximal Development
//               </h4>
//               <p className="text-sm text-yellow-700">
//                 The system is currently targeting:
//                 <span className="font-bold block mt-1">
//                   {status?.zpdNodes.join(", ") || "Loading..."}
//                 </span>
//               </p>
//             </div>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }

// export default Home;

import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  useGetProblemQuery,
  useGetUserStatusQuery,
  useSubmitAnswerMutation,
} from "../store/slices/gameApiSlice";
// --------------------------

import QuestionCard from "../components/QuestionCard";
import Dashboard from "../components/Dashboard";

const Home = () => {
  const { userInfo } = useSelector((state) => state.auth);
  // Use "student1" until Guest logic is fixed in DB
  const username = userInfo?.username || "student1";

  // --- RTK QUERY HOOKS ---
  const {
    data: problem,
    isLoading: loadingProblem,
    isError: errorProblem,
    refetch: refetchProblem,
  } = useGetProblemQuery(username);

  const { data: status } = useGetUserStatusQuery(username);

  const [submitAnswer, { isLoading: isSubmitting }] = useSubmitAnswerMutation();

  // --- LOCAL UI STATE ---
  const [feedback, setFeedback] = useState(null);

  // --- HANDLERS ---
  const handleAnswerSubmit = async (answer) => {
    // Safety check
    if (!problem?.question) return;

    try {
      const result = await submitAnswer({
        username,
        conceptId: problem.concept.id,
        questionId: problem.question.id,
        response: answer,
      }).unwrap();

      setFeedback(result);
    } catch (err) {
      console.error("Failed to submit:", err);
    }
  };

  const handleNext = () => {
    setFeedback(null);
    refetchProblem();
  };

  // --- RENDER HELPERS ---
  const isMastered = problem?.complete;

  return (
    <div className="min-h-screen bg-blue-50 py-10 px-4 font-sans">
      {/* HEADER */}
      <header className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-blue-900">Math Adventure</h1>
        <div className="bg-white px-4 py-2 rounded-full shadow-sm text-blue-800 font-semibold">
          Player: {username}
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* --- MAIN GAME AREA (Left Col) --- */}
          <div className="md:col-span-2 space-y-6">
            {/* 1. FEEDBACK POPUP */}
            {feedback ? (
              <div
                className={`p-8 rounded-2xl shadow-xl text-center ${feedback.isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
              >
                <div className="text-6xl mb-4">
                  {feedback.isCorrect ? "🌟" : "❌"}
                </div>
                <h2 className="text-3xl font-bold mb-4">
                  {feedback.isCorrect ? "Awesome!" : "Oops!"}
                </h2>
                <p className="text-xl mb-6">
                  {feedback.isCorrect
                    ? feedback.explanation
                    : `The correct answer was: ${feedback.correctAnswer}`}
                </p>
                <button
                  onClick={handleNext}
                  className="bg-white text-gray-800 font-bold py-3 px-8 rounded-full text-lg shadow-lg hover:bg-gray-100 transition-all"
                >
                  Next Challenge ➡️
                </button>
              </div>
            ) : // 2. MASTERY STATE (Course Complete)
            isMastered ? (
              <div className="bg-green-100 p-8 rounded-2xl text-center text-green-800 font-bold text-xl">
                🎉 You have mastered all available concepts!
              </div>
            ) : // 3. LOADING STATE
            loadingProblem ? (
              <div className="text-center p-12 text-gray-500">
                <div className="animate-spin text-4xl mb-4">⏳</div>
                Loading your challenge...
              </div>
            ) : // 4. ERROR STATE
            errorProblem ? (
              <div className="bg-red-100 p-8 rounded-2xl text-center text-red-800">
                ⚠️ Error loading game data. Please try refreshing.
              </div>
            ) : (
              // 5. QUESTION CARD (Normal Play)
              // Ensure we have a problem before rendering
              problem && (
                <QuestionCard
                  problem={problem}
                  onSubmit={handleAnswerSubmit}
                  disabled={isSubmitting}
                />
              )
            )}
          </div>

          {/* --- SIDEBAR AREA (Right Col) --- */}
          <div className="md:col-span-1">
            {/* Dashboard Component */}
            <Dashboard status={status} />

            {/* ZPD Info Box (This was missing!) */}
            <div className="mt-8 bg-yellow-100 p-4 rounded-xl border-l-4 border-yellow-400">
              <h4 className="font-bold text-yellow-800 mb-2">
                Zone of Proximal Development
              </h4>
              <p className="text-sm text-yellow-700">
                The system is currently targeting:
                <span className="font-bold block mt-1">
                  {/* Handle loading state for status safely */}
                  {status?.zpdNodes?.join(", ") || "Analyzing..."}
                </span>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
