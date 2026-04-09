const assert = require("node:assert/strict");
const {
  buildEquationString,
  createBarModelSpec,
  createEquationTemplate,
  validateQuestionResponse,
} = require("./utils/schemaQuestionUtils");

function verifySchemaQuestions() {
  const equationSpec = {
    values: { leftTerm: "?", rightTerm: 4, result: 10 },
    template: createEquationTemplate({
      operator: "+",
      left: { key: "leftTerm", label: "start", value: "?" },
      right: { key: "rightTerm", label: "added", value: 4 },
      result: { key: "result", label: "total", value: 10 },
      editableKeys: ["leftTerm", "rightTerm", "result"],
      operatorEditable: true,
    }),
  };

  const equationQuestion = {
    interactionMode: "equation_builder",
    equationSpec,
    validation: {
      slots: { leftTerm: "?", rightTerm: "4", result: "10" },
      alternateSlots: { leftTerm: "6", rightTerm: "4", result: "10" },
      operator: "+",
      equations: [
        buildEquationString(equationSpec, {
          slots: { leftTerm: "?", rightTerm: "4", result: "10" },
          operator: "+",
        }),
        buildEquationString(equationSpec, {
          slots: { leftTerm: "6", rightTerm: "4", result: "10" },
          operator: "+",
        }),
      ],
    },
  };

  assert.equal(
    validateQuestionResponse(equationQuestion, {
      slots: { leftTerm: "?", rightTerm: "4", result: "10" },
      operator: "+",
    }),
    true,
  );
  assert.equal(
    validateQuestionResponse(equationQuestion, {
      slots: { leftTerm: "6", rightTerm: "4", result: "10" },
      operator: "+",
    }),
    true,
  );
  assert.equal(
    validateQuestionResponse(equationQuestion, {
      slots: { leftTerm: "?", rightTerm: "4", result: "10" },
      operator: "-",
    }),
    false,
  );

  const compareBigger = createBarModelSpec({
    schemaKind: "compare",
    unknownSlot: "bigger",
    values: { bigger: 24, smaller: 15, difference: 9 },
    labels: {
      bigger: "Red scarf",
      smaller: "Blue scarf",
      difference: "Longer by",
    },
  });
  const compareSmaller = createBarModelSpec({
    schemaKind: "compare",
    unknownSlot: "smaller",
    values: { bigger: 31, smaller: 25, difference: 6 },
    labels: {
      bigger: "Mina",
      smaller: "Eli",
      difference: "More than",
    },
  });
  const compareDifference = createBarModelSpec({
    schemaKind: "compare",
    unknownSlot: "difference",
    values: { bigger: 18, smaller: 11, difference: 7 },
    labels: {
      bigger: "Olivia",
      smaller: "Amir",
      difference: "More pencils",
    },
  });
  const compareComplete = createBarModelSpec({
    schemaKind: "compare",
    unknownSlot: null,
    values: { bigger: 12, smaller: 8, difference: 4 },
    labels: {
      bigger: "bigger",
      smaller: "smaller",
      difference: "difference",
    },
  });

  assert.equal(compareBigger.variant, "compare_bigger");
  assert.equal(compareSmaller.variant, "compare_smaller");
  assert.equal(compareDifference.variant, "compare_difference");
  assert.equal(compareComplete.variant, "compare_complete");
  assert.equal(compareComplete.bracket, null);
  assert.equal(compareDifference.layout, "compare_offset");

  const legacyDirectQuestion = {
    correctAnswer: "12",
    validation: { acceptableAnswers: ["12"] },
  };

  assert.equal(
    validateQuestionResponse(legacyDirectQuestion, { textAnswer: "12" }),
    true,
  );
  assert.equal(
    validateQuestionResponse(legacyDirectQuestion, { textAnswer: "13" }),
    false,
  );

  const barModelQuestion = {
    interactionMode: "bar_model_builder",
    validation: {
      slots: { bigger: "362", smaller: "?", difference: "234" },
      alternateSlots: { bigger: "362", smaller: "128", difference: "234" },
    },
  };

  assert.equal(
    validateQuestionResponse(barModelQuestion, {
      slots: { bigger: "362", smaller: "?", difference: "234" },
    }),
    true,
  );
  assert.equal(
    validateQuestionResponse(barModelQuestion, {
      slots: { bigger: "362", smaller: "128", difference: "234" },
    }),
    true,
  );

  console.log(
    "SUCCESS: schema validation, compare bar-model variants, and legacy compatibility verified.",
  );
}

verifySchemaQuestions();
