const Concept = require("../models/Concept");
const User = require("../models/User");

// Constants
const WINDOW_SIZE = 10;
const MASTERY_THRESHOLD = 0.8; // 80%
const KL_UCB_C = 3; // Exploration constant for KL-UCB

/**
 * KL Divergence for Bernoulli distributions.
 */
function klBernoulli(p, q) {
  const eps = 1e-15;
  p = Math.min(Math.max(p, eps), 1 - eps);
  q = Math.min(Math.max(q, eps), 1 - eps);
  return p * Math.log(p / q) + (1 - p) * Math.log((1 - p) / (1 - q));
}

/**
 * Solves for q such that klBernoulli(p, q) = upper_bound using binary search.
 */
function solveKlUcb(p, upperBound) {
  let low = p;
  let high = 1;
  for (let i = 0; i < 20; i++) {
    let mid = (low + high) / 2;
    if (klBernoulli(p, mid) < upperBound) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return high;
}

/**
 * Updates the user's mastery for a specific concept based on the latest attempt.
 * @param {Object} user - The user document.
 * @param {String} conceptId - The ID of the concept attempted.
 * @param {Boolean} isCorrect - Whether the attempt was correct.
 */
async function updateMastery(user, conceptId, isCorrect) {
  if (!user.mastery.has(conceptId)) {
    user.mastery.set(conceptId, {
      status: "unlocked",
      successCount: 0,
      attemptCount: 0,
      lastAttempts: [],
    });
  }

  const masteryData = user.mastery.get(conceptId);

  masteryData.lastAttempts.push(isCorrect);
  if (masteryData.lastAttempts.length > WINDOW_SIZE) {
    masteryData.lastAttempts.shift();
  }

  masteryData.attemptCount += 1;
  if (isCorrect) masteryData.successCount += 1;

  const recentSuccessRate =
    masteryData.lastAttempts.filter((x) => x).length /
    masteryData.lastAttempts.length;

  if (
    masteryData.status !== "mastered" &&
    masteryData.attemptCount >= 15 &&
    recentSuccessRate >= MASTERY_THRESHOLD
  ) {
    masteryData.status = "mastered";
    await unlockChildren(user, conceptId);
  }

  // Ensure mastered nodes are strictly removed from ZPD
  if (masteryData.status === "mastered" && user.zpdNodes.includes(conceptId)) {
    user.zpdNodes = user.zpdNodes.filter((id) => id !== conceptId);
  }
}

/**
 * Unlocks child concepts if all their prerequisites are met.
 */
async function unlockChildren(user, parentId) {
  const children = await Concept.find({ prerequisites: parentId });

  for (const child of children) {
    let allPrereqsMastered = true;
    for (const prereqId of child.prerequisites) {
      const prereqMastery = user.mastery.get(prereqId);
      if (!prereqMastery || prereqMastery.status !== "mastered") {
        allPrereqsMastered = false;
        break;
      }
    }

    if (allPrereqsMastered) {
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

      const m = user.mastery.get(child.id);
      if (m.status !== "mastered" && !user.zpdNodes.includes(child.id)) {
        user.zpdNodes.push(child.id);
      }
    }
  }

  user.zpdNodes = user.zpdNodes.filter((id) => id !== parentId);
}

/**
 * Selects the next concept using the KL-UCB algorithm.
 * Proactively refreshes ZPD to ensure newly added concepts are discovered.
 */
async function getNextConcept(user) {
  // 1. Proactive ZPD Discovery
  const allConcepts = await Concept.find({});
  
  const eligibleNodes = allConcepts.filter(concept => {
    // Skip if already mastered
    const m = user.mastery.get(concept.id);
    if (m && m.status === "mastered") return false;

    // Check if ALL prerequisites are mastered in the user's record
    if (!concept.prerequisites || concept.prerequisites.length === 0) return true;
    
    return concept.prerequisites.every(pId => {
      const pm = user.mastery.get(pId);
      return pm && pm.status === "mastered";
    });
  });

  // Update the user's ZPD cache string array
  user.zpdNodes = eligibleNodes.map(c => c.id);

  if (eligibleNodes.length === 0) {
    return null; // Curriculum complete
  }

  // 2. KL-UCB Selection
  const nt = eligibleNodes.reduce((sum, node) => {
    const m = user.mastery.get(node.id);
    return sum + (m ? m.attemptCount : 0);
  }, 0);

  const logTerm = Math.log(1 + nt * Math.pow(Math.log(Math.max(nt, 2)), 2));

  let bestNode = null;
  let maxScore = -Infinity;

  for (const node of eligibleNodes) {
    const m = user.mastery.get(node.id);
    let score;

    if (!m || m.attemptCount === 0) {
      score = Infinity; // Explore new nodes first
    } else {
      const p = m.successCount / m.attemptCount;
      const upperBound = logTerm / m.attemptCount;
      score = solveKlUcb(p, upperBound);
    }

    if (score > maxScore) {
      maxScore = score;
      bestNode = node;
    }
  }

  return bestNode || eligibleNodes[0];
}

module.exports = { updateMastery, getNextConcept };
