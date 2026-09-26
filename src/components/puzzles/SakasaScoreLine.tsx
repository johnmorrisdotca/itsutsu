import { sakasaScore } from "@/lib/puzzles/gomoji/backwardsScore";

/**
 * WHAT A GOMOJI SAKASA SCORED (`backwardsScore.ts`), under the grid once it is
 * over, got through or caught: the rows got through and the bonus for all of
 * them. The same sum the server stored, worked out here from the same guesses.
 */
export function SakasaScoreLine({ word, guesses }: { word: string; guesses: readonly string[] }) {
  const score = sakasaScore(word, guesses);
  return (
    <div className="flex flex-col gap-1" data-testid="word-score" data-total={score.total}>
      <p className="text-base">
        <strong className="tabular-nums">{score.total}</strong> {score.total === 1 ? "point" : "points"}
        {score.total === 0 ? <span className="text-muted"> — caught on the first row.</span> : null}
      </p>
      <p className="text-xs text-muted">
        <span data-testid="word-score-rows">
          Rows got through <span className="tabular-nums">{score.rows}</span>
        </span>
        {score.through > 0 ? (
          <span data-testid="word-score-through">
            {" "}· Every row <span className="tabular-nums">{score.through}</span>
          </span>
        ) : null}
      </p>
    </div>
  );
}
