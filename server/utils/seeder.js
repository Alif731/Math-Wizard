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
    schemaKind: "missing_part",
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
        Object.entries(barValues).find(([, value]) => value === "?")?.[0] || null,
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
}) => {
  const equationSpec = {
    operator,
    operatorEditable: true,
    template: createEquationTemplate({
      operator,
      left: {
        key: "leftTerm",
        label: labels.left,
        role: schemaKind === "compare" ? "smaller" : schemaKind === "change" ? "start" : "partA",
        value: equationValues.leftTerm,
      },
      right: {
        key: "rightTerm",
        label: labels.right,
        role: schemaKind === "compare" ? "difference" : schemaKind === "change" ? "change" : "partB",
        value: equationValues.rightTerm,
      },
      result: {
        key: "result",
        label: labels.result,
        role: schemaKind === "compare" ? "bigger" : schemaKind === "change" ? "end" : "total",
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
    barModelSpec: createBarModelSpec({
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
  {
    id: "equations_from_bar_models",
    title: "Bar to Equation",
    description: "Turn bar models into equations.",
    prerequisites: ["missing_part_equations"],
    questions: [
      createEquationFromBarQuestion({
        concept: "equations_from_bar_models",
        text: "Build the equation from the bar model.",
        schemaKind: "combine",
        barValues: {
          partA: "4",
          partB: "3",
          total: "7",
        },
        scaleValues: {
          partA: 4,
          partB: 3,
          total: 7,
        },
        labels: {
          total: "total",
          partA: "start",
          partB: "added",
          left: "start",
          right: "added",
          result: "total",
        },
        equationDisplayValues: {
          leftTerm: "4",
          rightTerm: "3",
          result: "7",
        },
        validationSlots: {
          leftTerm: "4",
          rightTerm: "3",
          result: "7",
        },
        alternateSlots: {
          leftTerm: "4",
          rightTerm: "3",
          result: "7",
        },
        operator: "+",
        difficulty: 2,
      }),
      createEquationFromBarQuestion({
        concept: "equations_from_bar_models",
        text: "Build the equation from the bar model.",
        schemaKind: "change",
        barValues: {
          start: "?",
          change: "4",
          end: "10",
        },
        scaleValues: {
          start: 6,
          change: 4,
          end: 10,
        },
        labels: {
          end: "total",
          start: "start",
          change: "added",
          left: "start",
          right: "added",
          result: "total",
        },
        equationDisplayValues: {
          leftTerm: "?",
          rightTerm: "4",
          result: "10",
        },
        validationSlots: {
          leftTerm: "?",
          rightTerm: "4",
          result: "10",
        },
        alternateSlots: {
          leftTerm: "6",
          rightTerm: "4",
          result: "10",
        },
        operator: "+",
        difficulty: 2,
      }),
      createEquationFromBarQuestion({
        concept: "equations_from_bar_models",
        text: "Build the equation from the bar model.",
        schemaKind: "compare",
        barValues: {
          bigger: "12",
          smaller: "8",
          difference: "4",
        },
        scaleValues: {
          bigger: 12,
          smaller: 8,
          difference: 4,
        },
        labels: {
          bigger: "big number",
          smaller: "small number",
          difference: "extra",
          left: "small number",
          right: "extra",
          result: "big number",
        },
        roleLabels: {
          bigger: "big number",
          smaller: "small number",
          difference: "extra",
        },
        equationDisplayValues: {
          leftTerm: "8",
          rightTerm: "4",
          result: "12",
        },
        validationSlots: {
          leftTerm: "8",
          rightTerm: "4",
          result: "12",
        },
        alternateSlots: {
          leftTerm: "8",
          rightTerm: "4",
          result: "12",
        },
        comparisonWording: "more than",
        equationForm: "smaller_plus_difference_equals_bigger",
        operator: "+",
        difficulty: 3,
      }),
    ],
  },
  {
    id: "schema_combine",
    title: "Combine",
    description: "Build the bar model, write the equation, and solve.",
    prerequisites: ["equations_from_bar_models"],
    questions: [
      createSchemaBarQuestion({
        concept: "schema_combine",
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
      createSchemaEquationQuestion({
        concept: "schema_combine",
        text: "Mia has 6 red and 4 blue marbles. How many altogether?",
        schemaKind: "combine",
        values: { partA: "6", partB: "4", total: "?" },
        scaleValues: { partA: 6, partB: 4, total: 10 },
        labels: {
          total: "total",
          partA: "red",
          partB: "blue",
          left: "red",
          right: "blue",
          result: "total",
        },
        unknownSlot: "total",
        equationValues: { leftTerm: "6", rightTerm: "4", result: "?" },
        validationSlots: { leftTerm: "6", rightTerm: "4", result: "?" },
        alternateSlots: { leftTerm: "6", rightTerm: "4", result: "10" },
        operator: "+",
        difficulty: 2,
      }),
      createSchemaSolveQuestion({
        concept: "schema_combine",
        text: "Mia has 6 red and 4 blue marbles. How many altogether?",
        schemaKind: "combine",
        answer: 10,
        displayEquation: "6 + 4 = ?",
        verificationEquation: "6 + 4 = 10",
        solutionLabel: "? = 10",
        difficulty: 2,
      }),
    ],
  },
  {
    id: "schema_change",
    title: "Change",
    description: "Use the change model in three steps.",
    prerequisites: ["schema_combine"],
    questions: [
      createSchemaBarQuestion({
        concept: "schema_change",
        text: "Mia had some stickers. She got 4 more and now has 10.",
        schemaKind: "change",
        values: { start: 6, change: 4, end: 10 },
        labels: { end: "total", start: "start", change: "added" },
        displayValues: { start: "?", change: "?", end: "?" },
        validationSlots: { end: "10", start: "?", change: "4" },
        alternateSlots: { end: "10", start: "6", change: "4" },
        unknownSlot: "start",
        difficulty: 3,
      }),
      createSchemaEquationQuestion({
        concept: "schema_change",
        text: "Mia had some stickers. She got 4 more and now has 10.",
        schemaKind: "change",
        values: { start: "?", change: "4", end: "10" },
        scaleValues: { start: 6, change: 4, end: 10 },
        labels: {
          end: "total",
          start: "start",
          change: "added",
          left: "start",
          right: "added",
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
        concept: "schema_change",
        text: "Mia had some stickers. She got 4 more and now has 10.",
        schemaKind: "change",
        answer: 6,
        displayEquation: "? + 4 = 10",
        verificationEquation: "6 + 4 = 10",
        solutionLabel: "? = 6",
        difficulty: 3,
      }),
    ],
  },
  {
    id: "schema_compare",
    title: "Compare",
    description: "Use compare bars to reason and solve.",
    prerequisites: ["schema_change"],
    questions: [
      createSchemaBarQuestion({
        concept: "schema_compare",
        text: "Darnell has 234 fewer marbles than Delilah. Delilah has 362 marbles. How many marbles does Darnell have?",
        schemaKind: "compare",
        values: { bigger: 362, smaller: 128, difference: 234 },
        labels: {
          bigger: "Delilah's marbles",
          smaller: "Darnell's marbles",
          difference: "fewer marbles",
        },
        roleLabels: {
          bigger: "Delilah's marbles",
          smaller: "Darnell's marbles",
          difference: "fewer marbles",
        },
        valueLabels: {
          difference: "234",
        },
        displayValues: { bigger: "?", smaller: "?", difference: "?" },
        validationSlots: { bigger: "362", smaller: "?", difference: "234" },
        alternateSlots: { bigger: "362", smaller: "128", difference: "234" },
        unknownSlot: "smaller",
        participants: {
          biggerOwner: "Delilah",
          smallerOwner: "Darnell",
        },
        comparisonWording: "fewer than",
        equationForm: "smaller_plus_difference_equals_bigger",
        compareVariant: "fewer_than_gap",
        alignmentMode: "fixed_track",
        barDecorations: {
          showBracket: true,
          bracketLabel: "?",
        },
        difficulty: 4,
      }),
      createSchemaEquationQuestion({
        concept: "schema_compare",
        text: "Darnell has 234 fewer marbles than Delilah. Delilah has 362 marbles. How many marbles does Darnell have?",
        schemaKind: "compare",
        values: { bigger: "362", smaller: "?", difference: "234" },
        displayBarValues: {
          bigger: "362",
          smaller: "?",
          difference: "234",
        },
        scaleValues: { bigger: 362, smaller: 128, difference: 234 },
        labels: {
          bigger: "Delilah's marbles",
          smaller: "Darnell's marbles",
          difference: "fewer marbles",
          left: "Darnell's marbles",
          right: "fewer marbles",
          result: "Delilah's marbles",
        },
        roleLabels: {
          bigger: "Delilah's marbles",
          smaller: "Darnell's marbles",
          difference: "fewer marbles",
        },
        valueLabels: {
          difference: "234",
        },
        unknownSlot: "smaller",
        equationValues: { leftTerm: "?", rightTerm: "234", result: "362" },
        validationSlots: { leftTerm: "?", rightTerm: "234", result: "362" },
        alternateSlots: { leftTerm: "128", rightTerm: "234", result: "362" },
        participants: {
          biggerOwner: "Delilah",
          smallerOwner: "Darnell",
        },
        comparisonWording: "fewer than",
        equationForm: "smaller_plus_difference_equals_bigger",
        compareVariant: "fewer_than_gap",
        alignmentMode: "fixed_track",
        barDecorations: {
          showBracket: true,
          bracketLabel: "?",
        },
        operator: "+",
        difficulty: 4,
      }),
      createSchemaSolveQuestion({
        concept: "schema_compare",
        text: "Darnell has 234 fewer marbles than Delilah. Delilah has 362 marbles. How many marbles does Darnell have?",
        schemaKind: "compare",
        answer: 128,
        displayEquation: "? + 234 = 362",
        verificationEquation: "128 + 234 = 362",
        solutionLabel: "? = 128",
        difficulty: 4,
      }),
    ],
  },
];

const seedData = async () => {
  try {
    await Concept.deleteMany({});
    await User.deleteMany({});
    await Attempt.deleteMany({});
    await TeacherSignupCode.deleteMany({});
    console.log("Database Wiped Clean");

    await ensureTeacherSignupCode();

    await Concept.insertMany(conceptsData);
    console.log("Concepts Seeded");

    const testUser = new User({
      username: "student1",
      password: "password123",
      role: "student",
      streak: 0,
      zpdNodes: ["single_add"],
      mastery: {
        single_add: {
          status: "unlocked",
          successCount: 0,
          attemptCount: 0,
          lastAttempts: [],
        },
      },
    });

    await testUser.save();
    console.log("Test User (student1) Seeded Successfully");

    const teacherUser = new User({
      username: "teacher1",
      password: "password123",
      role: "teacher",
      mastery: {},
      zpdNodes: [],
      avatar: "beam",
      streak: 0,
    });

    await teacherUser.save();
    console.log("Teacher User Seeded Successfully");
  } catch (error) {
    console.error("Seeding Error:", error);
  }
};

module.exports = seedData;
