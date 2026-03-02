const User = require('../models/User');
const Concept = require('../models/Concept');
const Attempt = require('../models/Attempt');
const { getNextConcept, updateMastery } = require('../utils/learningEngine');

exports.getProblem = async (req, res) => {
  try {
    const user = req.user; // Set by protect middleware

    const concept = await getNextConcept(user);
    await user.save(); // Persist the updated ZPD cache
    
    if (!concept) {
      return res.json({ message: 'No available problems. You might have mastered everything!', complete: true });
    }

    // Select a question (Simple Random for now)
    const question = concept.questions[Math.floor(Math.random() * concept.questions.length)];

    res.json({
      concept: { id: concept.id, title: concept.title },
      question: { ...question.toObject(), id: question._id },
      description: concept.description,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.submitAnswer = async (req, res) => {
  try {
    const { conceptId, questionId, response } = req.body;
    const user = req.user; // Set by protect middleware
    
    const concept = await Concept.findOne({ id: conceptId });

    if (!concept) return res.status(404).json({ error: 'Concept not found' });

    const question = concept.questions.id(questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    // Check answer (Case insensitive for simplicity)
    const isCorrect = response.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();

    // Log Attempt
    await Attempt.create({
      user: user._id,
      conceptId,
      questionId,
      isCorrect,
      response
    });

    // Update Mastery
    await updateMastery(user, conceptId, isCorrect);
    await user.save(); // Persist changes to user (mastery, zpd)

    res.json({
      isCorrect,
      correctAnswer: question.correctAnswer, // Show answer after attempt
      explanation: question.explanation || 'Good job!',
      mastery: user.mastery.get(conceptId),
      zpdNodes: user.zpdNodes
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getUserStatus = async (req, res) => {
  try {
    const user = req.user; // Set by protect middleware

    res.json({
      username: user.username,
      mastery: user.mastery,
      zpdNodes: user.zpdNodes
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
