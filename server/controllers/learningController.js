const User = require('../models/User');
const Concept = require('../models/Concept');
const Attempt = require('../models/Attempt');
const { getNextConcept, updateMastery } = require('../utils/learningEngine');

exports.getProblem = async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'Username required' });

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const concept = await getNextConcept(user);
    
    if (!concept) {
      return res.json({ message: 'No available problems. You might have mastered everything!', complete: true });
    }

    // Select a question (Simple Random for now)
    // In real app, avoid recently used questions
    const question = concept.questions[Math.floor(Math.random() * concept.questions.length)];

    // Exclude correctAnswer from response
    // const { correctAnswer, ...qData } = question.toObject();
    const qData = question.toObject(); // include correct answer

    res.json({
      concept: { id: concept.id, title: concept.title },
      question: { ...qData, id: question._id }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.submitAnswer = async (req, res) => {
  try {
    const { username, conceptId, questionId, response } = req.body;
    
    const user = await User.findOne({ username });
    const concept = await Concept.findOne({ id: conceptId });

    if (!user || !concept) return res.status(404).json({ error: 'Not found' });

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
    const { username } = req.query;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      username: user.username,
      mastery: user.mastery,
      zpdNodes: user.zpdNodes
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
