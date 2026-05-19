const normalizeString = (value) =>
  String(value === undefined || value === null ? "" : value)
    .trim()
    .toLowerCase();

export const isCompareAnswerInputQuestion = (question) =>
  question?.moduleStage === "schema_bar_model" &&
  question?.schemaKind === "compare" &&
  question?.barModelSpec?.compareVariant === "fewer_than_gap";

export const isVariableIdentificationQuestion = (question) =>
  question?.interactionMode === "variable_identification" ||
  question?.moduleStage === "schema_variables";

export const getEditableEquationItems = (question) =>
  (question?.equationSpec?.template || []).filter(
    (item) => item.type === "slot" && item.editable !== false,
  );

export const getEquationSlotItems = (question) =>
  (question?.equationSpec?.template || []).filter(
    (item) => item.type === "slot" && item.key,
  );

export const isEquationBuilderStage = (question) =>
  ["bar_to_equation", "schema_equation"].includes(question?.moduleStage);

export const getEditableBarKeys = (question) =>
  question?.barModelSpec?.editableKeys || [];

const hasOwn = (object, key) =>
  Object.prototype.hasOwnProperty.call(object || {}, key);

const getBarModelBoxes = (question) => {
  const spec = question?.barModelSpec || {};
  const boxes = [
    spec.total,
    spec.left,
    spec.right,
    spec.start,
    spec.change,
    spec.end,
    spec.result,
    spec.bigger,
    spec.smaller,
    spec.difference,
  ].filter(Boolean);

  return Array.from(new Map(boxes.map((box) => [box.key, box])).values());
};

const getExpectedBarValue = (question, box) => {
  if (!box?.key) return "";

  if (hasOwn(question?.validation?.slots, box.key)) {
    return String(question.validation.slots[box.key] ?? "").trim();
  }

  return String(box.value ?? "").trim();
};

const getCalculatedBarValue = (question, key) => {
  if (hasOwn(question?.validation?.alternateSlots, key)) {
    const value = String(question.validation.alternateSlots[key] ?? "").trim();
    return value && value !== "?" ? value : "";
  }

  return "";
};

const isUnknownValue = (value) => value === "" || value === "?";

export const evaluateBarModelStageResponse = (question, response = {}) => {
  const slots = response?.slots || {};
  const feedback = {};
  const canonicalSlots = {};
  let isCorrect = true;

  getBarModelBoxes(question).forEach((box) => {
    const key = box.key;
    const student = String(slots[key] || "").trim();
    const expected = getExpectedBarValue(question, box);
    const calculated = getCalculatedBarValue(question, key);
    const isUnknown = isUnknownValue(expected);

    let isSlotCorrect;

    if (isUnknown) {
      isSlotCorrect =
        student === "" ||
        student === "?" ||
        (calculated !== "" && normalizeString(student) === normalizeString(calculated));
      canonicalSlots[key] = student === "" ? "?" : student;
    } else {
      isSlotCorrect = normalizeString(student) === normalizeString(expected);
      canonicalSlots[key] = student;
    }

    if (!isSlotCorrect) {
      isCorrect = false;
    }

    feedback[key] = { isCorrect: isSlotCorrect };
  });

  return {
    isCorrect,
    feedback,
    canonicalSlots,
  };
};

const getTemplateSlotValue = (question, key) => {
  const item = getEquationSlotItems(question).find((slot) => slot.key === key);
  return String(
    item?.value ?? question?.equationSpec?.values?.[key] ?? "",
  ).trim();
};

const getExpectedEquationSlotValue = (question, key) => {
  if (hasOwn(question?.validation?.slots, key)) {
    return String(question.validation.slots[key] ?? "").trim();
  }

  return getTemplateSlotValue(question, key);
};

const getCalculatedEquationSlotValue = (question, key) => {
  if (hasOwn(question?.validation?.alternateSlots, key)) {
    const value = String(question.validation.alternateSlots[key] ?? "").trim();
    return value && value !== "?" ? value : "";
  }

  return "";
};

const isUnknownEquationSlot = isUnknownValue;

export const evaluateEquationStageResponse = (question, response = {}) => {
  const slots = response?.slots || {};
  const slotItems = getEquationSlotItems(question);
  const feedback = {};
  const canonicalSlots = {};
  const isCombine = question?.schemaKind?.toLowerCase() === "combine";

  let isCorrect = true;
  let combinePartsSwapped = false;

  if (isCombine && slotItems.length >= 2) {
    const leftKey = slotItems[0].key;
    const rightKey = slotItems[1].key;
    const leftStudent = String(slots[leftKey] || "").trim();
    const rightStudent = String(slots[rightKey] || "").trim();
    const leftExpected = getExpectedEquationSlotValue(question, leftKey);
    const rightExpected = getExpectedEquationSlotValue(question, rightKey);

    combinePartsSwapped =
      leftStudent !== "" &&
      rightStudent !== "" &&
      leftStudent === rightExpected &&
      rightStudent === leftExpected &&
      !isUnknownEquationSlot(leftExpected) &&
      !isUnknownEquationSlot(rightExpected);
  }

  slotItems.forEach((item, index) => {
    const key = item.key;
    const student = String(slots[key] || "").trim();
    const expected = getExpectedEquationSlotValue(question, key);
    const calculated = getCalculatedEquationSlotValue(question, key);
    const isUnknown = isUnknownEquationSlot(expected);

    let isSlotCorrect;

    if (isUnknown) {
      isSlotCorrect =
        student === "" ||
        student === "?" ||
        (calculated !== "" && normalizeString(student) === normalizeString(calculated));
      canonicalSlots[key] = student === "" ? "?" : student;
    } else if (combinePartsSwapped && (index === 0 || index === 1)) {
      isSlotCorrect = true;
      canonicalSlots[key] = expected;
    } else {
      isSlotCorrect = normalizeString(student) === normalizeString(expected);
      canonicalSlots[key] = student;
    }

    if (!isSlotCorrect) {
      isCorrect = false;
    }

    feedback[key] = { isCorrect: isSlotCorrect };
  });

  const expectedOperator =
    question?.validation?.operator || question?.equationSpec?.operator || "";
  let operatorFeedback = null;

  if (expectedOperator && question?.schemaKind !== "combine") {
    const isOperatorCorrect =
      normalizeString(response?.operator) === normalizeString(expectedOperator);

    if (!isOperatorCorrect) {
      isCorrect = false;
    }

    operatorFeedback = { isCorrect: isOperatorCorrect };
  }

  return {
    isCorrect,
    feedback,
    operatorFeedback,
    canonicalSlots,
  };
};

export const buildEquationString = (question, response = {}) =>
  (question?.equationSpec?.template || [])
    .map((item) => {
      if (item.type === "symbol") {
        return item.value;
      }

      if (item.type === "operator") {
        return response?.operator || item.value || "?";
      }

      const value =
        response?.slots?.[item.key] ??
        item.value ??
        question?.equationSpec?.values?.[item.key] ??
        "";

      return String(value).trim() || "?";
    })
    .join(" ");

export const createInitialResponse = (question) => {
  if (!question?.inputMode && question?.type === "direct") {
    return "";
  }

  const inputMode = question?.inputMode || "text_answer";

  if (isCompareAnswerInputQuestion(question)) {
    return {
      slots: {},
      activeField: null,
      operator: "",
      textAnswer: "",
    };
  }

  if (isVariableIdentificationQuestion(question)) {
    return {
      variables: Object.fromEntries(
        (question?.visualData?.variables || []).map((variable) => [
          variable.key,
          {
            role: "",
            value: "",
          },
        ]),
      ),
      activeField: null,
      operator: "",
      textAnswer: "",
    };
  }

  if (inputMode === "keypad_single_blank") {
    return {
      slots: { answer: "" },
      activeField: "answer",
      operator: question?.equationSpec?.operator || "",
      textAnswer: "",
    };
  }

  if (inputMode === "keypad_equation") {
    const editableSlots = getEditableEquationItems(question);
    return {
      slots: Object.fromEntries(editableSlots.map((item) => [item.key, ""])),
      activeField: editableSlots[0]?.key || "__operator__",
      operator: question?.equationSpec?.operatorEditable
        ? ""
        : question?.equationSpec?.operator || "",
      textAnswer: "",
    };
  }

  if (inputMode === "keypad_bar_model") {
    const editableKeys = getEditableBarKeys(question);
    return {
      slots: Object.fromEntries(editableKeys.map((key) => [key, ""])),
      activeField: editableKeys[0] || null,
      operator: "",
      textAnswer: "",
    };
  }

  return {
    slots: {},
    activeField: null,
    operator: "",
    textAnswer: "",
  };
};

export const isQuestionResponseReady = (question, response) => {
  const inputMode = question?.inputMode || "text_answer";

  if (isCompareAnswerInputQuestion(question)) {
    return normalizeString(response?.textAnswer) !== "";
  }

  if (isVariableIdentificationQuestion(question)) {
    const variables = question?.visualData?.variables || [];
    return variables.every((variable) => {
      const answer = response?.variables?.[variable.key] || {};
      // Every variable must have a role selected
      if (!answer.role) return false;
      // "given" variables must also have a value entered
      if (answer.role === "given") {
        return normalizeString(answer.value) !== "";
      }
      // "find" variables only need the role
      return true;
    });
  }

  if (inputMode === "keypad_single_blank") {
    return normalizeString(response?.slots?.answer) !== "";
  }

  if (inputMode === "keypad_equation") {
    const equationReady = getEditableEquationItems(question).every(
      (item) => normalizeString(response?.slots?.[item.key]) !== "",
    );

    if (question?.equationSpec?.operatorEditable) {
      return equationReady && normalizeString(response?.operator) !== "";
    }

    return equationReady;
  }

  if (inputMode === "keypad_bar_model") {
    return getEditableBarKeys(question).every(
      (key) => normalizeString(response?.slots?.[key]) !== "",
    );
  }

  return normalizeString(response?.textAnswer) !== "";
};

export const getDisplayedTextAnswer = (response) => response?.textAnswer || "";

export const getSlotDisplayValue = (response, key) =>
  String(response?.slots?.[key] || "").trim();

export const getEquationFixedValue = (item) =>
  String(item?.value === undefined || item?.value === null ? "" : item.value);

export const getBarValue = (response, box) =>
  String(response?.slots?.[box?.key] || box?.value || "").trim();

export const buildSubmissionResponse = (question, response) => {
  if (!question?.inputMode && typeof response === "string") {
    return response;
  }

  const inputMode = question?.inputMode || "text_answer";

  if (isCompareAnswerInputQuestion(question)) {
    return {
      slots: {
        ...(question?.validation?.slots || {}),
        [question?.unknownSlot || "smaller"]: response?.textAnswer || "",
      },
    };
  }

  if (isVariableIdentificationQuestion(question)) {
    return {
      variables: { ...(response?.variables || {}) },
    };
  }

  if (inputMode === "text_answer") {
    return {
      textAnswer: response?.textAnswer || "",
    };
  }

  if (inputMode === "keypad_single_blank") {
    const answer = response?.slots?.answer || "";
    return {
      textAnswer: answer,
      slots: {
        answer,
      },
    };
  }

  if (inputMode === "keypad_bar_model") {
    return {
      slots: { ...(response?.slots || {}) },
    };
  }

  return {
    slots: { ...(response?.slots || {}) },
    operator: response?.operator || "",
  };
};
