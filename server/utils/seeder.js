const Concept = require('../models/Concept');
const User = require('../models/User');
const Attempt = require('../models/Attempt');

const conceptsData = [
  {
    id: 'add_single',
    title: 'Single Digit Addition',
    description: 'Adding numbers from 0 to 9.',
    prerequisites: [],
    questions: [
      { text: 'What is 2 + 3?', correctAnswer: '5', type: 'direct', difficulty: 1 },
      { text: 'If you have 4 apples and get 2 more, how many do you have?', correctAnswer: '6', type: 'direct', difficulty: 1 },
      { text: '5 + 0 = ?', correctAnswer: '5', type: 'distractor', difficulty: 1 },
      { text: '3 + 4', correctAnswer: '7', type: 'direct', difficulty: 2 },
      { text: 'What is 9 + 1?', correctAnswer: '10', type: 'direct', difficulty: 2 },
    ]
  },
  {
    id: 'sub_single',
    title: 'Single Digit Subtraction',
    description: 'Subtracting numbers from 0 to 9.',
    prerequisites: ['add_single'],
    questions: [
      { text: '5 - 2 = ?', correctAnswer: '3', type: 'direct', difficulty: 1 },
      { text: '9 - 1 = ?', correctAnswer: '8', type: 'direct', difficulty: 1 },
      { text: 'You have 5 candies and eat 5. How many are left?', correctAnswer: '0', type: 'distractor', difficulty: 2 },
    ]
  },
  {
    id: 'add_double_no_carry',
    title: 'Double Digit Addition (No Carry)',
    description: 'Adding numbers like 10 + 20.',
    prerequisites: ['add_single'],
    questions: [
      { text: '10 + 10 = ?', correctAnswer: '20', type: 'direct', difficulty: 3 },
      { text: '12 + 5 = ?', correctAnswer: '17', type: 'direct', difficulty: 3 },
    ]
  },
  {
    id: 'mixed_ops_basic',
    title: 'Basic Mixed Operations',
    description: 'Simple addition and subtraction mixed.',
    prerequisites: ['sub_single', 'add_double_no_carry'],
    questions: [
      { text: '5 + 2 - 1 = ?', correctAnswer: '6', type: 'algebraic', difficulty: 4 },
    ]
  }
];

const seedData = async () => {
  try {
    const count = await Concept.countDocuments();
    if (count > 0) return; // Already seeded

    await Concept.deleteMany({});
    await User.deleteMany({});
    await Attempt.deleteMany({});

    await Concept.insertMany(conceptsData);
    console.log('Concepts Seeded');

    const testUser = new User({
      username: 'student1',
      role: 'student',
      mastery: {},
      zpdNodes: ['add_single'] // Root node
    });
    
    // Initialize mastery for root
    testUser.mastery.set('add_single', { status: 'unlocked', successCount: 0, attemptCount: 0, lastAttempts: [] });

    await testUser.save();
    console.log('Test User Seeded');
  } catch (error) {
    console.error('Seeding Error:', error);
  }
};

module.exports = seedData;
