/** Shared defaults and validation for bracket admin (Round 1 team names, etc.) */

export const DEFAULT_ROUND1_TEAM_NUMBERS = Array.from({ length: 64 }, (_, i) => String(i + 1));

/** Left bracket Round 1 pairings [teamA, teamB, court] – same order as bracket display */
export const LEFT_ROUND1_PAIRINGS: [number, number, number][] = [
  [1, 64, 1], [5, 60, 5], [9, 56, 1], [13, 52, 5], [17, 48, 1], [21, 44, 5], [25, 40, 1], [29, 36, 5],
  [3, 62, 3], [7, 58, 7], [11, 54, 3], [15, 50, 7], [19, 46, 3], [23, 42, 7], [27, 38, 3], [31, 34, 7],
];

/** Right bracket Round 1 pairings [teamA, teamB, court] – same order as bracket display */
export const RIGHT_ROUND1_PAIRINGS: [number, number, number][] = [
  [2, 63, 2], [6, 59, 6], [10, 55, 2], [14, 51, 6], [18, 47, 2], [22, 43, 6], [26, 39, 2], [30, 35, 6],
  [4, 61, 4], [8, 57, 8], [12, 53, 4], [16, 49, 8], [20, 45, 4], [24, 41, 8], [28, 37, 4], [32, 33, 8],
];

export const MAX_ROUND1_TEAM_NUMBER = 64;

export function onlyDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits === "" ? "" : String(Math.min(Number(digits), MAX_ROUND1_TEAM_NUMBER));
}

export function getRound1Validation(numbers: string[]): {
  valid: boolean;
  duplicateSlots: number[];
  nonNumericSlots: number[];
  overMaxSlots: number[];
} {
  const nonNumericSlots: number[] = [];
  const overMaxSlots: number[] = [];
  const valueToSlots: Record<string, number[]> = {};
  numbers.forEach((v, i) => {
    const trimmed = v.trim();
    const slot = i + 1;
    if (trimmed === "" || !/^\d+$/.test(trimmed)) nonNumericSlots.push(slot);
    else {
      const num = Number(trimmed);
      if (num < 1 || num > MAX_ROUND1_TEAM_NUMBER) overMaxSlots.push(slot);
      else {
        valueToSlots[trimmed] = valueToSlots[trimmed] ?? [];
        valueToSlots[trimmed].push(slot);
      }
    }
  });
  const duplicateSlots = Object.values(valueToSlots)
    .filter((slots) => slots.length > 1)
    .flat();
  const valid =
    nonNumericSlots.length === 0 &&
    duplicateSlots.length === 0 &&
    overMaxSlots.length === 0;
  return { valid, duplicateSlots, nonNumericSlots, overMaxSlots };
}
