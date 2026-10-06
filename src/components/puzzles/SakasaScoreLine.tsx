import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { sakasaScore } from "@/lib/puzzles/gomoji/backwardsScore";
import { pointsWith } from "./pointsLine";

/**
 * WHAT A GOMOJI SAKASA SCORED (`backwardsScore.ts`), under the grid once it is
 * over, got through or caught: the rows got through and the bonus for all of
 * them. The same sum the server stored, worked out here from the same guesses.
 */
export function SakasaScoreLine({ word, guesses }: { word: string; guesses: readonly string[] }) {
  const say = useSpeaker();
  const score = sakasaScore(word, guesses);
  return (
    <div className="flex flex-col gap-1" data-testid="word-score" data-total={score.total}>
      <p className="text-base">
        {pointsWith(say, score.total)}
        {score.total === 0 ? <span className="text-muted"> {say.say("pword.score.caught")}</span> : null}
      </p>
      <p className="text-xs text-muted">
        <span data-testid="word-score-rows">
          {say.say("pword.score.rows")} <span className="tabular-nums">{score.rows}</span>
        </span>
        {score.through > 0 ? (
          <span data-testid="word-score-through">
            {" "}· {say.say("pword.score.everyRow")} <span className="tabular-nums">{score.through}</span>
          </span>
        ) : null}
      </p>
    </div>
  );
}
