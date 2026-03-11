const Concept = require('../models/Concept');
const Attempt = require('../models/Attempt');
const { getNextProblem, updateMastery } = require('../utils/learningEngine');

/**
 * Fetches the next problem for the user based on the KL-UCB learning engine.
 */
exports.getProblem = async (req, res) => {
  try {
    const user = req.user;
    const { concept, question } = await getNextProblem(user);
    await user.save(); // Persist updated ZPD cache
    
    if (!concept || !question) {
      return res.json({ message: 'Curriculum complete!', complete: true });
    }

    res.json({
      concept: { id: concept.id, title: concept.title },
      question: { ...question.toObject(), id: question._id },
      description: concept.description,
    });
  } catch (error) {
    console.error('getProblem error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Validates a user's answer, logs the attempt, and updates mastery.
 */
exports.submitAnswer = async (req, res) => {
  try {
    const { conceptId, questionId, response } = req.body;
    const user = req.user;
    
    const { concept, question } = await Concept.findQuestion(conceptId, questionId);

    if (!concept || !question) {
      return res.status(404).json({ error: 'Concept or Question not found' });
    }

    const isCorrect = response.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();

    await Attempt.create({ user: user._id, conceptId, questionId, isCorrect, response });
    await updateMastery(user, conceptId, isCorrect);
    await user.save();

    res.json({
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || 'Good job!',
      mastery: user.mastery.get(conceptId),
      zpdNodes: user.zpdNodes
    });
  } catch (error) {
    console.error('submitAnswer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Returns the current student's learning progress.
 */
exports.getUserStatus = async (req, res) => {
  try {
    const { username, mastery, zpdNodes } = req.user;
    res.json({ username, mastery, zpdNodes });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
