import Link from "next/link";

import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { matchPath } from "@/lib/gomoku/slugs";
import { matchGames } from "@/lib/history/matchGames";

import { MATCH_PANEL_COPY } from "./live.constants";

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
  const copy = MATCH_PANEL_COPY;
  return (
    <div className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="match-panel">
      <h2 className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
        {copy.title} <span className="font-mincho normal-case tracking-normal">{copy.kanji}</span>
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
              {game.mine !== null ? ` · ${copy.you(STONE_DISPLAY[game.mine].label)}` : ""} · {copy.state[game.state]}
              {game.id === id ? ` · ${copy.here}` : ""}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
