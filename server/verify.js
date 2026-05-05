const mongoose = require("mongoose");
const assert = require("node:assert/strict");
const { MongoMemoryServer } = require("mongodb-memory-server");
const seedData = require("./utils/seeder");
const Concept = require("./models/Concept");
const User = require("./models/User");
const { updateMastery, getNextProblem } = require("./utils/learningEngine");

const orderedConcepts = [
  "single_add",
  "single_sub",
  "multi_add",
  "multi_sub",
  "missing_part_equations",
  "combine_mod1",
  "combine_mod2",
  "combine_mod3",
  "combine_mod4",
  "combine_mod5",
  "change_mod1",
  "change_mod2",
  "change_mod3",
  "change_mod4",
  "change_mod5",
  "compare_mod1",
  "compare_mod2",
  "compare_mod3",
  "compare_mod4",
  "compare_mod5",
];

const expectedPrerequisites = {
  single_add: [],
  single_sub: ["single_add"],
  multi_add: ["single_sub"],
  multi_sub: ["multi_add"],
  missing_part_equations: ["multi_sub"],
  combine_mod1: ["missing_part_equations"],
  combine_mod2: ["combine_mod1"],
  combine_mod3: ["combine_mod2"],
  combine_mod4: ["combine_mod3"],
  combine_mod5: ["combine_mod4"],
  change_mod1: ["combine_mod5"],
  change_mod2: ["change_mod1"],
  change_mod3: ["change_mod2"],
  change_mod4: ["change_mod3"],
  change_mod5: ["change_mod4"],
  compare_mod1: ["change_mod5"],
  compare_mod2: ["compare_mod1"],
  compare_mod3: ["compare_mod2"],
  compare_mod4: ["compare_mod3"],
  compare_mod5: ["compare_mod4"],
};

const getGivenSlotKeys = (slots = {}) =>
  Object.entries(slots)
    .filter(([, value]) => String(value).trim() !== "?")
    .map(([key]) => key)
    .sort();

const getEditableEquationKeys = (question) =>
  (question.equationSpec?.template || [])
    .filter((item) => item.type === "slot" && item.editable !== false)
    .map((item) => item.key)
    .sort();

function assertSchemaQuestionShape(concept) {
  for (const question of concept.questions) {
    if (question.moduleStage === "word_to_bar" || question.moduleStage === "schema_bar_model") {
      assert.deepEqual(
        [...(question.barModelSpec?.editableKeys || [])].sort(),
        getGivenSlotKeys(question.validation?.slots),
        `${concept.id} should only make given bar slots editable`,
      );
      assert.equal(
        question.barModelSpec?.editableKeys?.includes(question.unknownSlot),
        false,
        `${concept.id} should lock the unknown bar slot`,
      );
    }

    if (question.moduleStage === "bar_to_equation" || question.moduleStage === "schema_equation") {
      assert.deepEqual(
        getEditableEquationKeys(question),
        getGivenSlotKeys(question.validation?.slots),
        `${concept.id} should only make given equation slots editable`,
      );
    }
  }
}

function assertModuleBundleOrder(concept) {
  assert.equal(concept.questions.length, 30, `${concept.id} should have 30 records`);

  for (let index = 0; index < concept.questions.length; index += 3) {
    const stages = concept.questions
      .slice(index, index + 3)
      .map((question) => question.moduleStage);

    assert.deepEqual(
      stages,
      ["schema_bar_model", "schema_equation", "schema_solve"],
      `${concept.id} bundle ${index / 3 + 1} should be bar -> equation -> solve`,
    );
  }
}

function assertVariableIdentificationConcept(concept) {
  assert.equal(concept.questions.length, 15, `${concept.id} should have 15 questions`);
  for (const question of concept.questions) {
    assert.equal(question.moduleStage, "schema_variables");
    assert.equal(question.interactionMode, "variable_identification");
    assert.ok(question.visualData?.sentences?.length, `${concept.id} should include numbered sentences`);
    assert.ok(question.visualData?.variables?.length, `${concept.id} should include variable rows`);
    assert.equal(
      question.visualData.variables.length,
      Object.keys(question.validation?.variables || {}).length,
      `${concept.id} should validate each variable row`,
    );
  }
}

function assertDirectSchemaConcept(concept) {
  assert.equal(concept.questions.length, 15, `${concept.id} should have 15 questions`);
  for (const question of concept.questions) {
    assert.equal(question.moduleStage, "schema_direct_solve");
    assert.equal(question.interactionMode, "direct_answer");
    assert.ok(question.validation?.acceptableAnswers?.length);
  }
}

async function verify() {
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  console.log("DB Connected");

  await seedData();
  console.log("Seeded");

  const concepts = await Concept.find({});
  const conceptMap = new Map(concepts.map((concept) => [concept.id, concept]));

  for (const conceptId of orderedConcepts) {
    assert.ok(conceptMap.has(conceptId), `${conceptId} should be seeded`);
    assert.deepEqual(
      conceptMap.get(conceptId).prerequisites,
      expectedPrerequisites[conceptId],
      `${conceptId} prerequisites should match the workflow`,
    );
  }

  assertVariableIdentificationConcept(conceptMap.get("combine_mod1"));
  assertDirectSchemaConcept(conceptMap.get("combine_mod5"));
  assertVariableIdentificationConcept(conceptMap.get("change_mod1"));
  assertDirectSchemaConcept(conceptMap.get("change_mod5"));
  assert.equal(conceptMap.get("combine_mod2").questions.length, 15);
  assert.equal(conceptMap.get("combine_mod3").questions.length, 10);
  assert.equal(conceptMap.get("change_mod2").questions.length, 10);
  assert.equal(conceptMap.get("change_mod3").questions.length, 10);
  assertModuleBundleOrder(conceptMap.get("combine_mod4"));
  assertModuleBundleOrder(conceptMap.get("change_mod4"));

  for (const conceptId of [
    "combine_mod2",
    "combine_mod3",
    "combine_mod4",
    "change_mod2",
    "change_mod3",
    "change_mod4",
  ]) {
    assertSchemaQuestionShape(conceptMap.get(conceptId));
  }

  let user = await User.create({
    username: "adaptive_student",
    password: "password123",
    role: "student",
    mastery: {},
    zpdNodes: ["single_add"],
  });

  const firstProblem = await getNextProblem(user);
  await user.save();
  assert.equal(firstProblem.concept.id, "single_add");

  await updateMastery(user, "single_add", true);
  await user.save();
  user = await User.findById(user._id);

  const secondProblem = await getNextProblem(user);
  await user.save();
  assert.notEqual(String(secondProblem.question._id), String(firstProblem.question._id));
  console.log("Question sequencing verified for single_add.");

  for (let index = 0; index < orderedConcepts.length - 1; index += 1) {
    const currentConceptId = orderedConcepts[index];
    const nextConceptId = orderedConcepts[index + 1];
    const existingAttempts = currentConceptId === "single_add" ? 1 : 0;
    const requiredAttempts = 15 - existingAttempts;

    for (let i = 0; i < requiredAttempts; i += 1) {
      await updateMastery(user, currentConceptId, true);
    }

    await user.save();
    user = await User.findById(user._id);

    assert.equal(user.mastery.get(currentConceptId)?.status, "mastered");
    assert.equal(user.mastery.get(nextConceptId)?.status, "unlocked");
  }

  const finalProblem = await getNextProblem(user);
  await user.save();
  assert.equal(finalProblem.concept.id, "compare_mod5");

  console.log("SUCCESS: curriculum workflow, schema locking, and KL-UCB progression verified.");
  await mongoose.disconnect();
  await mongoServer.stop();
  process.exit(0);
}

verify().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
