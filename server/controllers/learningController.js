const Concept = require("../models/Concept");
const Attempt = require("../models/Attempt");
const {
  getNextProblem,
  updateMastery,
  jumpToConcept,
  MASTERY_MIN_ATTEMPTS,
  MASTERY_SCORE_THRESHOLD,
  MASTERY_SUCCESS_RATE,
  WINDOW_SIZE,
} = require("../utils/learningEngine");
const {
  serializeResponse,
  validateQuestionResponse,
} = require("../utils/schemaQuestionUtils");

// Shared config object sent to frontend — single source of truth
const masteryConfig = {
  masteryMinAttempts: MASTERY_MIN_ATTEMPTS,
  masteryScoreThreshold: MASTERY_SCORE_THRESHOLD,
  masterySuccessRate: MASTERY_SUCCESS_RATE,
  windowSize: WINDOW_SIZE,
};

/**
 * Fetches the next problem for the user based on the KL-UCB learning engine.
 */
exports.getProblem = async (req, res) => {
  try {
    const user = req.user;
    const { concept, question } = await getNextProblem(user);
    await user.save(); // Persist updated ZPD cache

    if (!concept || !question) {
      return res.json({ message: "Curriculum complete!", complete: true });
    }

    // for ghost panel
    const masteryEntry = user.mastery.get(concept.id);
    const rawAdaptiveState = masteryEntry.adaptiveState.toObject
      ? masteryEntry.adaptiveState.toObject()
      : masteryEntry.adaptiveState;
    res.json({
      concept: { id: concept.id, title: concept.title },
      question: { ...question.toObject(), id: question._id },
      description: concept.description,
      masteryConfig,
      //  ghost panel stats
      adaptiveState: {
        ...rawAdaptiveState, //  Now the score, G, S, and UCB will actually spread!
        status: masteryEntry.status,
        attemptCount: masteryEntry.attemptCount,
        successCount: masteryEntry.successCount,
        lastAttempts: masteryEntry.lastAttempts,
      },
    });
  } catch (error) {
    console.error("getProblem error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Validates a user's answer, logs the attempt, and updates mastery.
 */
exports.submitAnswer = async (req, res) => {
  try {
    const { conceptId, questionId, response } = req.body;
    const user = req.user;

    const { concept, question } = await Concept.findQuestion(
      conceptId,
      questionId,
    );

    if (!concept || !question) {
      return res.status(404).json({ error: "Concept or Question not found" });
    }

    const isCorrect = validateQuestionResponse(question.toObject(), response);

    // Log attempt
    await Attempt.create({
      user: user._id,
      conceptId,
      questionId,
      isCorrect,
      response: typeof response === "string" ? response : serializeResponse(response),
    });

    // Update mastery first (returns bundle metadata for streak logic)
    const { bundleJustCompleted, bundleCorrect } = await updateMastery(user, conceptId, isCorrect);

    // --- BUNDLE-AWARE STREAK ---
    // For Module 4 (_mod4), streak only updates on bundle completion.
    // For all other modules, every answer updates streak (bundleJustCompleted is always true).
    if (bundleJustCompleted) {
      if (bundleCorrect) {
        user.streak += 1;
        if (user.streak > (user.maxStreak || 0)) {
          user.maxStreak = user.streak;
        }
      } else {
        user.streak = 0;
      }
    }

    await user.save(); // This now saves the NEW streak to MongoDB

    const updatedEntry = user.mastery.get(conceptId); // ghost panel

    res.json({
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || "Good job!",
      streak: user.streak, // Send new streak back to frontend
      mastery: user.mastery.get(conceptId),
      adaptiveState: updatedEntry?.adaptiveState || {},
      zpdNodes: user.zpdNodes,
    });
  } catch (error) {
    console.error("submitAnswer error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
// exports.submitAnswer = async (req, res) => {
//   try {
//     const { conceptId, questionId, response } = req.body;
//     const user = req.user;

//     const { concept, question } = await Concept.findQuestion(conceptId, questionId);

//     if (!concept || !question) {
//       return res.status(404).json({ error: 'Concept or Question not found' });
//     }

//     const isCorrect = response.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();

//     await Attempt.create({ user: user._id, conceptId, questionId, isCorrect, response });
//     await updateMastery(user, conceptId, isCorrect);
//     await user.save();

//     res.json({
//       isCorrect,
//       correctAnswer: question.correctAnswer,
//       explanation: question.explanation || 'Good job!',
//       mastery: user.mastery.get(conceptId),
//       zpdNodes: user.zpdNodes
//     });
//   } catch (error) {
//     console.error('submitAnswer error:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

/**
 * Returns the current student's learning progress.
 */
exports.getUserStatus = async (req, res) => {
  try {
    const { username, mastery, zpdNodes, streak } = req.user;

    res.json({ username, mastery, zpdNodes, streak, masteryConfig });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
// exports.getUserStatus = async (req, res) => {
//   try {
//     const { username, mastery, zpdNodes } = req.user;
//     res.json({ username, mastery, zpdNodes });
//   } catch (error) {
//     res.status(500).json({ error: "Server error" });
//   }
// };

/**
 * Jump the student to a specific concept, mastering all prerequisites.
 * Used by the Student Hub to let students skip practice and go directly
 * to word problems.
 */
exports.jumpToConcept = async (req, res) => {
  try {
    const { conceptId } = req.body;
    const user = req.user;

    if (!conceptId) {
      return res.status(400).json({ error: "conceptId is required" });
    }

    await jumpToConcept(user, conceptId);
    await user.save();

    res.json({ success: true, zpdNodes: user.zpdNodes });
  } catch (error) {
    console.error("jumpToConcept error:", error);
    res.status(500).json({ error: error.message || "Server error" });
  }
};

/**
 * Switch the active section for the student.
 */
exports.switchSection = async (req, res) => {
  try {
    const { sectionId } = req.body;
    const user = req.user;

    if (!sectionId) {
      return res.status(400).json({ error: "sectionId is required" });
    }

    const { switchSection } = require("../utils/learningEngine");
    await switchSection(user, sectionId);
    await user.save();

    res.json({ success: true, zpdNodes: user.zpdNodes });
  } catch (error) {
    console.error("switchSection error:", error);
    res.status(500).json({ error: error.message || "Server error" });
  }
};
