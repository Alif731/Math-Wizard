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

  // 4. Simulate Mastery of 'add_single' (Root)
  // Logic requires >= 5 attempts and > 80% success
  console.log('Simulating 5 correct attempts for add_single...');
  for (let i = 0; i < 5; i++) {
    await updateMastery(user, 'add_single', true);
  }
  
  // Reload user to see changes (though updateMastery modifies doc in place, saving might be needed if logic re-fetches, but here we passed doc)
  // But updateMastery implementation modifies the object `user` directly.
  // However, `unlockChildren` calls `Concept.find`, so that's fine.
  
  // Check Mastery
  const m = user.mastery.get('add_single');
  console.log('Mastery Status (add_single):', m.status);

  if (m.status !== 'mastered') {
    console.error('FAILED: add_single should be mastered.');
    process.exit(1);
  }

  // Check Unlock
  const sub = user.mastery.get('sub_single');
  console.log('Mastery Status (sub_single):', sub ? sub.status : 'undefined');
  
  if (!sub || sub.status !== 'unlocked') {
     // Debug: Check if sub_single exists
     const c = await Concept.findOne({ id: 'sub_single' });
     console.log('Sub Single Concept Prereqs:', c.prerequisites);
     console.error('FAILED: sub_single should be unlocked.');
     process.exit(1);
  }

  console.log('SUCCESS: Mastery and Progression verified.');
  process.exit(0);
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
