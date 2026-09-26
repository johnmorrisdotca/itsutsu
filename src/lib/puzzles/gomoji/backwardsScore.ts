/**
 * WHAT A SAKASA SCORES: every row got through without the word, and a bonus
 * for getting through them all. Caught on the first row is nothing; the word
 * never typed is every row's worth and the bonus. The clock costs nothing, as
 * nothing in a Sakasa is found sooner by hurrying.
 */
export const SAKASA_SCORE = { row: 20, through: 50 } as const;

export type SakasaScore = { rows: number; through: number; total: number };

export function sakasaScore(word: string, guesses: readonly string[]): SakasaScore {
  const caught = guesses.indexOf(word);
  const survived = caught === -1 ? guesses.length : caught;
  const rows = survived * SAKASA_SCORE.row;
  const through = caught === -1 ? SAKASA_SCORE.through : 0;
  return { rows, through, total: rows + through };
}
