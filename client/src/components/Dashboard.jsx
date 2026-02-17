// Progress Bar
import React from "react";
import "../sass/components/dashboard.scss"; // Make sure to create this file

const Dashboard = ({ status }) => {
  if (!status) return null;

  // Flatten mastery map for display
  const nodes = Object.entries(status.mastery).map(([id, data]) => ({
    id,
    ...data,
  }));

  return (
    <div className="dashboard-card">
      <h3 className="dashboard-title">Your Progress Map</h3>

      <div className="dashboard-list">
        {nodes.map((node) => (
          <div
            key={node.id}
            // Dynamic class based on status: 'mastered', 'unlocked', or 'locked'
            className={`node-item ${node.status || "locked"}`}
          >
            {/* --- Node Header --- */}
            <div className="node-header">
              <span className="node-title">{node.id.replace(/_/g, " ")}</span>
              <span className={`node-badge ${node.status || "locked"}`}>
                {node.status}
              </span>
            </div>

            {/* --- Progress Bar (Hidden if locked) --- */}
            {node.status !== "locked" && (
              <div className="progress-container">
                <div className="progress-track">
                  <div
                    className={`progress-fill ${node.status}`}
                    style={{
                      width: `${(node.lastAttempts.filter((x) => x).length / Math.max(node.lastAttempts.length, 1)) * 100}%`,
                    }}
                  ></div>
                </div>
                <div className="progress-text">
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
