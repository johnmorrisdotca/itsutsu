/** A score as a table prints it: 10,000. A date's formatter is not for this, and the figure is the same in both languages. */
export function scoreWords(points: number): string {
  return String(points).replace(/\B(?=(\d{3})+$)/g, ",");
}
