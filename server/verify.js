const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const seedData = require('./utils/seeder');
const User = require('./models/User');
const Concept = require('./models/Concept');
const { updateMastery, getNextConcept } = require('./utils/learningEngine');

async function verify() {
  // 1. Setup DB
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  console.log('DB Connected');

  // 2. Seed
  await seedData();
  console.log('Seeded');

  // 3. Get User
  let user = await User.findOne({ username: 'student1' });
  console.log('Initial ZPD:', user.zpdNodes);

  // 4. Simulate Mastery of 'foundation_signs' (Root)
  console.log('Simulating 15 correct attempts for foundation_signs...');
  for (let i = 0; i < 15; i++) {
    await updateMastery(user, 'foundation_signs', true);
  }
  
  // Check Mastery
  let m = user.mastery.get('foundation_signs');
  console.log('Mastery Status (foundation_signs):', m.status);

  if (m.status !== 'mastered') {
    console.error('FAILED: foundation_signs should be mastered.');
    process.exit(1);
  }

  // Check Unlock of 'visual_addition'
  const visualAdd = user.mastery.get('visual_addition');
  console.log('Mastery Status (visual_addition):', visualAdd ? visualAdd.status : 'undefined');
  
  if (!visualAdd || visualAdd.status !== 'unlocked') {
     console.error('FAILED: visual_addition should be unlocked.');
     process.exit(1);
  }

  // 5. Simulate Mastery of 'visual_addition'
  console.log('Simulating 15 correct attempts for visual_addition...');
  for (let i = 0; i < 15; i++) {
    await updateMastery(user, 'visual_addition', true);
  }

  m = user.mastery.get('visual_addition');
  console.log('Mastery Status (visual_addition):', m.status);

  // Check Unlock of 'add_single'
  const addSingle = user.mastery.get('add_single');
  console.log('Mastery Status (add_single):', addSingle ? addSingle.status : 'undefined');

  if (!addSingle || addSingle.status !== 'unlocked') {
     console.error('FAILED: add_single should be unlocked.');
     process.exit(1);
  }

  console.log('SUCCESS: Mastery and Progression verified.');
  process.exit(0);
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
