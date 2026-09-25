import type { WordScore } from "@/lib/puzzles/wordDrop/wordScore";

const PARTS: { key: keyof Omit<WordScore, "total">; label: string }[] = [
  { key: "placed", label: "Letters in place" },
  { key: "elsewhere", label: "Letters elsewhere" },
  { key: "found", label: "The word" },
  { key: "speed", label: "Speed" },
];

/**
 * WHAT A WORDDROP WORD SCORED, part by part, under the grid once it is over —
 * found or not. The same sum the server stored for the leaderboard
 * (`wordScore`), worked out here from the same guesses, so the page never
 * waits on the site to say it. A part worth nothing is left out, and a word
 * with nothing found says so rather than printing a row of noughts.
 */
export function WordScoreLine({ score }: { score: WordScore }) {
  const parts = PARTS.filter((part) => score[part.key] > 0);
  return (
    <div className="flex flex-col gap-1" data-testid="word-score" data-total={score.total}>
      <p className="text-base">
        <strong className="tabular-nums">{score.total}</strong> {score.total === 1 ? "point" : "points"}
        {score.total === 0 ? <span className="text-muted"> — no letter of the word was found.</span> : null}
      </p>
      {parts.length > 0 ? (
        <p className="text-xs text-muted">
          {parts.map((part, index) => (
            <span key={part.key} data-testid={`word-score-${part.key}`}>
              {index > 0 ? " · " : ""}
              {part.label} <span className="tabular-nums">{score[part.key]}</span>
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}
