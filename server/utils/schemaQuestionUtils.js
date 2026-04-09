const QUESTION_TYPES = Object.freeze([
  "direct",
  "distractor",
  "comparison_trap",
  "algebraic",
  "conceptual",
  "visual",
  "icons_items",
  "equation_builder",
  "bar_model_builder",
  "full_model",
]);

const SCHEMA_KINDS = Object.freeze([
  "practice",
  "missing_part",
  "combine",
  "change",
  "compare",
]);

const INTERACTION_MODES = Object.freeze([
  "direct_answer",
  "equation_builder",
  "bar_model_builder",
  "full_model",
]);

const MODULE_STAGES = Object.freeze([
  "practice",
  "equations",
  "bar_to_equation",
  "schema_bar_model",
  "schema_equation",
  "schema_solve",
]);

const INPUT_MODES = Object.freeze([
  "keypad_single_blank",
  "keypad_equation",
  "keypad_bar_model",
  "text_answer",
]);

const normalizeString = (value) =>
  String(value === undefined || value === null ? "" : value)
    .trim()
    .toLowerCase();

const parseNumericMagnitude = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).replace(/,/g, "").trim();
  if (!normalized || normalized === "?") {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const stableSerialize = (value) => {
  if (value === undefined) {
    return "";
  }

  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value.map((item) => JSON.parse(stableSerialize(item))));
  }

  const sorted = {};
  for (const key of Object.keys(value).sort()) {
    const raw = value[key];
    if (raw === undefined) {
      continue;
    }

    sorted[key] =
      raw && typeof raw === "object" ? JSON.parse(stableSerialize(raw)) : raw;
  }

  return JSON.stringify(sorted);
};

const serializeResponse = (response) => {
  if (typeof response === "string") {
    return response;
  }

  return stableSerialize(response);
};

const getResponseText = (response) => {
  if (typeof response === "string") {
    return response;
  }

  if (response && typeof response === "object") {
    return response.textAnswer ?? response?.slots?.answer ?? "";
  }

  return "";
};

const buildEquationString = (equationSpec, response = {}) => {
  if (!equationSpec?.template) {
    return "";
  }

  return equationSpec.template
    .map((item) => {
      if (item.type === "symbol") {
        return item.value;
      }

      if (item.type === "operator") {
        return response?.operator ?? item.value ?? "?";
      }

      const slotValue =
        response?.slots?.[item.key] ??
        item.value ??
        equationSpec.values?.[item.key] ??
        "";

      return String(slotValue).trim() || "?";
    })
    .join(" ");
};

const getEditableSlotValues = (equationSpec) => {
  const expected = {};

  for (const item of equationSpec?.template || []) {
    if (item.type !== "slot" || item.editable === false) {
      continue;
    }

    expected[item.key] = String(
      item.value ?? equationSpec?.values?.[item.key] ?? "",
    ).trim();
  }

  return expected;
};

const compareSlotMap = (
  expectedSlots = {},
  actualSlots = {},
  alternateSlots = {},
) =>
  Object.entries(expectedSlots).every(([key, value]) => {
    const actualValue = normalizeString(actualSlots?.[key]);
    const expectedValue = normalizeString(value);
    const alternateValue = normalizeString(alternateSlots?.[key]);

    if (actualValue === expectedValue) {
      return true;
    }

    return expectedValue === "?" && alternateValue && actualValue === alternateValue;
  });

const validateDirectAnswer = (question, response) => {
  const expectedAnswers = question?.validation?.acceptableAnswers || [
    question?.correctAnswer,
  ];
  const normalizedResponse = normalizeString(getResponseText(response));

  return expectedAnswers.some(
    (answer) => normalizeString(answer) === normalizedResponse,
  );
};

const validateEquationBuilder = (question, response) => {
  const expectedSlots =
    question?.validation?.slots || getEditableSlotValues(question?.equationSpec);
  const alternateSlots = question?.validation?.alternateSlots || {};
  const actualSlots = response?.slots || {};

  if (!compareSlotMap(expectedSlots, actualSlots, alternateSlots)) {
    return false;
  }

  if (question?.validation?.operator) {
    if (
      normalizeString(response?.operator) !==
      normalizeString(question.validation.operator)
    ) {
      return false;
    }
  }

  const acceptableEquations = (
    question?.validation?.equations || [question?.validation?.equation]
  ).filter(Boolean);

  if (!acceptableEquations.length) {
    return true;
  }

  const actualEquation = normalizeString(
    buildEquationString(question?.equationSpec, response),
  );

  return acceptableEquations.some(
    (equation) => actualEquation === normalizeString(equation),
  );
};

const validateBarModelBuilder = (question, response) =>
  compareSlotMap(
    question?.validation?.slots || {},
    response?.slots || {},
    question?.validation?.alternateSlots || {},
  );

const validateFullModel = (question, response) => {
  if (
    question?.validation?.slots &&
    !compareSlotMap(question.validation.slots, response?.slots || {})
  ) {
    return false;
  }

  if (question?.validation?.operator) {
    if (
      normalizeString(response?.operator) !==
      normalizeString(question.validation.operator)
    ) {
      return false;
    }
  }

  return (
    normalizeString(response?.textAnswer) ===
    normalizeString(question?.validation?.finalAnswer)
  );
};

const validateQuestionResponse = (question, response) => {
  const mode = question?.interactionMode || "direct_answer";

  if (mode === "equation_builder") {
    return validateEquationBuilder(question, response);
  }

  if (mode === "bar_model_builder") {
    return validateBarModelBuilder(question, response);
  }

  if (mode === "full_model") {
    return validateFullModel(question, response);
  }

  return validateDirectAnswer(question, response);
};

const createEquationTemplate = ({
  operator,
  left,
  right,
  result,
  editableKeys = [],
  operatorEditable = false,
}) => [
  {
    type: "slot",
    key: left.key,
    label: left.label,
    role: left.role || null,
    value: left.value,
    editable: editableKeys.includes(left.key),
  },
  {
    type: operatorEditable ? "operator" : "symbol",
    key: "operator",
    label: "Operator",
    value: operator,
    editable: operatorEditable,
  },
  {
    type: "slot",
    key: right.key,
    label: right.label,
    role: right.role || null,
    value: right.value,
    editable: editableKeys.includes(right.key),
  },
  { type: "symbol", value: "=" },
  {
    type: "slot",
    key: result.key,
    label: result.label,
    role: result.role || null,
    value: result.value,
    editable: editableKeys.includes(result.key),
  },
];

const createBox = ({
  key,
  label,
  value,
  magnitude,
  role = null,
  color = "cream",
  editable = false,
  accent = null,
}) => ({
  key,
  label,
  value: String(value),
  magnitude: parseNumericMagnitude(magnitude ?? value),
  role,
  color,
  editable,
  accent,
});

const createBarModelSpec = ({
  schemaKind,
  unknownSlot,
  values,
  scaleValues = values,
  labels,
  editableKeys = [],
  roleLabels = {},
  valueLabels = {},
  participants = null,
  comparisonWording = null,
  equationForm = null,
  compareVariant = null,
  alignmentMode = null,
  barDecorations = {},
}) => {
  if (schemaKind === "compare") {
    const variant =
      unknownSlot === "bigger"
        ? "compare_bigger"
        : unknownSlot === "difference"
          ? "compare_difference"
          : unknownSlot === "smaller"
            ? "compare_smaller"
            : "compare_complete";
    const resolvedCompareVariant =
      compareVariant ||
      (comparisonWording === "fewer than" && unknownSlot === "smaller"
        ? "fewer_than_gap"
        : "stacked_segments");
    const resolvedAlignmentMode = alignmentMode || "fixed_track";

    if (variant === "compare_smaller") {
      return {
        layout: "compare_offset",
        variant,
        compareVariant: resolvedCompareVariant,
        alignmentMode: resolvedAlignmentMode,
        editableKeys,
        bigger: createBox({
          key: "bigger",
          label: labels.bigger,
          value: values.bigger,
          magnitude: scaleValues.bigger,
          role: "bigger",
          color: "purple",
          editable: editableKeys.includes("bigger"),
        }),
        smaller: createBox({
          key: "smaller",
          label: labels.smaller,
          value: values.smaller,
          magnitude: scaleValues.smaller,
          role: "smaller",
          color: "blue",
          editable: editableKeys.includes("smaller"),
          accent: "unknown",
        }),
        difference: createBox({
          key: "difference",
          label: labels.difference,
          value: values.difference,
          magnitude: scaleValues.difference,
          role: "difference",
          color: "orange",
          editable: editableKeys.includes("difference"),
        }),
        roleLabels: {
          bigger: roleLabels.bigger || labels.bigger,
          smaller: roleLabels.smaller || labels.smaller,
          difference: roleLabels.difference || labels.difference,
        },
        valueLabels,
        participants,
        comparisonWording,
        equationForm,
        barDecorations: {
          showBracket: Boolean(barDecorations.showBracket),
          bracketLabel: barDecorations.bracketLabel || "?",
        },
        bracket: barDecorations.showBracket
          ? {
              label: barDecorations.bracketLabel || "?",
              targetKey: "smaller",
            }
          : null,
      };
    }

    if (variant === "compare_bigger") {
      return {
        layout: "compare_offset",
        variant,
        compareVariant: resolvedCompareVariant,
        alignmentMode: resolvedAlignmentMode,
        editableKeys,
        bigger: createBox({
          key: "bigger",
          label: labels.bigger,
          value: values.bigger,
          magnitude: scaleValues.bigger,
          role: "bigger",
          color: "purple",
          editable: editableKeys.includes("bigger"),
          accent: "unknown",
        }),
        smaller: createBox({
          key: "smaller",
          label: labels.smaller,
          value: values.smaller,
          magnitude: scaleValues.smaller,
          role: "smaller",
          color: "blue",
          editable: editableKeys.includes("smaller"),
        }),
        difference: createBox({
          key: "difference",
          label: labels.difference,
          value: values.difference,
          magnitude: scaleValues.difference,
          role: "difference",
          color: "orange",
          editable: editableKeys.includes("difference"),
        }),
        roleLabels: {
          bigger: roleLabels.bigger || labels.bigger,
          smaller: roleLabels.smaller || labels.smaller,
          difference: roleLabels.difference || labels.difference,
        },
        valueLabels,
        participants,
        comparisonWording,
        equationForm,
        barDecorations: {
          showBracket: Boolean(barDecorations.showBracket),
          bracketLabel: barDecorations.bracketLabel || "?",
        },
        bracket: null,
      };
    }

    return {
      layout: "compare_offset",
      variant,
      compareVariant: resolvedCompareVariant,
      alignmentMode: resolvedAlignmentMode,
      editableKeys,
      bigger: createBox({
        key: "bigger",
        label: labels.bigger,
        value: values.bigger,
        magnitude: scaleValues.bigger,
        role: "bigger",
        color: "purple",
        editable: editableKeys.includes("bigger"),
      }),
      smaller: createBox({
        key: "smaller",
        label: labels.smaller,
        value: values.smaller,
        magnitude: scaleValues.smaller,
        role: "smaller",
        color: "blue",
        editable: editableKeys.includes("smaller"),
      }),
      difference: createBox({
        key: "difference",
        label: labels.difference,
        value: values.difference,
        magnitude: scaleValues.difference,
        role: "difference",
        color: "orange",
        editable: editableKeys.includes("difference"),
        accent: unknownSlot === "difference" ? "unknown" : null,
      }),
      roleLabels: {
        bigger: roleLabels.bigger || labels.bigger,
        smaller: roleLabels.smaller || labels.smaller,
        difference: roleLabels.difference || labels.difference,
      },
      valueLabels,
      participants,
      comparisonWording,
      equationForm,
      barDecorations: {
        showBracket: Boolean(barDecorations.showBracket),
        bracketLabel: barDecorations.bracketLabel || "?",
      },
      bracket: barDecorations.showBracket
        ? {
            label: barDecorations.bracketLabel || "?",
            targetKey: unknownSlot === "difference" ? "difference" : unknownSlot,
          }
        : null,
    };
  }

  const totalKey = schemaKind === "change" ? "end" : "total";
  const leftKey = schemaKind === "change" ? "start" : "partA";
  const rightKey = schemaKind === "change" ? "change" : "partB";

  return {
    layout: "total_parts",
    variant: schemaKind,
    editableKeys,
    total: createBox({
      key: totalKey,
      label: labels[totalKey],
      value: values[totalKey],
      magnitude: scaleValues[totalKey],
      role: totalKey,
      color: "green",
      editable: editableKeys.includes(totalKey),
      accent: unknownSlot === totalKey ? "unknown" : null,
    }),
    left: createBox({
      key: leftKey,
      label: labels[leftKey],
      value: values[leftKey],
      magnitude: scaleValues[leftKey],
      role: leftKey,
      color: "blue",
      editable: editableKeys.includes(leftKey),
      accent: unknownSlot === leftKey ? "unknown" : null,
    }),
    right: createBox({
      key: rightKey,
      label: labels[rightKey],
      value: values[rightKey],
      magnitude: scaleValues[rightKey],
      role: rightKey,
      color: "orange",
      editable: editableKeys.includes(rightKey),
      accent: unknownSlot === rightKey ? "unknown" : null,
    }),
    roleLabels: {
      [totalKey]: roleLabels[totalKey] || labels[totalKey],
      [leftKey]: roleLabels[leftKey] || labels[leftKey],
      [rightKey]: roleLabels[rightKey] || labels[rightKey],
    },
  };
};

const createQuestionEnvelope = ({
  text,
  concept,
  type = "direct",
  difficulty = 1,
  correctAnswer,
  explanation,
  schemaKind = "practice",
  interactionMode = "direct_answer",
  unknownSlot = null,
  options,
  operands,
  equationSpec,
  barModelSpec,
  validation,
  moduleStage = "practice",
  practiceMode = null,
  promptTitle = "",
  inputMode = "text_answer",
  stageIndex = null,
  stageLabel = "",
  stageTotal = null,
  helperText = "",
}) => ({
  text,
  correctAnswer: String(correctAnswer),
  concept,
  type,
  difficulty,
  options,
  operands,
  explanation,
  schemaKind,
  interactionMode,
  unknownSlot,
  equationSpec,
  barModelSpec,
  validation,
  moduleStage,
  practiceMode,
  promptTitle,
  inputMode,
  stageIndex,
  stageLabel,
  stageTotal,
  helperText,
});

module.exports = {
  QUESTION_TYPES,
  SCHEMA_KINDS,
  INTERACTION_MODES,
  MODULE_STAGES,
  INPUT_MODES,
  buildEquationString,
  createBarModelSpec,
  createEquationTemplate,
  createQuestionEnvelope,
  serializeResponse,
  validateQuestionResponse,
};
