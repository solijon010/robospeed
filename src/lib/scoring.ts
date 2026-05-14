export const PENALTY_PER_HIT = 5;
export const MAX_SPEED = 50;
export const MAX_ACCURACY = 20;
export const MAX_TECHNICAL = 15;
export const MAX_DESIGN = 15;

export interface EvalRow {
  id: string;
  participant_id: string;
  time_seconds: number;
  red_line_hits: number;
  technical_score: number;
  design_score: number;
  control_score: number;
}

export function finalTime(timeSeconds: number, hits: number) {
  return Number(timeSeconds) + Number(hits) * PENALTY_PER_HIT;
}

export function accuracyScore(hits: number) {
  return Math.max(0, MAX_ACCURACY - hits * PENALTY_PER_HIT);
}

/** Speed score: best (lowest) final time gets 50; others scaled proportionally. */
export function speedScore(thisFinal: number, bestFinal: number) {
  if (!thisFinal || thisFinal <= 0) return 0;
  if (!bestFinal || bestFinal <= 0) return 0;
  return Math.max(0, Math.min(MAX_SPEED, (bestFinal / thisFinal) * MAX_SPEED));
}

export function totalScore(
  e: Pick<EvalRow, "time_seconds" | "red_line_hits" | "technical_score" | "design_score" | "control_score">,
  bestFinal: number,
) {
  const ft = finalTime(e.time_seconds, e.red_line_hits);
  return (
    speedScore(ft, bestFinal) +
    accuracyScore(e.red_line_hits) +
    Number(e.technical_score || 0) +
    Number(e.design_score || 0)
  );
}

export function fmtTime(s: number) {
  const sec = Number(s) || 0;
  return sec.toFixed(2) + "s";
}
