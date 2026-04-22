import { isCompareAnswerInputQuestion } from "../../../utils/questionValidation";

export const sanitizeLearnerLabel = (label, role) => {
  const raw = String(label || "").trim();
  if (!raw) return raw;

  if (role === "difference") {
    const stripped = raw.replace(/^\d+[\s-]*/u, "").trim();
    if (/^fewer$/i.test(stripped)) return "fewer marbles";
    if (/^more$/i.test(stripped)) return "more marbles";
    return stripped || "difference";
  }
  return raw;
};

export const getRoleKey = (item) => {
  const rawRole = item?.role || item?.label || "";
  return String(rawRole).trim().toLowerCase() || null;
};

export const getLearnerFacingLabel = (question, item) => {
  const role = getRoleKey(item);
  if (!role) return item?.label || "";

  const specRoleLabel = question?.barModelSpec?.roleLabels?.[role];
  if (specRoleLabel) return specRoleLabel;

  const specBoxLabel = question?.barModelSpec?.[role]?.label;
  if (specBoxLabel) return specBoxLabel;

  const equationRoleLabel = question?.equationSpec?.roleLabels?.[role];
  if (equationRoleLabel) return sanitizeLearnerLabel(equationRoleLabel, role);

  return sanitizeLearnerLabel(item?.label || "", role);
};

export const getAdaptiveDifferenceLabel = (
  comparisonWording,
  fallbackLabel,
) => {
  const wording = String(comparisonWording || "")
    .trim()
    .toLowerCase();
  if (wording === "fewer than") return "less";
  if (wording === "more than") return "more";
  return sanitizeLearnerLabel(fallbackLabel, "difference");
};

export const parseBarMagnitude = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).replace(/,/g, "").trim();
  if (!normalized || normalized === "?") return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const getBoxMagnitude = (response, box) => {
  if (typeof box?.magnitude === "number" && Number.isFinite(box.magnitude)) {
    return box.magnitude;
  }
  const responseValue = response?.slots?.[box?.key];
  const responseMagnitude = parseBarMagnitude(responseValue);
  if (responseMagnitude !== null) return responseMagnitude;
  return parseBarMagnitude(box?.value);
};

export const getSegmentPercentages = (
  firstAmount,
  secondAmount,
  totalAmount,
) => {
  const first = Number(firstAmount) || 0;
  const second = Number(secondAmount) || 0;
  const fallbackTotal = first + second;
  const total = Number(totalAmount) || fallbackTotal;

  if (total <= 0) return { first: 50, second: 50 };

  const firstPercent = Math.max(18, (first / total) * 100);
  const secondPercent = Math.max(18, (second / total) * 100);
  const scale = 100 / (firstPercent + secondPercent);

  return { first: firstPercent * scale, second: secondPercent * scale };
};

export const getExactTrackPercentages = (
  firstAmount,
  secondAmount,
  totalAmount,
) => {
  const first = Math.max(0, Number(firstAmount) || 0);
  const second = Math.max(0, Number(secondAmount) || 0);
  const total = Math.max(first + second, Number(totalAmount) || 0);

  if (total <= 0) return { first: 50, second: 50 };
  return { first: (first / total) * 100, second: (second / total) * 100 };
};

export const resolveTotalPartsMagnitudes = (spec, response) => {
  let total = getBoxMagnitude(response, spec.total);
  let left = getBoxMagnitude(response, spec.left);
  let right = getBoxMagnitude(response, spec.right);

  if (total === null && left !== null && right !== null) total = left + right;
  if (left === null && total !== null && right !== null) left = total - right;
  if (right === null && total !== null && left !== null) right = total - left;

  return { total, left, right };
};

export const resolveCompareMagnitudes = (spec, response) => {
  let bigger = getBoxMagnitude(response, spec.bigger);
  let smaller = getBoxMagnitude(response, spec.smaller);
  let difference = getBoxMagnitude(response, spec.difference);

  if (bigger === null && smaller !== null && difference !== null)
    bigger = smaller + difference;
  if (smaller === null && bigger !== null && difference !== null)
    smaller = bigger - difference;
  if (difference === null && bigger !== null && smaller !== null)
    difference = bigger - smaller;

  return { bigger, smaller, difference };
};

export const joinSlotValue = (currentValue, nextValue) => {
  const current = String(currentValue || "");
  if (nextValue === "?") return "?";
  if (current === "?" || current === "0") return String(nextValue);
  return `${current}${nextValue}`.slice(0, 4);
};

export const getBarLabel = (box, spec) => {
  const role = box?.role || box?.key || "";
  const semanticLabel = spec?.roleLabels?.[role] || box?.label || "";

  if (role === "difference") {
    return getAdaptiveDifferenceLabel(spec?.comparisonWording, semanticLabel);
  }
  return sanitizeLearnerLabel(semanticLabel, role);
};

export const getGuidedCompareValue = (question, key, fallbackValue = "?") => {
  const primaryValue = question?.validation?.slots?.[key];
  if (
    String(primaryValue || "").trim() &&
    String(primaryValue).trim() !== "?"
  ) {
    return String(primaryValue).trim();
  }

  const alternateValue = question?.validation?.alternateSlots?.[key];
  if (
    String(alternateValue || "").trim() &&
    String(alternateValue).trim() !== "?"
  ) {
    return String(alternateValue).trim();
  }

  return String(fallbackValue || "?").trim() || "?";
};

export const buildCompareAnswerPrompt = (label) => {
  const raw = String(label || "").trim();
  if (!raw)
    return { prompt: "Your answer", placeholder: "Type the missing amount" };

  const possessiveMatch = raw.match(/^(.+?)'s\s+(.+)$/u);
  if (possessiveMatch) {
    const [, owner, item] = possessiveMatch;
    return {
      prompt: `How many ${item} does ${owner} have?`,
      placeholder: `Type ${owner}'s ${item}`,
    };
  }

  return {
    prompt: `How many ${raw.toLowerCase()}?`,
    placeholder: `Type ${raw.toLowerCase()}`,
  };
};

export const getDefaultActiveField = (question) => {
  if (
    !question ||
    question?.inputMode === "text_answer" ||
    isCompareAnswerInputQuestion(question)
  )
    return null;

  const unknownField = question?.unknownSlot;
  const barSpec = question?.barModelSpec;

  if (barSpec) {
    if (unknownField && barSpec?.[unknownField]?.editable)
      return barSpec[unknownField].key;
    const firstEditableBarField = [
      barSpec.total,
      barSpec.left,
      barSpec.right,
      barSpec.bigger,
      barSpec.smaller,
      barSpec.difference,
    ].find((item) => item?.editable);
    if (firstEditableBarField?.key) return firstEditableBarField.key;
  }

  const equationTemplate = question?.equationSpec?.template || [];
  const firstUnknownEquationField = equationTemplate.find(
    (item) =>
      item?.type !== "symbol" &&
      item?.type !== "operator" &&
      item?.editable !== false &&
      String(item?.value || "").trim() === "?",
  );
  if (firstUnknownEquationField?.key) return firstUnknownEquationField.key;

  const firstEditableEquationField = equationTemplate.find(
    (item) =>
      item?.type !== "symbol" &&
      item?.type !== "operator" &&
      item?.editable !== false,
  );
  if (firstEditableEquationField?.key) return firstEditableEquationField.key;

  return question?.equationSpec?.operatorEditable ? "__operator__" : null;
};

export const getActiveInputLabel = (question, activeField) => {
  if (!question || !activeField) return "";
  if (activeField === "__operator__") return "operator";

  const barSpec = question?.barModelSpec;
  if (barSpec) {
    const barField = [
      barSpec.total,
      barSpec.left,
      barSpec.right,
      barSpec.bigger,
      barSpec.smaller,
      barSpec.difference,
    ].find((item) => item?.key === activeField);
    if (barField) return getBarLabel(barField, barSpec);
  }

  const equationField = (question?.equationSpec?.template || []).find(
    (item) => item?.key === activeField,
  );
  if (equationField) return getLearnerFacingLabel(question, equationField);

  return "";
};
