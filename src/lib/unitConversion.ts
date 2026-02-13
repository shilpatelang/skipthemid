type UnitSystem = "metric" | "imperial";

const METRIC_TO_IMPERIAL: Record<string, { to: string; factor: number }> = {
  g: { to: "oz", factor: 0.03527 },
  kg: { to: "lb", factor: 2.20462 },
  ml: { to: "fl oz", factor: 0.03381 },
  l: { to: "cups", factor: 4.22675 },
};

export function parseAmount(amount: string): number | null {
  const trimmed = amount.trim();

  // Mixed fraction: "1 1/2"
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    return parseInt(mixedMatch[1]) + parseInt(mixedMatch[2]) / parseInt(mixedMatch[3]);
  }

  // Simple fraction: "1/2"
  const fracMatch = trimmed.match(/^(\d+)\/(\d+)$/);
  if (fracMatch) {
    return parseInt(fracMatch[1]) / parseInt(fracMatch[2]);
  }

  // Plain number: "400", "2.5"
  const num = parseFloat(trimmed);
  return isNaN(num) ? null : num;
}

function formatAmount(value: number): string {
  if (value >= 10) return Math.round(value).toString();
  if (value >= 1) {
    const rounded = Math.round(value * 10) / 10;
    return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
  }
  const rounded = Math.round(value * 100) / 100;
  return rounded.toString();
}

export function scaleAmount(amount: string, ratio: number): string {
  const parsed = parseAmount(amount);
  if (parsed === null) return amount;
  return formatAmount(parsed * ratio);
}

export function convertUnit(
  amount: string,
  unit: string,
  system: UnitSystem,
): { amount: string; unit: string } {
  if (system === "metric") return { amount, unit };

  const normalizedUnit = unit.toLowerCase().trim();
  const conversion = METRIC_TO_IMPERIAL[normalizedUnit];
  if (!conversion) return { amount, unit };

  const parsed = parseAmount(amount);
  if (parsed === null) return { amount, unit };

  return {
    amount: formatAmount(parsed * conversion.factor),
    unit: conversion.to,
  };
}
