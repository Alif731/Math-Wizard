const Concept = require("../models/Concept");
const User = require("../models/User");

// Constants
const WINDOW_SIZE = 10;
const MASTERY_THRESHOLD = 0.8; // 80%

/**
 * Updates the user's mastery for a specific concept based on the latest attempt.
 * @param {Object} user - The user document.
 * @param {String} conceptId - The ID of the concept attempted.
 * @param {Boolean} isCorrect - Whether the attempt was correct.
 */
async function updateMastery(user, conceptId, isCorrect) {
  // Initialize mastery entry if not exists
  if (!user.mastery.has(conceptId)) {
    user.mastery.set(conceptId, {
      status: "unlocked",
      successCount: 0,
      attemptCount: 0,
      lastAttempts: [],
    });
  }

  const masteryData = user.mastery.get(conceptId);

  // Update sliding window
  masteryData.lastAttempts.push(isCorrect);
  if (masteryData.lastAttempts.length > WINDOW_SIZE) {
    masteryData.lastAttempts.shift();
  }

  masteryData.attemptCount += 1;
  if (isCorrect) masteryData.successCount += 1;

  // Check for mastery
  const recentSuccessRate =
    masteryData.lastAttempts.filter((x) => x).length /
    masteryData.lastAttempts.length;

  if (
    masteryData.status !== "mastered" &&
    masteryData.lastAttempts.length >= 15 && // Minimum attempts before mastery
    recentSuccessRate >= MASTERY_THRESHOLD
  ) {
    masteryData.status = "mastered";
    await unlockChildren(user, conceptId);
  }

  // Save changes is handled by caller usually, but we can do it here if passed a mongoose doc
  // We assume 'user' is a mongoose doc
}

/**
 * Unlocks child concepts if all their prerequisites are met.
 */
async function unlockChildren(user, parentId) {
  // Find all concepts that have parentId as a prerequisite
  const children = await Concept.find({ prerequisites: parentId });

  for (const child of children) {
    // Check if ALL prerequisites are mastered
    let allPrereqsMastered = true;
    for (const prereqId of child.prerequisites) {
      const prereqMastery = user.mastery.get(prereqId);
      if (!prereqMastery || prereqMastery.status !== "mastered") {
        allPrereqsMastered = false;
        break;
      }
    }

    if (allPrereqsMastered) {
      // Unlock child
      if (!user.mastery.has(child.id)) {
        user.mastery.set(child.id, {
          status: "unlocked",
          successCount: 0,
          attemptCount: 0,
          lastAttempts: [],
        });
      } else {
        const m = user.mastery.get(child.id);
        if (m.status === "locked") m.status = "unlocked";
      }

      // Add to ZPD if not already there
      if (!user.zpdNodes.includes(child.id)) {
        user.zpdNodes.push(child.id);
      }
    }
  }

  // Remove parent from ZPD if mastered (optional, or keep for review)
  // user.zpdNodes = user.zpdNodes.filter(id => id !== parentId);
  // For now, let's keep mastered nodes in ZPD but prioritize others?
  // Actually, usually ZPD moves forward. Let's remove mastered from ZPD to force progression.
  user.zpdNodes = user.zpdNodes.filter((id) => id !== parentId);
}

/**
 * Selects the next concept for the user to practice using a simplified UCB/Heuristic.
 */
async function getNextConcept(user) {
  if (user.zpdNodes.length === 0) {
    // If ZPD is empty, maybe they finished everything or just started?
    // If just started, find roots.
    if (user.mastery.size === 0) {
      // Return root concepts
      const roots = await Concept.find({ prerequisites: { $size: 0 } });
      if (roots.length > 0) return roots[0];
    }
    return null; // Finished or error
  }

  // Simple Bandit:
  // Explore: Nodes with few attempts.
  // Exploit: Nodes with lower success rate (need practice) ?
  // Actually UCB usually maximizes reward. Here "Reward" is "Learning".
  // Let's just pick a random node from ZPD for now to ensure variety.

  const randomNodeId =
    user.zpdNodes[Math.floor(Math.random() * user.zpdNodes.length)];
  return await Concept.findOne({ id: randomNodeId });
}

module.exports = { updateMastery, getNextConcept };
