const normalizeString = (value) =>
  String(value === undefined || value === null ? "" : value)
    .trim()
    .toLowerCase();

export const isCompareAnswerInputQuestion = (question) =>
  question?.moduleStage === "schema_bar_model" &&
  question?.schemaKind === "compare" &&
  question?.barModelSpec?.compareVariant === "fewer_than_gap";

export const getEditableEquationItems = (question) =>
  (question?.equationSpec?.template || []).filter(
    (item) => item.type === "slot" && item.editable !== false,
  );

export const getEditableBarKeys = (question) =>
  question?.barModelSpec?.editableKeys || [];

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

  if (inputMode === "text_answer") {
    return {
      textAnswer: response?.textAnswer || "",
    };
  }

  if (inputMode === "keypad_single_blank") {
    return {
      slots: {
        answer: response?.slots?.answer || "",
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
