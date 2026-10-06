import Link from "@/components/ui/Link";
import { ResultMark } from "@/components/game/ResultMark";
import { RESULT_MARKS } from "@/components/game/resultMark.constants";
import { markOfSeat } from "@/components/game/resultMarks";

import { PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { stoneName } from "@/lib/gomoku/seatWords";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { matchPath } from "@/lib/gomoku/slugs";
import { matchGames } from "@/lib/history/matchGames";

import { matchPanelCopy } from "./live.constants";

/**
 * THE REST OF THE MATCH, beside each game of it.
 *
 * A match is two, four or six games made at once, the colours alternating
 * (`liveMatch.ts`), and each of them is an ordinary game with its own page. So
 * every one of those pages says which game of the match it is and leads to the
 * others, with how each stands — otherwise the second game of a pair is just
 * another board in the list, and nothing says the two belong together.
 *
 * Nothing at all for a game that is not in a match.
 */
export async function MatchPanel({
  id,
  matchId,
  memberId,
}: {
  id: string;
  matchId: string | null;
  memberId: string | null;
}) {
  if (matchId === null) return null;
  const games = await matchGames(matchId, memberId);
  if (games.length < 2) return null;
  const say = await currentSpeaker();
  const copy = matchPanelCopy(say);
  return (
    <div className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="match-panel">
      <h2 className={SECTION_TITLE}>
        {copy.title}{copy.kanji === "" ? null : <> <span className="font-mincho normal-case tracking-normal">{copy.kanji}</span></>}
      </h2>
      <p className="text-xs text-muted">{copy.lead(games.length)}</p>
      <ol className="flex flex-col gap-1 text-sm">
        {games.map((game) => (
          <li key={game.id} data-testid="match-game" data-mine={game.mine ?? undefined} data-state={game.state}>
            {game.id === id ? (
              <span className="font-semibold">{copy.game(game.index)}</span>
            ) : (
              <Link href={matchPath(game.variant, game.id)} className="underline underline-offset-4">
                {copy.game(game.index)}
              </Link>
            )}
            <span className="text-muted">
              {game.mine !== null ? ` · ${copy.you(stoneName(say, game.mine))}` : ""} ·{" "}
              {/* Only a game that ended has a mark: one waiting, in play or refused has no result yet. */}
              {game.state === "black" || game.state === "white" ? (
                <ResultMark kind={game.mine === null ? RESULT_MARKS.success : markOfSeat(game.state, game.mine, true)} className="mr-0.5" />
              ) : game.state === "drawn" ? (
                <ResultMark kind={RESULT_MARKS.other} className="mr-0.5" />
              ) : null}
              {copy.state[game.state]}
              {game.id === id ? ` · ${copy.here}` : ""}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
