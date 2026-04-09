const mongoose = require('mongoose');
const assert = require('node:assert/strict');
const { MongoMemoryServer } = require('mongodb-memory-server');
const seedData = require('./utils/seeder');
const User = require('./models/User');
const { updateMastery, getNextProblem } = require('./utils/learningEngine');

async function verify() {
  // 1. Setup DB
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  console.log('DB Connected');

  // 2. Seed
  await seedData();
  console.log('Seeded');

  // 3. Create a clean student state for adaptive sequencing verification
  let user = await User.create({
    username: 'adaptive_student',
    password: 'password123',
    role: 'student',
    mastery: {},
    zpdNodes: ['single_add'],
  });
  console.log('Initial ZPD:', user.zpdNodes);

  // 4. Verify question sequencing within the same concept.
  let firstProblem = await getNextProblem(user);
  await user.save();
  console.log('First chosen concept:', firstProblem.concept.id);
  assert.equal(firstProblem.concept.id, 'single_add');

  await updateMastery(user, 'single_add', true);
  await user.save();
  user = await User.findById(user._id);

  let secondProblem = await getNextProblem(user);
  await user.save();
  assert.notEqual(String(secondProblem.question._id), String(firstProblem.question._id));
  console.log('Question sequencing verified for single_add.');

  const orderedConcepts = [
    'single_add',
    'single_sub',
    'multi_add',
    'multi_sub',
    'missing_part_equations',
    'equations_from_bar_models',
    'schema_combine',
    'schema_change',
    'schema_compare',
  ];

  for (let index = 0; index < orderedConcepts.length - 1; index++) {
    const currentConceptId = orderedConcepts[index];
    const nextConceptId = orderedConcepts[index + 1];

    console.log(`Simulating mastery for ${currentConceptId}...`);
    const existingAttempts = currentConceptId === 'single_add' ? 1 : 0;
    const requiredAttempts = 15 - existingAttempts;

    for (let i = 0; i < requiredAttempts; i++) {
      await updateMastery(user, currentConceptId, true);
    }

    await user.save();
    user = await User.findById(user._id);

    const masteredEntry = user.mastery.get(currentConceptId);
    console.log(`Mastery Status (${currentConceptId}):`, masteredEntry?.status);
    assert.equal(masteredEntry?.status, 'mastered');

    const unlockedEntry = user.mastery.get(nextConceptId);
    console.log(`Mastery Status (${nextConceptId}):`, unlockedEntry ? unlockedEntry.status : 'undefined');
    assert.equal(unlockedEntry?.status, 'unlocked');
  }

  const finalProblem = await getNextProblem(user);
  await user.save();
  assert.equal(finalProblem.concept.id, 'schema_compare');

  console.log('SUCCESS: KL-UCB sequencing, change-point mastery, and graph progression verified.');
  process.exit(0);
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
