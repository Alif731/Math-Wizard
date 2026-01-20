import React from "react";

const Dashboard = ({ status }) => {
  if (!status) return null;

  // Flatten mastery map for display
  const nodes = Object.entries(status.mastery).map(([id, data]) => ({
    id,
    ...data,
  }));

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mt-8">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">
        Your Progress Map
      </h3>
      <div className="flex flex-col gap-4">
        {nodes.map((node) => (
          <div
            key={node.id}
            className={`p-4 rounded-lg border-l-4 shadow-sm flex flex-col justify-between
              ${
                node.status === "mastered"
                  ? "bg-green-50 border-green-500"
                  : node.status === "unlocked"
                    ? "bg-yellow-50 border-yellow-400"
                    : "bg-gray-50 border-gray-300 opacity-70"
              }
            `}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-sm text-gray-700 uppercase tracking-wide">
                {node.id.replace(/_/g, " ")}
              </span>
              <span
                className={`text-xs font-bold px-2 py-1 rounded-full ${
                  node.status === "mastered"
                    ? "bg-green-200 text-green-800"
                    : node.status === "unlocked"
                      ? "bg-yellow-200 text-yellow-800"
                      : "bg-gray-200 text-gray-600"
                }`}
              >
                {node.status}
              </span>
            </div>

            {node.status !== "locked" && (
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-300 mt-1">
                <div
                  className={`h-2.5 rounded-full ${node.status === "mastered" ? "bg-green-500" : "bg-yellow-400"}`}
                  style={{
                    width: `${(node.lastAttempts.filter((x) => x).length / Math.max(node.lastAttempts.length, 1)) * 100}%`,
                  }}
                ></div>
                <div className="text-right text-[10px] text-gray-500 mt-1">
                  Streak: {node.lastAttempts.filter((x) => x).length} /{" "}
                  {node.lastAttempts.length}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
