import type { WordScore } from "@/lib/puzzles/gomoji/wordScore";
import { POINTS_A_HELP } from "@/lib/puzzles/puzzlePoints";

/** A word's score, English's or the kana version's, which adds the columns its yellows named. */
type Scored = WordScore & { column?: number };

const PARTS: { key: keyof Omit<Scored, "total">; label: string }[] = [
  { key: "placed", label: "In place" },
  { key: "elsewhere", label: "Found elsewhere" },
  { key: "column", label: "Columns" },
  { key: "found", label: "The word" },
  { key: "speed", label: "Speed" },
];

/**
 * WHAT A GOMOJI WORD SCORED, part by part, under the grid once it is over —
 * found or not. The same sum the server stored for the leaderboard
 * (`wordScore`, less a help's price for a Head start, `pointsFor`), worked out
 * here from the same guesses, so the page never waits on the site to say it. A
 * part worth nothing is left out, and a word with nothing found says so rather
 * than printing a row of noughts.
 */
export function WordScoreLine({ score, headStart = false }: { score: Scored; headStart?: boolean }) {
  const parts = PARTS.filter((part) => (score[part.key] ?? 0) > 0);
  const total = Math.max(0, score.total - (headStart ? POINTS_A_HELP : 0));
  return (
    <div className="flex flex-col gap-1" data-testid="word-score" data-total={total}>
      <p className="text-base">
        <strong className="tabular-nums">{total}</strong> {total === 1 ? "point" : "points"}
        {score.total === 0 ? <span className="text-muted"> — nothing of the word was found.</span> : null}
      </p>
      {parts.length > 0 || headStart ? (
        <p className="text-xs text-muted">
          {parts.map((part, index) => (
            <span key={part.key} data-testid={`word-score-${part.key}`}>
              {index > 0 ? " · " : ""}
              {part.label} <span className="tabular-nums">{score[part.key] ?? 0}</span>
            </span>
          ))}
          {headStart ? (
            <span data-testid="word-score-head-start">
              {parts.length > 0 ? " · " : ""}
              Head start <span className="tabular-nums">−{POINTS_A_HELP}</span>
            </span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
