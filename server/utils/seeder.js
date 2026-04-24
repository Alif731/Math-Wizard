const Concept = require("../models/Concept");
const User = require("../models/User");
const Attempt = require("../models/Attempt");
const TeacherSignupCode = require("../models/TeacherSignupCode");
const {
  buildEquationString,
  createBarModelSpec,
  createEquationTemplate,
  createQuestionEnvelope,
} = require("./schemaQuestionUtils");

const DEFAULT_TEACHER_SIGNUP_CODE = "TEACHER2026";

const ensureTeacherSignupCode = async () => {
  const existingCode = await TeacherSignupCode.findOne({
    code: DEFAULT_TEACHER_SIGNUP_CODE,
  });

  if (!existingCode) {
    await TeacherSignupCode.create({
      code: DEFAULT_TEACHER_SIGNUP_CODE,
      label: "Default teacher signup code",
    });
    console.log("Teacher Sign-Up Code Seeded");
  }
};

// ------------------------------------------  Prerequisite Question ----------------------------------
// a, Standard Arithmetic ( Direct Arithmetic calculation)
// b, Algebraic Thinking ( Fill the missing par)

const createPracticeQuestion = ({
  concept,
  promptTitle,
  practiceMode,
  left,
  operator,
  right,
  answer,
  difficulty,
}) => {
  const equationSpec = {
    operator,
    template: createEquationTemplate({
      operator,
      left: { key: "left", label: "1st number", value: left },
      right: { key: "right", label: "2nd number", value: right },
      result: { key: "answer", label: "answer", value: answer },
      editableKeys: ["answer"],
    }),
  };

  return createQuestionEnvelope({
    text: `${left} ${operator} ${right} = ?`,
    concept,
    type: "direct",
    difficulty,
    correctAnswer: answer,
    schemaKind: "practice",
    interactionMode: "direct_answer",
    moduleStage: "practice",
    practiceMode,
    promptTitle,
    inputMode: "keypad_single_blank",
    helperText: "Tap the ? box, then type the answer.",
    equationSpec,
    operands: [left, right],
    validation: {
      acceptableAnswers: [String(answer)],
      slots: { answer: String(answer) },
    },
  });
};

const createMissingPartQuestion = ({
  concept,
  operator,
  values,
  unknownKey,
  difficulty,
}) => {
  const equationSpec = {
    operator,
    template: createEquationTemplate({
      operator,
      left:
        operator === "+"
          ? { key: "partA", label: "1st number", value: values.partA }
          : { key: "start", label: "1st number", value: values.start },
      right:
        operator === "+"
          ? { key: "partB", label: "2nd number", value: values.partB }
          : { key: "change", label: "2nd number", value: values.change },
      result:
        operator === "+"
          ? { key: "total", label: "answer", value: values.total }
          : { key: "end", label: "answer", value: values.end },
      editableKeys: [unknownKey],
    }),
  };

  const solvedValues =
    operator === "+"
      ? { partA: values.partA, partB: values.partB, total: values.total }
      : { start: values.start, change: values.change, end: values.end };

  return createQuestionEnvelope({
    text: buildEquationString(equationSpec, { slots: solvedValues }),
    concept,
    type: "equation_builder",
    difficulty,
    correctAnswer: solvedValues[unknownKey],
    // schemaKind: "missing_part",
    schemaKind: "practice",
    interactionMode: "equation_builder",
    moduleStage: "equations",
    promptTitle: "find the missing number",
    inputMode: "keypad_equation",
    helperText: "Tap the blue box and type your answer.",
    unknownSlot: unknownKey,
    equationSpec,
    validation: {
      slots: { [unknownKey]: String(solvedValues[unknownKey]) },
      equation: buildEquationString(equationSpec, { slots: solvedValues }),
    },
  });
};

// --------------------- Module 1 --------------------------------

const createEquationFromBarQuestion = ({
  concept,
  text,
  schemaKind,
  barValues,
  scaleValues = barValues,
  labels,
  roleLabels = labels,
  valueLabels = {},
  equationDisplayValues,
  validationSlots,
  alternateSlots = validationSlots,
  operator,
  difficulty,
  participants = null,
  comparisonWording = null,
  equationForm = null,
  compareVariant = null,
  alignmentMode = null,
  barDecorations = {},
}) => {
  const keys =
    schemaKind === "compare"
      ? {
          left: {
            key: "leftTerm",
            label: labels.left,
            role: "smaller",
            value: equationDisplayValues.leftTerm,
          },
          right: {
            key: "rightTerm",
            label: labels.right,
            role: "difference",
            value: equationDisplayValues.rightTerm,
          },
          result: {
            key: "result",
            label: labels.result,
            role: "bigger",
            value: equationDisplayValues.result,
          },
        }
      : {
          left: {
            key: "leftTerm",
            label: labels.left,
            role: schemaKind === "change" ? "start" : "partA",
            value: equationDisplayValues.leftTerm,
          },
          right: {
            key: "rightTerm",
            label: labels.right,
            role: schemaKind === "change" ? "change" : "partB",
            value: equationDisplayValues.rightTerm,
          },
          result: {
            key: "result",
            label: labels.result,
            role: schemaKind === "change" ? "end" : "total",
            value: equationDisplayValues.result,
          },
        };

  const equationSpec = {
    operator,
    operatorEditable: true,
    template: createEquationTemplate({
      operator,
      left: keys.left,
      right: keys.right,
      result: keys.result,
      editableKeys: ["leftTerm", "rightTerm", "result"],
      operatorEditable: true,
    }),
  };

  return createQuestionEnvelope({
    text,
    concept,
    type: "equation_builder",
    difficulty,
    correctAnswer: buildEquationString(equationSpec, {
      slots: validationSlots,
      operator,
    }),
    schemaKind,
    interactionMode: "equation_builder",
    moduleStage: "bar_to_equation",
    promptTitle: "build the equation",
    inputMode: "keypad_equation",
    helperText: "Tap any box to fill in the equation.",
    barModelSpec: createBarModelSpec({
      schemaKind,
      unknownSlot:
        Object.entries(barValues).find(([, value]) => value === "?")?.[0] ||
        null,
      values: barValues,
      scaleValues,
      labels,
      roleLabels,
      valueLabels,
      participants,
      comparisonWording,
      equationForm,
      compareVariant,
      alignmentMode,
      barDecorations,
    }),
    equationSpec,
    validation: {
      slots: Object.fromEntries(
        Object.entries(validationSlots).map(([key, value]) => [
          key,
          String(value),
        ]),
      ),
      alternateSlots: Object.fromEntries(
        Object.entries(alternateSlots).map(([key, value]) => [
          key,
          String(value),
        ]),
      ),
      operator,
      equations: [
        buildEquationString(equationSpec, {
          slots: validationSlots,
          operator,
        }),
        buildEquationString(equationSpec, {
          slots: alternateSlots,
          operator,
        }),
      ],
    },
  });
};

// --------------------- Module 2 --------------------------------

// const createSchemaRecognitionQuestion = ({
//   concept,
//   text,
//   schemaKind,
//   values,
//   labels,
//   roleLabels = labels,
//   valueLabels = {},
//   displayValues,
//   validationSlots,
//   alternateSlots = values,
//   unknownSlot,
//   difficulty,
// }) =>
//   createQuestionEnvelope({
//     text,
//     concept,
//     type: "bar_model_builder",
//     difficulty,
//     correctAnswer: "bar-model-complete",
//     schemaKind,
//     interactionMode: "bar_model_builder",
//     moduleStage: "word_to_bar", // <--- THIS is what hides the 3 tabs!
//     promptTitle: "build the bar model",
//     inputMode: "keypad_bar_model",
//     helperText: "Tap a box to fill in the bar model. Use ? for the unknown.",
//     unknownSlot,
//     barModelSpec: createBarModelSpec({
//       schemaKind,
//       unknownSlot,
//       values: displayValues,
//       scaleValues: values,
//       labels,
//       roleLabels,
//       valueLabels,
//       editableKeys: Object.keys(validationSlots),
//     }),
//     validation: {
//       slots: Object.fromEntries(
//         Object.entries(validationSlots).map(([key, value]) => [
//           key,
//           String(value),
//         ]),
//       ),
//       alternateSlots: Object.fromEntries(
//         Object.entries(alternateSlots).map(([key, value]) => [
//           key,
//           String(value),
//         ]),
//       ),
//     },
//   });
const createSchemaRecognitionQuestion = ({
  concept,
  text,
  schemaKind,
  values,
  labels,
  roleLabels = labels,
  displayValues,
  validationSlots,
  alternateSlots = values,
  unknownSlot,
  difficulty,
}) =>
  createQuestionEnvelope({
    text,
    concept,
    type: "bar_model_builder",
    difficulty,
    correctAnswer: "bar-model-complete",
    schemaKind,
    interactionMode: "bar_model_builder",
    moduleStage: "word_to_bar", // Critical: This hides the stage tabs
    promptTitle: "build the bar model",
    inputMode: "keypad_bar_model",
    helperText: "Tap a box to fill in the bar model. Use ? for the unknown.",
    unknownSlot,
    barModelSpec: createBarModelSpec({
      schemaKind,
      unknownSlot,
      values: displayValues,
      scaleValues: values,
      labels,
      roleLabels,
      editableKeys: Object.keys(validationSlots),
    }),
    validation: {
      slots: Object.fromEntries(
        Object.entries(validationSlots).map(([k, v]) => [k, String(v)]),
      ),
      alternateSlots: Object.fromEntries(
        Object.entries(alternateSlots).map(([k, v]) => [k, String(v)]),
      ),
    },
  });
// --------------------- Module 3 --------------------------------
const createSchemaBarQuestion = ({
  concept,
  text,
  schemaKind,
  values,
  labels,
  roleLabels = labels,
  valueLabels = {},
  displayValues,
  validationSlots,
  alternateSlots = values,
  unknownSlot,
  difficulty,
  participants = null,
  comparisonWording = null,
  equationForm = null,
  compareVariant = null,
  alignmentMode = null,
  barDecorations = {},
}) =>
  createQuestionEnvelope({
    text,
    concept,
    type: "bar_model_builder",
    difficulty,
    correctAnswer: "bar-model-complete",
    schemaKind,
    interactionMode: "bar_model_builder",
    moduleStage: "schema_bar_model",
    promptTitle: "bar model",
    inputMode: "keypad_bar_model",
    stageIndex: 1,
    stageLabel: "1. Bar model",
    stageTotal: 3,
    helperText: "Tap a box to fill in the bar model. Use ? for the unknown.",
    unknownSlot,
    barModelSpec: createBarModelSpec({
      schemaKind,
      unknownSlot,
      values: displayValues,
      scaleValues: values,
      labels,
      roleLabels,
      valueLabels,
      editableKeys: Object.keys(validationSlots),
      participants,
      comparisonWording,
      equationForm,
      compareVariant,
      alignmentMode,
      barDecorations,
    }),
    validation: {
      slots: Object.fromEntries(
        Object.entries(validationSlots).map(([key, value]) => [
          key,
          String(value),
        ]),
      ),
      alternateSlots: Object.fromEntries(
        Object.entries(alternateSlots).map(([key, value]) => [
          key,
          String(value),
        ]),
      ),
    },
  });

const createSchemaEquationQuestion = ({
  concept,
  text,
  schemaKind,
  values,
  displayBarValues = values,
  scaleValues = values,
  labels,
  roleLabels = labels,
  valueLabels = {},
  unknownSlot,
  equationValues,
  validationSlots,
  alternateSlots = validationSlots,
  operator,
  difficulty,
  participants = null,
  comparisonWording = null,
  equationForm = null,
  compareVariant = null,
  alignmentMode = null,
  barDecorations = {},
  hideTopBar = false,
}) => {
  const equationSpec = {
    operator,
    operatorEditable: true,
    template: createEquationTemplate({
      operator,
      left: {
        key: "leftTerm",
        label: labels.left,
        role:
          schemaKind === "compare"
            ? "smaller"
            : schemaKind === "change"
              ? "start"
              : "partA",
        value: equationValues.leftTerm,
      },
      right: {
        key: "rightTerm",
        label: labels.right,
        role:
          schemaKind === "compare"
            ? "difference"
            : schemaKind === "change"
              ? "change"
              : "partB",
        value: equationValues.rightTerm,
      },
      result: {
        key: "result",
        label: labels.result,
        role:
          schemaKind === "compare"
            ? "bigger"
            : schemaKind === "change"
              ? "end"
              : "total",
        value: equationValues.result,
      },
      editableKeys: ["leftTerm", "rightTerm", "result"],
      operatorEditable: true,
    }),
  };

  return createQuestionEnvelope({
    text,
    concept,
    type: "equation_builder",
    difficulty,
    correctAnswer: buildEquationString(equationSpec, {
      slots: validationSlots,
      operator,
    }),
    schemaKind,
    interactionMode: "equation_builder",
    moduleStage: "schema_equation",
    promptTitle: "equation",
    inputMode: "keypad_equation",
    stageIndex: 2,
    stageLabel: "2. Equation",
    stageTotal: 3,
    helperText: "Tap any box to fill it in. Use ? for the unknown.",
    unknownSlot,
    barModelSpec: {
      ...createBarModelSpec({
        schemaKind,
        unknownSlot,
        values: displayBarValues,
        scaleValues,
        labels,
        roleLabels,
        valueLabels,
        participants,
        comparisonWording,
        equationForm,
        compareVariant,
        alignmentMode,
        barDecorations,
      }),
      hideTopBar,
    },
    equationSpec,
    validation: {
      slots: Object.fromEntries(
        Object.entries(validationSlots).map(([key, value]) => [
          key,
          String(value),
        ]),
      ),
      alternateSlots: Object.fromEntries(
        Object.entries(alternateSlots).map(([key, value]) => [
          key,
          String(value),
        ]),
      ),
      operator,
      equations: [
        buildEquationString(equationSpec, {
          slots: validationSlots,
          operator,
        }),
        buildEquationString(equationSpec, {
          slots: alternateSlots,
          operator,
        }),
      ],
    },
  });
};

const createSchemaSolveQuestion = ({
  concept,
  text,
  schemaKind,
  answer,
  displayEquation,
  verificationEquation,
  solutionLabel,
  difficulty,
}) =>
  createQuestionEnvelope({
    text,
    concept,
    type: "direct",
    difficulty,
    correctAnswer: answer,
    schemaKind,
    interactionMode: "direct_answer",
    moduleStage: "schema_solve",
    promptTitle: "solve",
    inputMode: "text_answer",
    stageIndex: 3,
    stageLabel: "3. Solve",
    stageTotal: 3,
    helperText: "Work out the value of ? and enter it above.",
    equationSpec: {
      displayEquation,
    },
    validation: {
      acceptableAnswers: [String(answer)],
      displayEquation,
      verificationEquation,
      solutionLabel,
    },
  });

const conceptsData = [
  // ---------------------------a, Standard Arithmetic (Prerequisite)--------------------
  {
    id: "single_add",
    title: "Single +",
    description: "Single-digit addition practice.",
    prerequisites: [],
    questions: [
      createPracticeQuestion({
        concept: "single_add",
        promptTitle: "single-digit addition",
        practiceMode: "single_add",
        left: 3,
        operator: "+",
        right: 4,
        answer: 7,
        difficulty: 1,
      }),
      createPracticeQuestion({
        concept: "single_add",
        promptTitle: "single-digit addition",
        practiceMode: "single_add",
        left: 8,
        operator: "+",
        right: 1,
        answer: 9,
        difficulty: 1,
      }),
      createPracticeQuestion({
        concept: "single_add",
        promptTitle: "single-digit addition",
        practiceMode: "single_add",
        left: 6,
        operator: "+",
        right: 2,
        answer: 8,
        difficulty: 1,
      }),
      createPracticeQuestion({
        concept: "single_add",
        promptTitle: "single-digit addition",
        practiceMode: "single_add",
        left: 5,
        operator: "+",
        right: 4,
        answer: 9,
        difficulty: 1,
      }),
    ],
  },
  {
    id: "single_sub",
    title: "Single -",
    description: "Single-digit subtraction practice.",
    prerequisites: ["single_add"],
    questions: [
      createPracticeQuestion({
        concept: "single_sub",
        promptTitle: "single-digit subtraction",
        practiceMode: "single_sub",
        left: 9,
        operator: "-",
        right: 2,
        answer: 7,
        difficulty: 1,
      }),
      createPracticeQuestion({
        concept: "single_sub",
        promptTitle: "single-digit subtraction",
        practiceMode: "single_sub",
        left: 8,
        operator: "-",
        right: 3,
        answer: 5,
        difficulty: 1,
      }),
      createPracticeQuestion({
        concept: "single_sub",
        promptTitle: "single-digit subtraction",
        practiceMode: "single_sub",
        left: 7,
        operator: "-",
        right: 1,
        answer: 6,
        difficulty: 1,
      }),
      createPracticeQuestion({
        concept: "single_sub",
        promptTitle: "single-digit subtraction",
        practiceMode: "single_sub",
        left: 6,
        operator: "-",
        right: 4,
        answer: 2,
        difficulty: 1,
      }),
    ],
  },
  {
    id: "multi_add",
    title: "Multi +",
    description: "Multi-digit addition practice.",
    prerequisites: ["single_sub"],
    questions: [
      createPracticeQuestion({
        concept: "multi_add",
        promptTitle: "multi-digit addition",
        practiceMode: "multi_add",
        left: 14,
        operator: "+",
        right: 8,
        answer: 22,
        difficulty: 2,
      }),
      createPracticeQuestion({
        concept: "multi_add",
        promptTitle: "multi-digit addition",
        practiceMode: "multi_add",
        left: 27,
        operator: "+",
        right: 15,
        answer: 42,
        difficulty: 2,
      }),
      createPracticeQuestion({
        concept: "multi_add",
        promptTitle: "multi-digit addition",
        practiceMode: "multi_add",
        left: 36,
        operator: "+",
        right: 12,
        answer: 48,
        difficulty: 3,
      }),
      createPracticeQuestion({
        concept: "multi_add",
        promptTitle: "multi-digit addition",
        practiceMode: "multi_add",
        left: 46,
        operator: "+",
        right: 23,
        answer: 69,
        difficulty: 3,
      }),
    ],
  },
  {
    id: "multi_sub",
    title: "Multi -",
    description: "Multi-digit subtraction practice.",
    prerequisites: ["multi_add"],
    questions: [
      createPracticeQuestion({
        concept: "multi_sub",
        promptTitle: "multi-digit subtraction",
        practiceMode: "multi_sub",
        left: 21,
        operator: "-",
        right: 7,
        answer: 14,
        difficulty: 2,
      }),
      createPracticeQuestion({
        concept: "multi_sub",
        promptTitle: "multi-digit subtraction",
        practiceMode: "multi_sub",
        left: 32,
        operator: "-",
        right: 14,
        answer: 18,
        difficulty: 2,
      }),
      createPracticeQuestion({
        concept: "multi_sub",
        promptTitle: "multi-digit subtraction",
        practiceMode: "multi_sub",
        left: 54,
        operator: "-",
        right: 21,
        answer: 33,
        difficulty: 3,
      }),
      createPracticeQuestion({
        concept: "multi_sub",
        promptTitle: "multi-digit subtraction",
        practiceMode: "multi_sub",
        left: 58,
        operator: "-",
        right: 27,
        answer: 31,
        difficulty: 3,
      }),
    ],
  },
  // --------------------------- b, Algebraic Thinking  (Prerequisite)--------------------
  {
    id: "missing_part_equations",
    title: "Missing Number",
    description: "Find the missing number in any position.",
    prerequisites: ["multi_sub"],
    questions: [
      createMissingPartQuestion({
        concept: "missing_part_equations",
        operator: "+",
        values: { partA: 8, partB: 4, total: 12 },
        unknownKey: "partB",
        difficulty: 1,
      }),
      createMissingPartQuestion({
        concept: "missing_part_equations",
        operator: "+",
        values: { partA: 6, partB: 4, total: 10 },
        unknownKey: "partA",
        difficulty: 1,
      }),
      createMissingPartQuestion({
        concept: "missing_part_equations",
        operator: "+",
        values: { partA: 9, partB: 6, total: 15 },
        unknownKey: "total",
        difficulty: 1,
      }),
      createMissingPartQuestion({
        concept: "missing_part_equations",
        operator: "-",
        values: { start: 14, change: 5, end: 9 },
        unknownKey: "start",
        difficulty: 2,
      }),
      createMissingPartQuestion({
        concept: "missing_part_equations",
        operator: "-",
        values: { start: 17, change: 9, end: 8 },
        unknownKey: "change",
        difficulty: 2,
      }),
      createMissingPartQuestion({
        concept: "missing_part_equations",
        operator: "-",
        values: { start: 20, change: 6, end: 14 },
        unknownKey: "end",
        difficulty: 2,
      }),
    ],
  },
  // ============================================================================
  // TRACK 1: THE COMBINE SCHEMA
  // ============================================================================
  {
    id: "combine_mod1",
    title: "Combine: Word to Bar",
    description: "Read the combine story and build the bar model.",
    prerequisites: ["missing_part_equations"],
    questions: [
      createSchemaRecognitionQuestion({
        concept: "combine_mod1",
        text: "Mia has 6 red and 4 blue marbles. How many altogether?",
        schemaKind: "combine",
        values: { partA: 6, partB: 4, total: 10 },
        labels: { total: "total", partA: "red", partB: "blue" },
        displayValues: { partA: "?", partB: "?", total: "?" },
        validationSlots: { total: "?", partA: "6", partB: "4" },
        alternateSlots: { total: "10", partA: "6", partB: "4" },
        unknownSlot: "total",
        difficulty: 2,
      }),
      createSchemaRecognitionQuestion({
        concept: "combine_mod1",
        text: "A fruit basket has 12 apples and 8 bananas. How many pieces of fruit are there?",
        schemaKind: "combine",
        values: { partA: 12, partB: 8, total: 20 },
        labels: { total: "total", partA: "apples", partB: "bananas" },
        displayValues: { partA: "?", partB: "?", total: "?" },
        validationSlots: { total: "?", partA: "12", partB: "8" },
        alternateSlots: { total: "20", partA: "12", partB: "8" },
        unknownSlot: "total",
        difficulty: 2,
      }),
      createSchemaRecognitionQuestion({
        concept: "combine_mod1",
        text: "In a class, there are 15 boys and 14 girls. How many students are in the class?",
        schemaKind: "combine",
        values: { partA: 15, partB: 14, total: 29 },
        labels: { total: "total", partA: "boys", partB: "girls" },
        displayValues: { partA: "?", partB: "?", total: "?" },
        validationSlots: { total: "?", partA: "15", partB: "14" },
        alternateSlots: { total: "29", partA: "15", partB: "14" },
        unknownSlot: "total",
        difficulty: 2,
      }),
      createSchemaRecognitionQuestion({
        concept: "combine_mod1",
        text: "Leo spent $25 on books and $15 on toys. How much money did Leo spend in total?",
        schemaKind: "combine",
        values: { partA: 25, partB: 15, total: 40 },
        labels: { total: "total", partA: "books", partB: "toys" },
        displayValues: { partA: "?", partB: "?", total: "?" },
        validationSlots: { total: "?", partA: "25", partB: "15" },
        alternateSlots: { total: "40", partA: "25", partB: "15" },
        unknownSlot: "total",
        difficulty: 3,
      }),
      createSchemaRecognitionQuestion({
        concept: "combine_mod1",
        text: "A parking lot has 7 cars and 5 trucks. How many vehicles are there?",
        schemaKind: "combine",
        values: { partA: 7, partB: 5, total: 12 },
        labels: { total: "total", partA: "cars", partB: "trucks" },
        displayValues: { partA: "?", partB: "?", total: "?" },
        validationSlots: { total: "?", partA: "7", partB: "5" },
        alternateSlots: { total: "12", partA: "7", partB: "5" },
        unknownSlot: "total",
        difficulty: 1,
      }),
    ],
  },
  {
    id: "combine_mod2",
    title: "Combine: Bar to Eq",
    description: "Translate Combine bar models into equations.",
    prerequisites: ["combine_mod1"],
    questions: [
      // Q1
      createEquationFromBarQuestion({
        concept: "combine_mod2",
        text: "Build the equation for the red and blue parts.",
        schemaKind: "combine",
        barValues: { partA: "6", partB: "4", total: "10" },
        scaleValues: { partA: 6, partB: 4, total: 10 },
        labels: {
          total: "total",
          partA: "red",
          partB: "blue",
          left: "red",
          right: "blue",
          result: "total",
        },
        equationDisplayValues: { leftTerm: "6", rightTerm: "4", result: "10" },
        validationSlots: { leftTerm: "6", rightTerm: "4", result: "10" },
        alternateSlots: { leftTerm: "6", rightTerm: "4", result: "10" },
        operator: "+",
        difficulty: 2,
      }),
      // Q2
      createEquationFromBarQuestion({
        concept: "combine_mod2",
        text: "Build the equation for the apples and bananas.",
        schemaKind: "combine",
        barValues: { partA: "12", partB: "8", total: "20" },
        scaleValues: { partA: 12, partB: 8, total: 20 },
        labels: {
          total: "total",
          partA: "apples",
          partB: "bananas",
          left: "apples",
          right: "bananas",
          result: "total",
        },
        equationDisplayValues: { leftTerm: "12", rightTerm: "8", result: "20" },
        validationSlots: { leftTerm: "12", rightTerm: "8", result: "20" },
        alternateSlots: { leftTerm: "12", rightTerm: "8", result: "20" },
        operator: "+",
        difficulty: 2,
      }),
      // Q3
      createEquationFromBarQuestion({
        concept: "combine_mod2",
        text: "Build the equation for the boys and girls.",
        schemaKind: "combine",
        barValues: { partA: "15", partB: "14", total: "29" },
        scaleValues: { partA: 15, partB: 14, total: 29 },
        labels: {
          total: "total",
          partA: "boys",
          partB: "girls",
          left: "boys",
          right: "girls",
          result: "total",
        },
        equationDisplayValues: {
          leftTerm: "15",
          rightTerm: "14",
          result: "29",
        },
        validationSlots: { leftTerm: "15", rightTerm: "14", result: "29" },
        alternateSlots: { leftTerm: "15", rightTerm: "14", result: "29" },
        operator: "+",
        difficulty: 2,
      }),
      // Q4
      createEquationFromBarQuestion({
        concept: "combine_mod2",
        text: "Build the equation for the books and toys.",
        schemaKind: "combine",
        barValues: { partA: "25", partB: "15", total: "40" },
        scaleValues: { partA: 25, partB: 15, total: 40 },
        labels: {
          total: "total",
          partA: "books",
          partB: "toys",
          left: "books",
          right: "toys",
          result: "total",
        },
        equationDisplayValues: {
          leftTerm: "25",
          rightTerm: "15",
          result: "40",
        },
        validationSlots: { leftTerm: "25", rightTerm: "15", result: "40" },
        alternateSlots: { leftTerm: "25", rightTerm: "15", result: "40" },
        operator: "+",
        difficulty: 3,
      }),
      // Q5
      createEquationFromBarQuestion({
        concept: "combine_mod2",
        text: "Build the equation for the cars and trucks.",
        schemaKind: "combine",
        barValues: { partA: "7", partB: "5", total: "12" },
        scaleValues: { partA: 7, partB: 5, total: 12 },
        labels: {
          total: "total",
          partA: "cars",
          partB: "trucks",
          left: "cars",
          right: "trucks",
          result: "total",
        },
        equationDisplayValues: { leftTerm: "7", rightTerm: "5", result: "12" },
        validationSlots: { leftTerm: "7", rightTerm: "5", result: "12" },
        alternateSlots: { leftTerm: "7", rightTerm: "5", result: "12" },
        operator: "+",
        difficulty: 1,
      }),
    ],
  },
  {
    id: "combine_mod3",
    title: "Combine: Solve",
    description: "Build the bar model, write the equation, and solve.",
    prerequisites: ["combine_mod2"],
    questions: [
      // Problem 1 (Beads)
      createSchemaBarQuestion({
        concept: "combine_mod3",
        text: "Nia has 8 green and 5 yellow beads. How many beads altogether?",
        schemaKind: "combine",
        values: { partA: 8, partB: 5, total: 13 },
        labels: { total: "total", partA: "green", partB: "yellow" },
        displayValues: { partA: "?", partB: "?", total: "?" },
        validationSlots: { total: "?", partA: "8", partB: "5" },
        alternateSlots: { total: "13", partA: "8", partB: "5" },
        unknownSlot: "total",
        difficulty: 2,
      }),
      createSchemaEquationQuestion({
        concept: "combine_mod3",
        text: "Nia has 8 green and 5 yellow beads. How many beads altogether?",
        schemaKind: "combine",
        hideTopBar: true,
        values: { partA: "8", partB: "5", total: "?" },
        scaleValues: { partA: 8, partB: 5, total: 13 },
        labels: {
          total: "total",
          partA: "green",
          partB: "yellow",
          left: "green",
          right: "yellow",
          result: "total",
        },
        unknownSlot: "total",
        equationValues: { leftTerm: "8", rightTerm: "5", result: "?" },
        validationSlots: { leftTerm: "8", rightTerm: "5", result: "?" },
        alternateSlots: { leftTerm: "8", rightTerm: "5", result: "13" },
        operator: "+",
        difficulty: 2,
      }),
      createSchemaSolveQuestion({
        concept: "combine_mod3",
        text: "Nia has 8 green and 5 yellow beads. How many beads altogether?",
        schemaKind: "combine",
        answer: 13,
        displayEquation: "8 + 5 = ?",
        verificationEquation: "8 + 5 = 13",
        solutionLabel: "? = 13",
        difficulty: 2,
      }),

      // Problem 2 (Pencils/Erasers)
      createSchemaBarQuestion({
        concept: "combine_mod3",
        text: "Lena packed 12 pencils and 8 erasers. How many school supplies did she pack?",
        schemaKind: "combine",
        values: { partA: 12, partB: 8, total: 20 },
        labels: { total: "total", partA: "pencils", partB: "erasers" },
        displayValues: { partA: "?", partB: "?", total: "?" },
        validationSlots: { total: "?", partA: "12", partB: "8" },
        alternateSlots: { total: "20", partA: "12", partB: "8" },
        unknownSlot: "total",
        difficulty: 2,
      }),
      createSchemaEquationQuestion({
        concept: "combine_mod3",
        text: "Lena packed 12 pencils and 8 erasers. How many school supplies did she pack?",
        schemaKind: "combine",
        values: { partA: "12", partB: "8", total: "?" },
        hideTopBar: true,
        scaleValues: { partA: 12, partB: 8, total: 20 },
        labels: {
          total: "total",
          partA: "pencils",
          partB: "erasers",
          left: "pencils",
          right: "erasers",
          result: "total",
        },
        unknownSlot: "total",
        equationValues: { leftTerm: "12", rightTerm: "8", result: "?" },
        validationSlots: { leftTerm: "12", rightTerm: "8", result: "?" },
        alternateSlots: { leftTerm: "12", rightTerm: "8", result: "20" },
        operator: "+",
        difficulty: 2,
      }),
      createSchemaSolveQuestion({
        concept: "combine_mod3",
        text: "Lena packed 12 pencils and 8 erasers. How many school supplies did she pack?",
        schemaKind: "combine",
        answer: 20,
        displayEquation: "12 + 8 = ?",
        verificationEquation: "12 + 8 = 20",
        solutionLabel: "? = 20",
        difficulty: 2,
      }),

      // Problem 3 (Singers/Dancers)
      createSchemaBarQuestion({
        concept: "combine_mod3",
        text: "A music club has 15 singers and 14 dancers. How many members are in the club?",
        schemaKind: "combine",
        values: { partA: 15, partB: 14, total: 29 },
        labels: { total: "total", partA: "singers", partB: "dancers" },
        displayValues: { partA: "?", partB: "?", total: "?" },
        validationSlots: { total: "?", partA: "15", partB: "14" },
        alternateSlots: { total: "29", partA: "15", partB: "14" },
        unknownSlot: "total",
        difficulty: 2,
      }),
      createSchemaEquationQuestion({
        concept: "combine_mod3",
        text: "A music club has 15 singers and 14 dancers. How many members are in the club?",
        schemaKind: "combine",
        values: { partA: "15", partB: "14", total: "?" },
        hideTopBar: true,
        scaleValues: { partA: 15, partB: 14, total: 29 },
        labels: {
          total: "total",
          partA: "singers",
          partB: "dancers",
          left: "singers",
          right: "dancers",
          result: "total",
        },
        unknownSlot: "total",
        equationValues: { leftTerm: "15", rightTerm: "14", result: "?" },
        validationSlots: { leftTerm: "15", rightTerm: "14", result: "?" },
        alternateSlots: { leftTerm: "15", rightTerm: "14", result: "29" },
        operator: "+",
        difficulty: 2,
      }),
      createSchemaSolveQuestion({
        concept: "combine_mod3",
        text: "A music club has 15 singers and 14 dancers. How many members are in the club?",
        schemaKind: "combine",
        answer: 29,
        displayEquation: "15 + 14 = ?",
        verificationEquation: "15 + 14 = 29",
        solutionLabel: "? = 29",
        difficulty: 2,
      }),

      // Problem 4 (January/February Savings)
      createSchemaBarQuestion({
        concept: "combine_mod3",
        text: "Avery saved $25 in January and $15 in February. How much did Avery save in total?",
        schemaKind: "combine",
        values: { partA: 25, partB: 15, total: 40 },
        labels: { total: "total", partA: "January", partB: "February" },
        displayValues: { partA: "?", partB: "?", total: "?" },
        validationSlots: { total: "?", partA: "25", partB: "15" },
        alternateSlots: { total: "40", partA: "25", partB: "15" },
        unknownSlot: "total",
        difficulty: 3,
      }),
      createSchemaEquationQuestion({
        concept: "combine_mod3",
        text: "Avery saved $25 in January and $15 in February. How much did Avery save in total?",
        schemaKind: "combine",
        values: { partA: "25", partB: "15", total: "?" },
        hideTopBar: true,
        scaleValues: { partA: 25, partB: 15, total: 40 },
        labels: {
          total: "total",
          partA: "January",
          partB: "February",
          left: "January",
          right: "February",
          result: "total",
        },
        unknownSlot: "total",
        equationValues: { leftTerm: "25", rightTerm: "15", result: "?" },
        validationSlots: { leftTerm: "25", rightTerm: "15", result: "?" },
        alternateSlots: { leftTerm: "25", rightTerm: "15", result: "40" },
        operator: "+",
        difficulty: 3,
      }),
      createSchemaSolveQuestion({
        concept: "combine_mod3",
        text: "Avery saved $25 in January and $15 in February. How much did Avery save in total?",
        schemaKind: "combine",
        answer: 40,
        displayEquation: "25 + 15 = ?",
        verificationEquation: "25 + 15 = 40",
        solutionLabel: "? = 40",
        difficulty: 3,
      }),

      // Problem 5 (Cups/Plates)
      createSchemaBarQuestion({
        concept: "combine_mod3",
        text: "A tray has 7 cups and 5 plates. How many dishes are on the tray?",
        schemaKind: "combine",
        values: { partA: 7, partB: 5, total: 12 },
        labels: { total: "total", partA: "cups", partB: "plates" },
        displayValues: { partA: "?", partB: "?", total: "?" },
        validationSlots: { total: "?", partA: "7", partB: "5" },
        alternateSlots: { total: "12", partA: "7", partB: "5" },
        unknownSlot: "total",
        difficulty: 1,
      }),
      createSchemaEquationQuestion({
        concept: "combine_mod3",
        text: "A tray has 7 cups and 5 plates. How many dishes are on the tray?",
        schemaKind: "combine",
        values: { partA: "7", partB: "5", total: "?" },
        hideTopBar: true,
        scaleValues: { partA: 7, partB: 5, total: 12 },
        labels: {
          total: "total",
          partA: "cups",
          partB: "plates",
          left: "cups",
          right: "plates",
          result: "total",
        },
        unknownSlot: "total",
        equationValues: { leftTerm: "7", rightTerm: "5", result: "?" },
        validationSlots: { leftTerm: "7", rightTerm: "5", result: "?" },
        alternateSlots: { leftTerm: "7", rightTerm: "5", result: "12" },
        operator: "+",
        difficulty: 1,
      }),
      createSchemaSolveQuestion({
        concept: "combine_mod3",
        text: "A tray has 7 cups and 5 plates. How many dishes are on the tray?",
        schemaKind: "combine",
        answer: 12,
        displayEquation: "7 + 5 = ?",
        verificationEquation: "7 + 5 = 12",
        solutionLabel: "? = 12",
        difficulty: 1,
      }),
    ],
  },

  // ============================================================================
  // TRACK 2: THE CHANGE SCHEMA
  // ============================================================================
  {
    id: "change_mod1",
    title: "Change: Word to Bar",
    description: "Read the change story and build the bar model.",
    prerequisites: ["combine_mod3"],
    questions: [
      // -------------------------------Subtraction-------------------------------
      createSchemaRecognitionQuestion({
        concept: "change_mod1",
        text: "Leo had 20 cookies. He ate 6 of them. How many cookies does Leo have left?",
        schemaKind: "change",
        values: { start: 20, change: 6, end: 14 },
        labels: { end: "left over", start: "start", change: "ate" },
        displayValues: { start: "?", change: "?", end: "?" },
        validationSlots: { end: "?", start: "20", change: "6" },
        alternateSlots: { end: "14", start: "20", change: "6" },
        unknownSlot: "end",
        difficulty: 2,
      }),
      // Subtraction 1: Finding the change
      createSchemaRecognitionQuestion({
        concept: "change_mod1",
        text: "A tree had 24 leaves. The wind blew some away, and now there are 15 leaves left. How many leaves blew away?",
        schemaKind: "change",
        values: { start: 24, change: 9, end: 15 },
        labels: { end: "left over", start: "start", change: "blew away" },
        displayValues: { start: "?", change: "?", end: "?" },
        validationSlots: { end: "15", start: "24", change: "?" },
        alternateSlots: { end: "15", start: "24", change: "9" },
        unknownSlot: "change",
        difficulty: 2,
      }),
      // Subtraction 2: Finding the start
      createSchemaRecognitionQuestion({
        concept: "change_mod1",
        text: "Sam had some money. He spent $18 on a toy and has $32 left. How much money did Sam start with?",
        schemaKind: "change",
        values: { start: 50, change: 18, end: 32 },
        labels: { end: "left over", start: "start", change: "spent" },
        displayValues: { start: "?", change: "?", end: "?" },
        validationSlots: { end: "32", start: "?", change: "18" },
        alternateSlots: { end: "32", start: "50", change: "18" },
        unknownSlot: "start",
        difficulty: 3,
      }),
      // Subtraction 3: Finding the end
      createSchemaRecognitionQuestion({
        concept: "change_mod1",
        text: "12 birds were sitting on a fence. 5 birds flew away. How many birds are still on the fence?",
        schemaKind: "change",
        values: { start: 12, change: 5, end: 7 },
        labels: { end: "remaining", start: "start", change: "flew away" },
        displayValues: { start: "?", change: "?", end: "?" },
        validationSlots: { end: "?", start: "12", change: "5" },
        alternateSlots: { end: "7", start: "12", change: "5" },
        unknownSlot: "end",
        difficulty: 1,
      }),
      // Subtraction 4: Finding the start
      createSchemaRecognitionQuestion({
        concept: "change_mod1",
        text: "Emma had some candies. She gave 15 to her friends and now has 20 left. How many candies did she start with?",
        schemaKind: "change",
        values: { start: 35, change: 15, end: 20 },
        labels: { end: "left over", start: "start", change: "gave away" },
        displayValues: { start: "?", change: "?", end: "?" },
        validationSlots: { end: "20", start: "?", change: "15" },
        alternateSlots: { end: "20", start: "35", change: "15" },
        unknownSlot: "start",
        difficulty: 3,
      }),
      //------------------------------- Addition -------------------------------
      createSchemaRecognitionQuestion({
        concept: "change_mod1",
        text: "Mia had some stickers. She got 4 more and now has 10.",
        schemaKind: "change",
        values: { start: 6, change: 4, end: 10 },
        labels: { end: "total", start: "start", change: "added" },
        displayValues: { start: "?", change: "?", end: "?" },
        validationSlots: { end: "10", start: "?", change: "4" },
        alternateSlots: { end: "10", start: "6", change: "4" },
        unknownSlot: "start",
        difficulty: 2,
      }),
      createSchemaRecognitionQuestion({
        concept: "change_mod1",
        text: "Jorge had some money. Then he earned $16 babysitting. Now Jorge has $68.",
        schemaKind: "change",
        values: { start: 52, change: 16, end: 68 },
        labels: { end: "total", start: "start", change: "earned" },
        displayValues: { start: "?", change: "?", end: "?" },
        validationSlots: { end: "68", start: "?", change: "16" },
        alternateSlots: { end: "68", start: "52", change: "16" },
        unknownSlot: "start",
        difficulty: 2,
      }),
      createSchemaRecognitionQuestion({
        concept: "change_mod1",
        text: "Sam had some baseball cards. He bought 15 more, and now he has 35.",
        schemaKind: "change",
        values: { start: 20, change: 15, end: 35 },
        labels: { end: "total", start: "start", change: "bought" },
        displayValues: { start: "?", change: "?", end: "?" },
        validationSlots: { end: "35", start: "?", change: "15" },
        alternateSlots: { end: "35", start: "20", change: "15" },
        unknownSlot: "start",
        difficulty: 2,
      }),
      createSchemaRecognitionQuestion({
        concept: "change_mod1",
        text: "Maya had already read some pages. She read 8 more pages and finished page 20.",
        schemaKind: "change",
        values: { start: 12, change: 8, end: 20 },
        labels: { end: "total", start: "start", change: "read" },
        displayValues: { start: "?", change: "?", end: "?" },
        validationSlots: { end: "20", start: "?", change: "8" },
        alternateSlots: { end: "20", start: "12", change: "8" },
        unknownSlot: "start",
        difficulty: 1,
      }),
      createSchemaRecognitionQuestion({
        concept: "change_mod1",
        text: "The team had some points. They scored 10 more to reach a total of 55 points.",
        schemaKind: "change",
        values: { start: 45, change: 10, end: 55 },
        labels: { end: "total", start: "start", change: "scored" },
        displayValues: { start: "?", change: "?", end: "?" },
        validationSlots: { end: "55", start: "?", change: "10" },
        alternateSlots: { end: "55", start: "45", change: "10" },
        unknownSlot: "start",
        difficulty: 3,
      }),
    ],
  },
  {
    id: "change_mod2",
    title: "Change: Bar to Eq",
    description: "Translate Change bar models into equations.",
    prerequisites: ["change_mod1"],
    questions: [
      // -------------------------------Subtraction-------------------------------
      // Subtraction 1: Ballon flew
      createEquationFromBarQuestion({
        concept: "change_mod2",
        text: "Build the equation for the balloons that flew away.",
        schemaKind: "change",
        barValues: { start: "15", change: "?", end: "11" },
        scaleValues: { start: 15, change: 4, end: 11 },
        labels: {
          end: "left over",
          start: "start",
          change: "flew away",
          left: "start",
          right: "flew away",
          result: "left over",
        },
        equationDisplayValues: { leftTerm: "15", rightTerm: "?", result: "11" },
        validationSlots: { leftTerm: "15", rightTerm: "?", result: "11" },
        alternateSlots: { leftTerm: "15", rightTerm: "4", result: "11" },
        operator: "-", // The magic switch!
        difficulty: 2,
      }),
      // Subtraction 2: Finding the start
      createEquationFromBarQuestion({
        concept: "change_mod2",
        text: "Build the equation for the money Sam started with.",
        schemaKind: "change",
        barValues: { start: "?", change: "18", end: "32" },
        scaleValues: { start: 50, change: 18, end: 32 },
        labels: {
          end: "left over",
          start: "start",
          change: "spent",
          left: "start",
          right: "spent",
          result: "left over",
        },
        equationDisplayValues: { leftTerm: "?", rightTerm: "18", result: "32" },
        validationSlots: { leftTerm: "?", rightTerm: "18", result: "32" },
        alternateSlots: { leftTerm: "50", rightTerm: "18", result: "32" },
        operator: "-",
        difficulty: 3,
      }),
      // Subtraction 3: Finding the end
      createEquationFromBarQuestion({
        concept: "change_mod2",
        text: "Build the equation for the birds remaining on the fence.",
        schemaKind: "change",
        barValues: { start: "12", change: "5", end: "?" },
        scaleValues: { start: 12, change: 5, end: 7 },
        labels: {
          end: "remaining",
          start: "start",
          change: "flew away",
          left: "start",
          right: "flew away",
          result: "remaining",
        },
        equationDisplayValues: { leftTerm: "12", rightTerm: "5", result: "?" },
        validationSlots: { leftTerm: "12", rightTerm: "5", result: "?" },
        alternateSlots: { leftTerm: "12", rightTerm: "5", result: "7" },
        operator: "-",
        difficulty: 1,
      }),
      // Subtraction 4: Finding the start
      createEquationFromBarQuestion({
        concept: "change_mod2",
        text: "Build the equation for the candies Emma started with.",
        schemaKind: "change",
        barValues: { start: "?", change: "15", end: "20" },
        scaleValues: { start: 35, change: 15, end: 20 },
        labels: {
          end: "left over",
          start: "start",
          change: "gave away",
          left: "start",
          right: "gave away",
          result: "left over",
        },
        equationDisplayValues: { leftTerm: "?", rightTerm: "15", result: "20" },
        validationSlots: { leftTerm: "?", rightTerm: "15", result: "20" },
        alternateSlots: { leftTerm: "35", rightTerm: "15", result: "20" },
        operator: "-",
        difficulty: 3,
      }),
      // Subtraction 5: Finding the end (left over)
      createEquationFromBarQuestion({
        concept: "change_mod2",
        text: "Build the equation for the remaining slices of pizza.",
        schemaKind: "change",
        barValues: { start: "8", change: "3", end: "?" },
        scaleValues: { start: 8, change: 3, end: 5 },
        labels: {
          end: "left over",
          start: "start",
          change: "eaten",
          left: "start",
          right: "eaten",
          result: "left over",
        },
        equationDisplayValues: { leftTerm: "8", rightTerm: "3", result: "?" },
        validationSlots: { leftTerm: "8", rightTerm: "3", result: "?" },
        alternateSlots: { leftTerm: "8", rightTerm: "3", result: "5" },
        operator: "-",
        difficulty: 1,
      }),
      // -------------------------------Addition-------------------------------
      createEquationFromBarQuestion({
        concept: "change_mod2",
        text: "Build the equation for the added stickers.",
        schemaKind: "change",
        barValues: { start: "?", change: "4", end: "10" },
        scaleValues: { start: 6, change: 4, end: 10 },
        labels: {
          end: "total",
          start: "start",
          change: "added",
          left: "start",
          right: "added",
          result: "total",
        },
        equationDisplayValues: { leftTerm: "?", rightTerm: "4", result: "10" },
        validationSlots: { leftTerm: "?", rightTerm: "4", result: "10" },
        alternateSlots: { leftTerm: "6", rightTerm: "4", result: "10" },
        operator: "+",
        difficulty: 2,
      }),
      createEquationFromBarQuestion({
        concept: "change_mod2",
        text: "Build the equation for Jorge's babysitting total.",
        schemaKind: "change",
        barValues: { start: "?", change: "16", end: "68" },
        scaleValues: { start: 52, change: 16, end: 68 },
        labels: {
          end: "total",
          start: "start",
          change: "earned",
          left: "start",
          right: "earned",
          result: "total",
        },
        equationDisplayValues: { leftTerm: "?", rightTerm: "16", result: "68" },
        validationSlots: { leftTerm: "?", rightTerm: "16", result: "68" },
        alternateSlots: { leftTerm: "52", rightTerm: "16", result: "68" },
        operator: "+",
        difficulty: 2,
      }),
      createEquationFromBarQuestion({
        concept: "change_mod2",
        text: "Build the equation for Sam's card total.",
        schemaKind: "change",
        barValues: { start: "?", change: "15", end: "35" },
        scaleValues: { start: 20, change: 15, end: 35 },
        labels: {
          end: "total",
          start: "start",
          change: "bought",
          left: "start",
          right: "bought",
          result: "total",
        },
        equationDisplayValues: { leftTerm: "?", rightTerm: "15", result: "35" },
        validationSlots: { leftTerm: "?", rightTerm: "15", result: "35" },
        alternateSlots: { leftTerm: "20", rightTerm: "15", result: "35" },
        operator: "+",
        difficulty: 2,
      }),
      createEquationFromBarQuestion({
        concept: "change_mod2",
        text: "Build the equation for Maya's page total.",
        schemaKind: "change",
        barValues: { start: "?", change: "8", end: "20" },
        scaleValues: { start: 12, change: 8, end: 20 },
        labels: {
          end: "total",
          start: "start",
          change: "read",
          left: "start",
          right: "read",
          result: "total",
        },
        equationDisplayValues: { leftTerm: "?", rightTerm: "8", result: "20" },
        validationSlots: { leftTerm: "?", rightTerm: "8", result: "20" },
        alternateSlots: { leftTerm: "12", rightTerm: "8", result: "20" },
        operator: "+",
        difficulty: 1,
      }),
      createEquationFromBarQuestion({
        concept: "change_mod2",
        text: "Build the equation for the team's point total.",
        schemaKind: "change",
        barValues: { start: "?", change: "10", end: "55" },
        scaleValues: { start: 45, change: 10, end: 55 },
        labels: {
          end: "total",
          start: "start",
          change: "scored",
          left: "start",
          right: "scored",
          result: "total",
        },
        equationDisplayValues: { leftTerm: "?", rightTerm: "10", result: "55" },
        validationSlots: { leftTerm: "?", rightTerm: "10", result: "55" },
        alternateSlots: { leftTerm: "45", rightTerm: "10", result: "55" },
        operator: "+",
        difficulty: 3,
      }),
    ],
  },
  {
    id: "change_mod3",
    title: "Change: Solve",
    description: "Build the bar model, write the equation, and solve.",
    prerequisites: ["change_mod2"],
    questions: [
      // --------------------- Subtraction -------------------------------
      // Problem 1
      createSchemaBarQuestion({
        concept: "change_mod3",
        text: "Sarah had $45. She spent $12 on a new book. How much money does she have now?",
        schemaKind: "change",
        values: { start: 45, change: 12, end: 33 },
        labels: { end: "left over", start: "start", change: "spent" },
        displayValues: { start: "?", change: "?", end: "?" },
        validationSlots: { end: "?", start: "45", change: "12" },
        alternateSlots: { end: "33", start: "45", change: "12" },
        unknownSlot: "end",
        difficulty: 3,
      }),
      createSchemaEquationQuestion({
        concept: "change_mod3",
        text: "Sarah had $45. She spent $12 on a new book. How much money does she have now?",
        schemaKind: "change",
        values: { start: "45", change: "12", end: "?" },
        scaleValues: { start: 45, change: 12, end: 33 },
        labels: {
          end: "left over",
          start: "start",
          change: "spent",
          left: "start",
          right: "spent",
          result: "left over",
        },
        unknownSlot: "end",
        equationValues: { leftTerm: "45", rightTerm: "12", result: "?" },
        validationSlots: { leftTerm: "45", rightTerm: "12", result: "?" },
        alternateSlots: { leftTerm: "45", rightTerm: "12", result: "33" },
        operator: "-", // Sets it to subtraction
        difficulty: 3,
      }),
      createSchemaSolveQuestion({
        concept: "change_mod3",
        text: "Sarah had $45. She spent $12 on a new book. How much money does she have now?",
        schemaKind: "change",
        answer: 33,
        displayEquation: "45 - 12 = ?",
        verificationEquation: "45 - 12 = 33",
        solutionLabel: "? = 33",
        difficulty: 3,
      }),
      // ----------------------------------------------------
      // Problem 2: Leaves (Finding the change)
      // ----------------------------------------------------
      createSchemaBarQuestion({
        concept: "change_mod3",
        text: "A tree had 24 leaves. The wind blew some away, and now there are 15 leaves left. How many leaves blew away?",
        schemaKind: "change",
        values: { start: 24, change: 9, end: 15 },
        labels: { end: "left over", start: "start", change: "blew away" },
        displayValues: { start: "?", change: "?", end: "?" },
        validationSlots: { end: "15", start: "24", change: "?" },
        alternateSlots: { end: "15", start: "24", change: "9" },
        unknownSlot: "change",
        difficulty: 2,
      }),
      createSchemaEquationQuestion({
        concept: "change_mod3",
        text: "A tree had 24 leaves. The wind blew some away, and now there are 15 leaves left. How many leaves blew away?",
        schemaKind: "change",
        values: { start: "24", change: "?", end: "15" },
        hideTopBar: true,
        scaleValues: { start: 24, change: 9, end: 15 },
        labels: {
          end: "left over",
          start: "start",
          change: "blew away",
          left: "start",
          right: "blew away",
          result: "left over",
        },
        unknownSlot: "change",
        equationValues: { leftTerm: "24", rightTerm: "?", result: "15" },
        validationSlots: { leftTerm: "24", rightTerm: "?", result: "15" },
        alternateSlots: { leftTerm: "24", rightTerm: "9", result: "15" },
        operator: "-",
        difficulty: 2,
      }),
      createSchemaSolveQuestion({
        concept: "change_mod3",
        text: "A tree had 24 leaves. The wind blew some away, and now there are 15 leaves left. How many leaves blew away?",
        schemaKind: "change",
        answer: 9,
        displayEquation: "24 - ? = 15",
        verificationEquation: "24 - 9 = 15",
        solutionLabel: "? = 9",
        difficulty: 2,
      }),

      // ----------------------------------------------------
      // Problem 3: Sam's Money (Finding the start)
      // ----------------------------------------------------
      createSchemaBarQuestion({
        concept: "change_mod3",
        text: "Sam had some money. He spent $18 on a toy and has $32 left. How much money did Sam start with?",
        schemaKind: "change",
        values: { start: 50, change: 18, end: 32 },
        labels: { end: "left over", start: "start", change: "spent" },
        displayValues: { start: "?", change: "?", end: "?" },
        validationSlots: { end: "32", start: "?", change: "18" },
        alternateSlots: { end: "32", start: "50", change: "18" },
        unknownSlot: "start",
        difficulty: 3,
      }),
      createSchemaEquationQuestion({
        concept: "change_mod3",
        text: "Sam had some money. He spent $18 on a toy and has $32 left. How much money did Sam start with?",
        schemaKind: "change",
        values: { start: "?", change: "18", end: "32" },
        hideTopBar: true,
        scaleValues: { start: 50, change: 18, end: 32 },
        labels: {
          end: "left over",
          start: "start",
          change: "spent",
          left: "start",
          right: "spent",
          result: "left over",
        },
        unknownSlot: "start",
        equationValues: { leftTerm: "?", rightTerm: "18", result: "32" },
        validationSlots: { leftTerm: "?", rightTerm: "18", result: "32" },
        alternateSlots: { leftTerm: "50", rightTerm: "18", result: "32" },
        operator: "-",
        difficulty: 3,
      }),
      createSchemaSolveQuestion({
        concept: "change_mod3",
        text: "Sam had some money. He spent $18 on a toy and has $32 left. How much money did Sam start with?",
        schemaKind: "change",
        answer: 50,
        displayEquation: "? - 18 = 32",
        verificationEquation: "50 - 18 = 32",
        solutionLabel: "? = 50",
        difficulty: 3,
      }),

      // ----------------------------------------------------
      // Problem 4: Birds (Finding the end)
      // ----------------------------------------------------
      createSchemaBarQuestion({
        concept: "change_mod3",
        text: "12 birds were sitting on a fence. 5 birds flew away. How many birds are still on the fence?",
        schemaKind: "change",
        values: { start: 12, change: 5, end: 7 },
        labels: { end: "remaining", start: "start", change: "flew away" },
        displayValues: { start: "?", change: "?", end: "?" },
        validationSlots: { end: "?", start: "12", change: "5" },
        alternateSlots: { end: "7", start: "12", change: "5" },
        unknownSlot: "end",
        difficulty: 1,
      }),
      createSchemaEquationQuestion({
        concept: "change_mod3",
        text: "12 birds were sitting on a fence. 5 birds flew away. How many birds are still on the fence?",
        schemaKind: "change",
        values: { start: "12", change: "5", end: "?" },
        hideTopBar: true,
        scaleValues: { start: 12, change: 5, end: 7 },
        labels: {
          end: "remaining",
          start: "start",
          change: "flew away",
          left: "start",
          right: "flew away",
          result: "remaining",
        },
        unknownSlot: "end",
        equationValues: { leftTerm: "12", rightTerm: "5", result: "?" },
        validationSlots: { leftTerm: "12", rightTerm: "5", result: "?" },
        alternateSlots: { leftTerm: "12", rightTerm: "5", result: "7" },
        operator: "-",
        difficulty: 1,
      }),
      createSchemaSolveQuestion({
        concept: "change_mod3",
        text: "12 birds were sitting on a fence. 5 birds flew away. How many birds are still on the fence?",
        schemaKind: "change",
        answer: 7,
        displayEquation: "12 - 5 = ?",
        verificationEquation: "12 - 5 = 7",
        solutionLabel: "? = 7",
        difficulty: 1,
      }),

      // ----------------------------------------------------
      // Problem 5: Emma's Candies (Finding the start)
      // ----------------------------------------------------
      createSchemaBarQuestion({
        concept: "change_mod3",
        text: "Emma had some candies. She gave 15 to her friends and now has 20 left. How many candies did she start with?",
        schemaKind: "change",
        values: { start: 35, change: 15, end: 20 },
        labels: { end: "left over", start: "start", change: "gave away" },
        displayValues: { start: "?", change: "?", end: "?" },
        validationSlots: { end: "20", start: "?", change: "15" },
        alternateSlots: { end: "20", start: "35", change: "15" },
        unknownSlot: "start",
        difficulty: 3,
      }),
      createSchemaEquationQuestion({
        concept: "change_mod3",
        text: "Emma had some candies. She gave 15 to her friends and now has 20 left. How many candies did she start with?",
        schemaKind: "change",
        values: { start: "?", change: "15", end: "20" },
        hideTopBar: true,
        scaleValues: { start: 35, change: 15, end: 20 },
        labels: {
          end: "left over",
          start: "start",
          change: "gave away",
          left: "start",
          right: "gave away",
          result: "left over",
        },
        unknownSlot: "start",
        equationValues: { leftTerm: "?", rightTerm: "15", result: "20" },
        validationSlots: { leftTerm: "?", rightTerm: "15", result: "20" },
        alternateSlots: { leftTerm: "35", rightTerm: "15", result: "20" },
        operator: "-",
        difficulty: 3,
      }),
      createSchemaSolveQuestion({
        concept: "change_mod3",
        text: "Emma had some candies. She gave 15 to her friends and now has 20 left. How many candies did she start with?",
        schemaKind: "change",
        answer: 35,
        displayEquation: "? - 15 = 20",
        verificationEquation: "35 - 15 = 20",
        solutionLabel: "? = 35",
        difficulty: 3,
      }),
      // Addition
      // Problem 1 (Stamps)
      createSchemaBarQuestion({
        concept: "change_mod3",
        text: "Lina had some stamps. She found 4 more and now has 10.",
        schemaKind: "change",
        values: { start: 6, change: 4, end: 10 },
        labels: { end: "total", start: "start", change: "found" },
        displayValues: { start: "?", change: "?", end: "?" },
        validationSlots: { end: "10", start: "?", change: "4" },
        alternateSlots: { end: "10", start: "6", change: "4" },
        unknownSlot: "start",
        difficulty: 3,
      }),
      createSchemaEquationQuestion({
        concept: "change_mod3",
        text: "Lina had some stamps. She found 4 more and now has 10.",
        schemaKind: "change",
        values: { start: "?", change: "4", end: "10" },
        hideTopBar: true,
        scaleValues: { start: 6, change: 4, end: 10 },
        labels: {
          end: "total",
          start: "start",
          change: "found",
          left: "start",
          right: "found",
          result: "total",
        },
        unknownSlot: "start",
        equationValues: { leftTerm: "?", rightTerm: "4", result: "10" },
        validationSlots: { leftTerm: "?", rightTerm: "4", result: "10" },
        alternateSlots: { leftTerm: "6", rightTerm: "4", result: "10" },
        operator: "+",
        difficulty: 3,
      }),
      createSchemaSolveQuestion({
        concept: "change_mod3",
        text: "Lina had some stamps. She found 4 more and now has 10.",
        schemaKind: "change",
        answer: 6,
        displayEquation: "? + 4 = 10",
        verificationEquation: "6 + 4 = 10",
        solutionLabel: "? = 6",
        difficulty: 3,
      }),

      // Problem 2 (Bonus Points)
      createSchemaBarQuestion({
        concept: "change_mod3",
        text: "Tara had some points. She earned 16 bonus points and now has 68.",
        schemaKind: "change",
        values: { start: 52, change: 16, end: 68 },
        labels: { end: "total", start: "start", change: "bonus" },
        displayValues: { start: "?", change: "?", end: "?" },
        validationSlots: { end: "68", start: "?", change: "16" },
        alternateSlots: { end: "68", start: "52", change: "16" },
        unknownSlot: "start",
        difficulty: 3,
      }),
      createSchemaEquationQuestion({
        concept: "change_mod3",
        text: "Tara had some points. She earned 16 bonus points and now has 68.",
        schemaKind: "change",
        values: { start: "?", change: "16", end: "68" },
        hideTopBar: true,
        scaleValues: { start: 52, change: 16, end: 68 },
        labels: {
          end: "total",
          start: "start",
          change: "bonus",
          left: "start",
          right: "bonus",
          result: "total",
        },
        unknownSlot: "start",
        equationValues: { leftTerm: "?", rightTerm: "16", result: "68" },
        validationSlots: { leftTerm: "?", rightTerm: "16", result: "68" },
        alternateSlots: { leftTerm: "52", rightTerm: "16", result: "68" },
        operator: "+",
        difficulty: 3,
      }),
      createSchemaSolveQuestion({
        concept: "change_mod3",
        text: "Tara had some points. She earned 16 bonus points and now has 68.",
        schemaKind: "change",
        answer: 52,
        displayEquation: "? + 16 = 68",
        verificationEquation: "52 + 16 = 68",
        solutionLabel: "? = 52",
        difficulty: 3,
      }),

      // Problem 3 (Club Members)
      createSchemaBarQuestion({
        concept: "change_mod3",
        text: "A club had some members. 15 new members joined, and now there are 35.",
        schemaKind: "change",
        values: { start: 20, change: 15, end: 35 },
        labels: { end: "total", start: "start", change: "joined" },
        displayValues: { start: "?", change: "?", end: "?" },
        validationSlots: { end: "35", start: "?", change: "15" },
        alternateSlots: { end: "35", start: "20", change: "15" },
        unknownSlot: "start",
        difficulty: 2,
      }),
      createSchemaEquationQuestion({
        concept: "change_mod3",
        text: "A club had some members. 15 new members joined, and now there are 35.",
        schemaKind: "change",
        values: { start: "?", change: "15", end: "35" },
        hideTopBar: true,
        scaleValues: { start: 20, change: 15, end: 35 },
        labels: {
          end: "total",
          start: "start",
          change: "joined",
          left: "start",
          right: "joined",
          result: "total",
        },
        unknownSlot: "start",
        equationValues: { leftTerm: "?", rightTerm: "15", result: "35" },
        validationSlots: { leftTerm: "?", rightTerm: "15", result: "35" },
        alternateSlots: { leftTerm: "20", rightTerm: "15", result: "35" },
        operator: "+",
        difficulty: 2,
      }),
      createSchemaSolveQuestion({
        concept: "change_mod3",
        text: "A club had some members. 15 new members joined, and now there are 35.",
        schemaKind: "change",
        answer: 20,
        displayEquation: "? + 15 = 35",
        verificationEquation: "20 + 15 = 35",
        solutionLabel: "? = 20",
        difficulty: 2,
      }),

      // Problem 4 (Puzzles)
      createSchemaBarQuestion({
        concept: "change_mod3",
        text: "Rina had already solved some puzzles. She solved 8 more and finished 20.",
        schemaKind: "change",
        values: { start: 12, change: 8, end: 20 },
        labels: { end: "total", start: "start", change: "solved" },
        displayValues: { start: "?", change: "?", end: "?" },
        validationSlots: { end: "20", start: "?", change: "8" },
        alternateSlots: { end: "20", start: "12", change: "8" },
        unknownSlot: "start",
        difficulty: 1,
      }),
      createSchemaEquationQuestion({
        concept: "change_mod3",
        text: "Rina had already solved some puzzles. She solved 8 more and finished 20.",
        schemaKind: "change",
        values: { start: "?", change: "8", end: "20" },
        hideTopBar: true,
        scaleValues: { start: 12, change: 8, end: 20 },
        labels: {
          end: "total",
          start: "start",
          change: "solved",
          left: "start",
          right: "solved",
          result: "total",
        },
        unknownSlot: "start",
        equationValues: { leftTerm: "?", rightTerm: "8", result: "20" },
        validationSlots: { leftTerm: "?", rightTerm: "8", result: "20" },
        alternateSlots: { leftTerm: "12", rightTerm: "8", result: "20" },
        operator: "+",
        difficulty: 1,
      }),
      createSchemaSolveQuestion({
        concept: "change_mod3",
        text: "Rina had already solved some puzzles. She solved 8 more and finished 20.",
        schemaKind: "change",
        answer: 12,
        displayEquation: "? + 8 = 20",
        verificationEquation: "12 + 8 = 20",
        solutionLabel: "? = 12",
        difficulty: 1,
      }),

      // Problem 5 (Tokens)
      createSchemaBarQuestion({
        concept: "change_mod3",
        text: "A class had some tokens. They earned 10 more to reach 55 tokens.",
        schemaKind: "change",
        values: { start: 45, change: 10, end: 55 },
        labels: { end: "total", start: "start", change: "earned" },
        displayValues: { start: "?", change: "?", end: "?" },
        validationSlots: { end: "55", start: "?", change: "10" },
        alternateSlots: { end: "55", start: "45", change: "10" },
        unknownSlot: "start",
        difficulty: 3,
      }),
      createSchemaEquationQuestion({
        concept: "change_mod3",
        text: "A class had some tokens. They earned 10 more to reach 55 tokens.",
        schemaKind: "change",
        values: { start: "?", change: "10", end: "55" },
        hideTopBar: true,
        scaleValues: { start: 45, change: 10, end: 55 },
        labels: {
          end: "total",
          start: "start",
          change: "earned",
          left: "start",
          right: "earned",
          result: "total",
        },
        unknownSlot: "start",
        equationValues: { leftTerm: "?", rightTerm: "10", result: "55" },
        validationSlots: { leftTerm: "?", rightTerm: "10", result: "55" },
        alternateSlots: { leftTerm: "45", rightTerm: "10", result: "55" },
        operator: "+",
        difficulty: 3,
      }),
      createSchemaSolveQuestion({
        concept: "change_mod3",
        text: "A class had some tokens. They earned 10 more to reach 55 tokens.",
        schemaKind: "change",
        answer: 45,
        displayEquation: "? + 10 = 55",
        verificationEquation: "45 + 10 = 55",
        solutionLabel: "? = 45",
        difficulty: 3,
      }),
    ],
  },

  // ============================================================================
  // TRACK 3: THE COMPARE SCHEMA
  // ============================================================================
  {
    id: "compare_mod1",
    title: "Compare: Word to Bar",
    description: "Read the compare story and build the bar model.",
    prerequisites: ["change_mod3"],
    questions: [
      createSchemaRecognitionQuestion({
        concept: "compare_mod1",
        text: "Darnell has 234 fewer marbles than Delilah. Delilah has 362 marbles. How many does Darnell have?",
        schemaKind: "compare",
        values: { bigger: 362, smaller: 128, difference: 234 },
        labels: { bigger: "Delilah", smaller: "Darnell", difference: "fewer" },
        displayValues: { bigger: "?", smaller: "?", difference: "?" },
        validationSlots: { bigger: "362", smaller: "?", difference: "234" },
        unknownSlot: "smaller",
        difficulty: 4,
      }),
      createSchemaRecognitionQuestion({
        concept: "compare_mod1",
        text: "Tabitha wrote 110 words. Sasha wrote 25 fewer words than Tabitha. How many words did Sasha write?",
        schemaKind: "compare",
        values: { bigger: 110, smaller: 85, difference: 25 },
        labels: { bigger: "Tabitha", smaller: "Sasha", difference: "fewer" },
        displayValues: { bigger: "?", smaller: "?", difference: "?" },
        validationSlots: { bigger: "110", smaller: "?", difference: "25" },
        unknownSlot: "smaller",
        difficulty: 3,
      }),
      createSchemaRecognitionQuestion({
        concept: "compare_mod1",
        text: "The Oak tree is 45 feet tall. The Pine tree is 15 feet shorter. How tall is the Pine tree?",
        schemaKind: "compare",
        values: { bigger: 45, smaller: 30, difference: 15 },
        labels: { bigger: "Oak", smaller: "Pine", difference: "shorter" },
        displayValues: { bigger: "?", smaller: "?", difference: "?" },
        validationSlots: { bigger: "45", smaller: "?", difference: "15" },
        unknownSlot: "smaller",
        difficulty: 2,
      }),
      createSchemaRecognitionQuestion({
        concept: "compare_mod1",
        text: "Sam has $80. Alex has $30 less than Sam. How much money does Alex have?",
        schemaKind: "compare",
        values: { bigger: 80, smaller: 50, difference: 30 },
        labels: { bigger: "Sam", smaller: "Alex", difference: "less" },
        displayValues: { bigger: "?", smaller: "?", difference: "?" },
        validationSlots: { bigger: "80", smaller: "?", difference: "30" },
        unknownSlot: "smaller",
        difficulty: 2,
      }),
      createSchemaRecognitionQuestion({
        concept: "compare_mod1",
        text: "Max the dog weighs 60 lbs. Bella the cat is 40 lbs lighter. How much does Bella weigh?",
        schemaKind: "compare",
        values: { bigger: 60, smaller: 20, difference: 40 },
        labels: { bigger: "Max", smaller: "Bella", difference: "lighter" },
        displayValues: { bigger: "?", smaller: "?", difference: "?" },
        validationSlots: { bigger: "60", smaller: "?", difference: "40" },
        unknownSlot: "smaller",
        difficulty: 2,
      }),
    ],
  },

  {
    id: "compare_mod2",
    title: "Compare: Bar to Eq",
    description: "Translate Compare bar models into equations.",
    prerequisites: ["compare_mod1"],
    questions: [
      createEquationFromBarQuestion({
        concept: "compare_mod2",
        text: "Build the equation for Delilah and Darnell's marbles.",
        schemaKind: "compare",
        barValues: { bigger: "362", smaller: "?", difference: "234" },
        scaleValues: { bigger: 362, smaller: 128, difference: 234 },
        labels: {
          bigger: "Delilah's",
          smaller: "Darnell's",
          difference: "fewer",
          left: "Darnell's",
          right: "fewer",
          result: "Delilah's",
        },
        equationDisplayValues: {
          leftTerm: "?",
          rightTerm: "234",
          result: "362",
        },
        validationSlots: { leftTerm: "?", rightTerm: "234", result: "362" },
        alternateSlots: { leftTerm: "128", rightTerm: "234", result: "362" },
        operator: "+",
        difficulty: 3,
      }),
      createEquationFromBarQuestion({
        concept: "compare_mod2",
        text: "Build the equation for Tabitha and Sasha's words.",
        schemaKind: "compare",
        barValues: { bigger: "110", smaller: "?", difference: "25" },
        scaleValues: { bigger: 110, smaller: 85, difference: 25 },
        labels: {
          bigger: "Tabitha",
          smaller: "Sasha",
          difference: "fewer",
          left: "Sasha",
          right: "fewer",
          result: "Tabitha",
        },
        equationDisplayValues: {
          leftTerm: "?",
          rightTerm: "25",
          result: "110",
        },
        validationSlots: { leftTerm: "?", rightTerm: "25", result: "110" },
        alternateSlots: { leftTerm: "85", rightTerm: "25", result: "110" },
        operator: "+",
        difficulty: 3,
      }),
      createEquationFromBarQuestion({
        concept: "compare_mod2",
        text: "Build the equation for the Oak and Pine heights.",
        schemaKind: "compare",
        barValues: { bigger: "45", smaller: "?", difference: "15" },
        scaleValues: { bigger: 45, smaller: 30, difference: 15 },
        labels: {
          bigger: "Oak Tree",
          smaller: "Pine Tree",
          difference: "shorter",
          left: "Pine Tree",
          right: "shorter",
          result: "Oak Tree",
        },
        equationDisplayValues: { leftTerm: "?", rightTerm: "15", result: "45" },
        validationSlots: { leftTerm: "?", rightTerm: "15", result: "45" },
        alternateSlots: { leftTerm: "30", rightTerm: "15", result: "45" },
        operator: "+",
        difficulty: 2,
      }),
      createEquationFromBarQuestion({
        concept: "compare_mod2",
        text: "Build the equation for Sam and Alex's money.",
        schemaKind: "compare",
        barValues: { bigger: "80", smaller: "?", difference: "30" },
        scaleValues: { bigger: 80, smaller: 50, difference: 30 },
        labels: {
          bigger: "Sam's Money",
          smaller: "Alex's Money",
          difference: "less",
          left: "Alex's Money",
          right: "less",
          result: "Sam's Money",
        },
        equationDisplayValues: { leftTerm: "?", rightTerm: "30", result: "80" },
        validationSlots: { leftTerm: "?", rightTerm: "30", result: "80" },
        alternateSlots: { leftTerm: "50", rightTerm: "30", result: "80" },
        operator: "+",
        difficulty: 2,
      }),
      createEquationFromBarQuestion({
        concept: "compare_mod2",
        text: "Build the equation for Max and Bella's weights.",
        schemaKind: "compare",
        barValues: { bigger: "60", smaller: "?", difference: "40" },
        scaleValues: { bigger: 60, smaller: 20, difference: 40 },
        labels: {
          bigger: "Max's Weight",
          smaller: "Bella's Weight",
          difference: "lighter",
          left: "Bella's Weight",
          right: "lighter",
          result: "Max's Weight",
        },
        equationDisplayValues: { leftTerm: "?", rightTerm: "40", result: "60" },
        validationSlots: { leftTerm: "?", rightTerm: "40", result: "60" },
        alternateSlots: { leftTerm: "20", rightTerm: "40", result: "60" },
        operator: "+",
        difficulty: 2,
      }),
    ],
  },

  {
    id: "compare_mod3",
    title: "Compare: Solve",
    description: "Build the bar model, write the equation, and solve.",
    prerequisites: ["compare_mod2"],
    questions: [
      // Problem 1 (Seats)
      createSchemaBarQuestion({
        concept: "compare_mod3",
        text: "The main hall has 362 seats. The balcony has 234 fewer seats than the main hall. How many seats does the balcony have?",
        schemaKind: "compare",
        values: { bigger: 362, smaller: 128, difference: 234 },
        labels: {
          bigger: "main hall seats",
          smaller: "balcony seats",
          difference: "fewer seats",
        },
        displayValues: { bigger: "?", smaller: "?", difference: "?" },
        validationSlots: { bigger: "362", smaller: "?", difference: "234" },
        alternateSlots: { bigger: "362", smaller: "128", difference: "234" },
        unknownSlot: "smaller",
        participants: { biggerOwner: "main hall", smallerOwner: "balcony" },
        comparisonWording: "fewer than",
        equationForm: "smaller_plus_difference_equals_bigger",
        compareVariant: "fewer_than_gap",
        alignmentMode: "fixed_track",
        barDecorations: { showBracket: true, bracketLabel: "?" },
        difficulty: 4,
      }),
      createSchemaEquationQuestion({
        concept: "compare_mod3",
        text: "The main hall has 362 seats. The balcony has 234 fewer seats than the main hall. How many seats does the balcony have?",
        schemaKind: "compare",
        values: { bigger: "362", smaller: "?", difference: "234" },
        hideTopBar: true,
        scaleValues: { bigger: 362, smaller: 128, difference: 234 },
        labels: {
          bigger: "main hall seats",
          smaller: "balcony seats",
          difference: "fewer seats",
          left: "balcony seats",
          right: "fewer seats",
          result: "main hall seats",
        },
        unknownSlot: "smaller",
        equationValues: { leftTerm: "?", rightTerm: "234", result: "362" },
        validationSlots: { leftTerm: "?", rightTerm: "234", result: "362" },
        alternateSlots: { leftTerm: "128", rightTerm: "234", result: "362" },
        participants: { biggerOwner: "main hall", smallerOwner: "balcony" },
        comparisonWording: "fewer than",
        equationForm: "smaller_plus_difference_equals_bigger",
        compareVariant: "fewer_than_gap",
        alignmentMode: "fixed_track",
        barDecorations: { showBracket: true, bracketLabel: "?" },
        operator: "+",
        difficulty: 4,
      }),
      createSchemaSolveQuestion({
        concept: "compare_mod3",
        text: "The main hall has 362 seats. The balcony has 234 fewer seats than the main hall. How many seats does the balcony have?",
        schemaKind: "compare",
        answer: 128,
        displayEquation: "? + 234 = 362",
        verificationEquation: "128 + 234 = 362",
        solutionLabel: "? = 128",
        difficulty: 4,
      }),

      // Problem 2 (Typed Words)
      createSchemaBarQuestion({
        concept: "compare_mod3",
        text: "Ruby typed 110 words. Omar typed 25 fewer words than Ruby. How many words did Omar type?",
        schemaKind: "compare",
        values: { bigger: 110, smaller: 85, difference: 25 },
        labels: { bigger: "Ruby", smaller: "Omar", difference: "fewer" },
        displayValues: { bigger: "?", smaller: "?", difference: "?" },
        validationSlots: { bigger: "110", smaller: "?", difference: "25" },
        alternateSlots: { bigger: "110", smaller: "85", difference: "25" },
        unknownSlot: "smaller",
        participants: { biggerOwner: "Ruby", smallerOwner: "Omar" },
        comparisonWording: "fewer than",
        equationForm: "smaller_plus_difference_equals_bigger",
        compareVariant: "fewer_than_gap",
        alignmentMode: "fixed_track",
        barDecorations: { showBracket: true, bracketLabel: "?" },
        difficulty: 3,
      }),
      createSchemaEquationQuestion({
        concept: "compare_mod3",
        text: "Ruby typed 110 words. Omar typed 25 fewer words than Ruby. How many words did Omar type?",
        schemaKind: "compare",
        values: { bigger: "110", smaller: "?", difference: "25" },
        hideTopBar: true,
        scaleValues: { bigger: 110, smaller: 85, difference: 25 },
        labels: {
          bigger: "Ruby",
          smaller: "Omar",
          difference: "fewer",
          left: "Omar",
          right: "fewer",
          result: "Ruby",
        },
        unknownSlot: "smaller",
        equationValues: { leftTerm: "?", rightTerm: "25", result: "110" },
        validationSlots: { leftTerm: "?", rightTerm: "25", result: "110" },
        alternateSlots: { leftTerm: "85", rightTerm: "25", result: "110" },
        participants: { biggerOwner: "Ruby", smallerOwner: "Omar" },
        comparisonWording: "fewer than",
        equationForm: "smaller_plus_difference_equals_bigger",
        compareVariant: "fewer_than_gap",
        alignmentMode: "fixed_track",
        barDecorations: { showBracket: true, bracketLabel: "?" },
        operator: "+",
        difficulty: 3,
      }),
      createSchemaSolveQuestion({
        concept: "compare_mod3",
        text: "Ruby typed 110 words. Omar typed 25 fewer words than Ruby. How many words did Omar type?",
        schemaKind: "compare",
        answer: 85,
        displayEquation: "? + 25 = 110",
        verificationEquation: "85 + 25 = 110",
        solutionLabel: "? = 85",
        difficulty: 3,
      }),

      // Problem 3 (Maple/Cedar Trees)
      createSchemaBarQuestion({
        concept: "compare_mod3",
        text: "The Maple tree is 45 feet tall. The Cedar tree is 15 feet shorter. How tall is the Cedar tree?",
        schemaKind: "compare",
        values: { bigger: 45, smaller: 30, difference: 15 },
        labels: { bigger: "Maple", smaller: "Cedar", difference: "shorter" },
        displayValues: { bigger: "?", smaller: "?", difference: "?" },
        validationSlots: { bigger: "45", smaller: "?", difference: "15" },
        alternateSlots: { bigger: "45", smaller: "30", difference: "15" },
        unknownSlot: "smaller",
        participants: { biggerOwner: "Maple", smallerOwner: "Cedar" },
        comparisonWording: "shorter than",
        equationForm: "smaller_plus_difference_equals_bigger",
        compareVariant: "fewer_than_gap",
        alignmentMode: "fixed_track",
        barDecorations: { showBracket: true, bracketLabel: "?" },
        difficulty: 2,
      }),
      createSchemaEquationQuestion({
        concept: "compare_mod3",
        text: "The Maple tree is 45 feet tall. The Cedar tree is 15 feet shorter. How tall is the Cedar tree?",
        schemaKind: "compare",
        values: { bigger: "45", smaller: "?", difference: "15" },
        hideTopBar: true,
        scaleValues: { bigger: 45, smaller: 30, difference: 15 },
        labels: {
          bigger: "Maple",
          smaller: "Cedar",
          difference: "shorter",
          left: "Cedar",
          right: "shorter",
          result: "Maple",
        },
        unknownSlot: "smaller",
        equationValues: { leftTerm: "?", rightTerm: "15", result: "45" },
        validationSlots: { leftTerm: "?", rightTerm: "15", result: "45" },
        alternateSlots: { leftTerm: "30", rightTerm: "15", result: "45" },
        participants: { biggerOwner: "Maple", smallerOwner: "Cedar" },
        comparisonWording: "shorter than",
        equationForm: "smaller_plus_difference_equals_bigger",
        compareVariant: "fewer_than_gap",
        alignmentMode: "fixed_track",
        barDecorations: { showBracket: true, bracketLabel: "?" },
        operator: "+",
        difficulty: 2,
      }),
      createSchemaSolveQuestion({
        concept: "compare_mod3",
        text: "The Maple tree is 45 feet tall. The Cedar tree is 15 feet shorter. How tall is the Cedar tree?",
        schemaKind: "compare",
        answer: 30,
        displayEquation: "? + 15 = 45",
        verificationEquation: "30 + 15 = 45",
        solutionLabel: "? = 30",
        difficulty: 2,
      }),

      // Problem 4 (Maya/Leo Money)
      createSchemaBarQuestion({
        concept: "compare_mod3",
        text: "Maya has $80. Leo has $30 less than Maya. How much money does Leo have?",
        schemaKind: "compare",
        values: { bigger: 80, smaller: 50, difference: 30 },
        labels: { bigger: "Maya", smaller: "Leo", difference: "less" },
        displayValues: { bigger: "?", smaller: "?", difference: "?" },
        validationSlots: { bigger: "80", smaller: "?", difference: "30" },
        alternateSlots: { bigger: "80", smaller: "50", difference: "30" },
        unknownSlot: "smaller",
        participants: { biggerOwner: "Maya", smallerOwner: "Leo" },
        comparisonWording: "less than",
        equationForm: "smaller_plus_difference_equals_bigger",
        compareVariant: "fewer_than_gap",
        alignmentMode: "fixed_track",
        barDecorations: { showBracket: true, bracketLabel: "?" },
        difficulty: 2,
      }),
      createSchemaEquationQuestion({
        concept: "compare_mod3",
        text: "Maya has $80. Leo has $30 less than Maya. How much money does Leo have?",
        schemaKind: "compare",
        values: { bigger: "80", smaller: "?", difference: "30" },
        hideTopBar: true,
        scaleValues: { bigger: 80, smaller: 50, difference: 30 },
        labels: {
          bigger: "Maya",
          smaller: "Leo",
          difference: "less",
          left: "Leo",
          right: "less",
          result: "Maya",
        },
        unknownSlot: "smaller",
        equationValues: { leftTerm: "?", rightTerm: "30", result: "80" },
        validationSlots: { leftTerm: "?", rightTerm: "30", result: "80" },
        alternateSlots: { leftTerm: "50", rightTerm: "30", result: "80" },
        participants: { biggerOwner: "Maya", smallerOwner: "Leo" },
        comparisonWording: "less than",
        equationForm: "smaller_plus_difference_equals_bigger",
        compareVariant: "fewer_than_gap",
        alignmentMode: "fixed_track",
        barDecorations: { showBracket: true, bracketLabel: "?" },
        operator: "+",
        difficulty: 2,
      }),
      createSchemaSolveQuestion({
        concept: "compare_mod3",
        text: "Maya has $80. Leo has $30 less than Maya. How much money does Leo have?",
        schemaKind: "compare",
        answer: 50,
        displayEquation: "? + 30 = 80",
        verificationEquation: "50 + 30 = 80",
        solutionLabel: "? = 50",
        difficulty: 2,
      }),

      // Problem 5 (Suitcase/Backpack Weight)
      createSchemaBarQuestion({
        concept: "compare_mod3",
        text: "A suitcase weighs 60 lbs. A backpack is 40 lbs lighter. How much does the backpack weigh?",
        schemaKind: "compare",
        values: { bigger: 60, smaller: 20, difference: 40 },
        labels: {
          bigger: "suitcase",
          smaller: "backpack",
          difference: "lighter",
        },
        displayValues: { bigger: "?", smaller: "?", difference: "?" },
        validationSlots: { bigger: "60", smaller: "?", difference: "40" },
        alternateSlots: { bigger: "60", smaller: "20", difference: "40" },
        unknownSlot: "smaller",
        participants: { biggerOwner: "suitcase", smallerOwner: "backpack" },
        comparisonWording: "lighter than",
        equationForm: "smaller_plus_difference_equals_bigger",
        compareVariant: "fewer_than_gap",
        alignmentMode: "fixed_track",
        barDecorations: { showBracket: true, bracketLabel: "?" },
        difficulty: 2,
      }),
      createSchemaEquationQuestion({
        concept: "compare_mod3",
        text: "A suitcase weighs 60 lbs. A backpack is 40 lbs lighter. How much does the backpack weigh?",
        schemaKind: "compare",
        values: { bigger: "60", smaller: "?", difference: "40" },
        hideTopBar: true,
        scaleValues: { bigger: 60, smaller: 20, difference: 40 },
        labels: {
          bigger: "suitcase",
          smaller: "backpack",
          difference: "lighter",
          left: "backpack",
          right: "lighter",
          result: "suitcase",
        },
        unknownSlot: "smaller",
        equationValues: { leftTerm: "?", rightTerm: "40", result: "60" },
        validationSlots: { leftTerm: "?", rightTerm: "40", result: "60" },
        alternateSlots: { leftTerm: "20", rightTerm: "40", result: "60" },
        participants: { biggerOwner: "suitcase", smallerOwner: "backpack" },
        comparisonWording: "lighter than",
        equationForm: "smaller_plus_difference_equals_bigger",
        compareVariant: "fewer_than_gap",
        alignmentMode: "fixed_track",
        barDecorations: { showBracket: true, bracketLabel: "?" },
        operator: "+",
        difficulty: 2,
      }),
      createSchemaSolveQuestion({
        concept: "compare_mod3",
        text: "A suitcase weighs 60 lbs. A backpack is 40 lbs lighter. How much does the backpack weigh?",
        schemaKind: "compare",
        answer: 20,
        displayEquation: "? + 40 = 60",
        verificationEquation: "20 + 40 = 60",
        solutionLabel: "? = 20",
        difficulty: 2,
      }),
    ],
  },
];

// const seedData = async () => {
//   try {
//     await Concept.deleteMany({});
//     await User.deleteMany({});
//     await Attempt.deleteMany({});
//     await TeacherSignupCode.deleteMany({});
//     console.log("Database Wiped Clean");

//     await ensureTeacherSignupCode();

//     await Concept.insertMany(conceptsData);
//     console.log("Concepts Seeded");

//     const testUser = new User({
//       username: "student1",
//       password: "password123",
//       role: "student",
//       streak: 0,
//       zpdNodes: ["single_add"],
//       mastery: {
//         single_add: {
//           status: "unlocked",
//           successCount: 0,
//           attemptCount: 0,
//           lastAttempts: [],
//         },
//       },
//     });

//     await testUser.save();
//     console.log("Test User (student1) Seeded Successfully");

//     const teacherUser = new User({
//       username: "teacher1",
//       password: "password123",
//       role: "teacher",
//       mastery: {},
//       zpdNodes: [],
//       avatar: "beam",
//       streak: 0,
//     });

//     await teacherUser.save();
//     console.log("Teacher User Seeded Successfully");
//   } catch (error) {
//     console.error("Seeding Error:", error);
//   }
// };

const seedData = async () => {
  try {
    // 1. Clean the database
    await Concept.deleteMany({});
    await User.deleteMany({});
    await Attempt.deleteMany({});
    await TeacherSignupCode.deleteMany({});
    console.log("-----------------------------------------");
    console.log("🧹 DATABASE WIPED FOR TESTING");

    await ensureTeacherSignupCode();
    await Concept.insertMany(conceptsData);

    // 2. THE TESTING SWITCH
    // Change this variable to the ID you want to test right now.
    // Here are some common jump points:

    // ---------- Practice -------------
    // "single_add"             -> Phase 1: Basic Math
    // "single_sub"             -> Phase 1: Basic Math
    // "multi_add"             -> Phase 1: Basic Math
    // "multi_sub"             -> Phase 1: Basic Math

    // "missing_part_equations" -> Phase 1: Algebraic Bridge
    // ---------- Main Modules -------------
    // "combine_mod1"           -> Combine: Bar to Equation
    // "combine_mod2"           -> Combine: Word to Bar
    // "combine_mod3"           -> Combine: Full 3-Tab Solve

    // "change_mod1"            -> Change: Bar to Equation
    // "change_mod2"            -> Change: Word to Bar
    // "change_mod3"            -> Change: Full 3-Tab Solve

    const testStage = "change_mod1"; // CHANGE THIS TO JUMP

    // 3. Create the test user with ONLY that stage active
    const testUser = new User({
      username: "student1",
      password: "password123",
      role: "student",
      streak: 0,
      avatar: "beam",

      // Forces this specific node to be the ONLY one the student sees
      zpdNodes: [testStage],

      mastery: {
        [testStage]: {
          status: "unlocked",
          successCount: 0,
          attemptCount: 0,
          lastAttempts: [],
        },
      },
    });

    await testUser.save();
    console.log(
      `🚀 TEST READY: 'student1' is jumped directly to [${testStage}]`,
    );

    // 4. Create Teacher
    const teacherUser = new User({
      username: "teacher1",
      password: "password123",
      role: "teacher",
      mastery: {},
      zpdNodes: [],
      avatar: "pixel",
      streak: 0,
    });
    await teacherUser.save();
    console.log("👨‍🏫 Teacher account created.");
    console.log("-----------------------------------------");
  } catch (error) {
    console.error("Seeding Error:", error);
  }
};

module.exports = seedData;
