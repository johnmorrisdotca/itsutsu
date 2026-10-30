import { decodeLine } from "./code";

/**
 * What Check, Show and Hint read: how the line drawn stands against the answer.
 * The line runs one way from the first number, so what is right is how far it
 * agrees from its start, and everything after it parts is off.
 */
export function offTheAnswer(size: number, code: string, solution: string): { right: number; wrongCells: number[]; left: number } {
  const line = decodeLine(code, size) ?? [];
  const answer = decodeLine(solution, size) ?? [];
  let right = 0;
  while (right < line.length && line[right] === answer[right]) right += 1;
  return { right, wrongCells: line.slice(right), left: answer.length - line.length };
}

/** A Hint: the line cut back to where it agrees with the answer, with the next right cell added; null when there is nothing to add. */
export function hintedLine(size: number, code: string, solution: string): number[] | null {
  const line = decodeLine(code, size) ?? [];
  const answer = decodeLine(solution, size);
  if (answer === null) return null;
  let right = 0;
  while (right < line.length && line[right] === answer[right]) right += 1;
  return right >= answer.length ? null : answer.slice(0, right + 1);
}
