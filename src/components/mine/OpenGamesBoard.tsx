import { Paired } from "@/components/i18n/Paired";
import Link from "next/link";

import { CountryMark } from "@/components/players/CountryMark";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { LevelName } from "@/components/xp/LevelName";
import { SEAT_DISPLAY, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { describeMoveTime } from "@/lib/history/deadline";
import type { GameSummary } from "@/lib/history/gameHistory.types";
import { posterOf, type OpenSeatFilter } from "@/lib/history/openSeatsFilter";
import { posterKeyOf } from "@/lib/history/posterStanding";
import type { PosterStanding } from "@/lib/history/posterStanding.types";
import { TIER_DISPLAY } from "@/lib/rating/elo";
import { RATING_POOLS } from "@/lib/rating/pools";
import { MY_GAMES_COPY, OPEN_SEATS_FILTER_COPY, START_COPY } from "./mine.constants";
import { OpenSeatsFilters } from "./OpenSeatsFilters";
import { PlayerName } from "@/components/players/PlayerName";
import { SitButton } from "./SitButton";
import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";

/**
 * The noticeboard: games somebody has posted with a seat for anyone. It sits
 * beside the room, and an empty board says so rather than disappearing —
 * "nobody is asking" is the thing a person needs to know before they ask.
 * A game this browser is already in is never on it; you cannot sit across
 * from yourself.
 *
 * `games` is the page the board actually shows — narrowed by the filter and
 * cut to `OPEN_GAMES_SHOWN`. `shown` is how many seats matched the filter
 * before that cut, and `total` is how many were on offer before the filter
 * itself, so the count beside the filters can say what narrowed the list
 * rather than only what fits on screen.
 *
 * Each poster is shown with their strength — the rating the ladder would print,
 * from the right pool and with its tier, and their XP level — so a reader can
 * pick an opponent of their own strength before sitting down. The rating filter
 * above reads the same figures (`posterStanding.ts`).
 */
export function OpenGamesBoard({
  games,
  shown,
  filter,
  total,
  standings,
}: {
  games: GameSummary[];
  /** Seats matching the filter, before the board's own display cap. */
  shown: number;
  filter: OpenSeatFilter;
  total: number;
  /** Each poster's rating, level and country, by `posterKeyOf`. */
  standings: ReadonlyMap<string, PosterStanding>;
}) {
  const copy = MY_GAMES_COPY.openBoard;

  return (
    <section id="open-seats" className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="open-games">
      <h2 className="flex items-baseline gap-2 text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
        <Paired en={copy.label} kanji={copy.kanji} kanjiClassName="text-[0.8rem] font-normal tracking-normal" />
        {games.length > 0 ? <span className="font-normal tracking-normal">{games.length}</span> : null}
      </h2>
      {total > 0 ? <OpenSeatsFilters filter={filter} shown={shown} total={total} /> : null}
      <p className="text-xs text-muted">
        {total === 0 ? (
          START_COPY.noSeats
        ) : shown === 0 ? (
          <>
            {OPEN_SEATS_FILTER_COPY.empty}{" "}
            <Link href="/games#open-seats" className="underline underline-offset-4" data-testid="open-seats-clear">
              {OPEN_SEATS_FILTER_COPY.clear}
            </Link>
            .
          </>
        ) : (
          copy.hint
        )}
      </p>
      <ul className="flex flex-col gap-1.5">
        {games.map((game) => {
          const poster = posterOf(game);
          const standing = standings.get(posterKeyOf(poster)) ?? null;
          return (
            <li
              key={game.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-rule px-3 py-2 text-sm"
              data-testid="open-game"
            >
              {/* Which game the seat is in, at a glance — the same board /play shows. */}
              <GameThumb variant={game.variant} size="row" />
              <span className="flex min-w-0 flex-1 basis-56 flex-col gap-0.5">
                <span className="truncate font-medium">
                  {/* By id, so the link carries no surname the line itself shortened away. */}
                  <PlayerName
                    name={poster.name}
                    memberId={poster.memberId}
                    fallback={game.openSeat === "black" ? SEAT_DISPLAY.two.label : SEAT_DISPLAY.one.label}
                  />
                  {/* Where they are, which is most of why they answer at four in the morning. */}
                  <CountryMark country={standing?.country ?? null} className="ml-1 text-xs" />
                  <span className="px-1 text-muted">is waiting for someone to play</span>
                  {game.openSeat === "black" ? STONE_DISPLAY.black.label : STONE_DISPLAY.white.label}
                </span>
                {/* How strong they are, on its own line so it is never truncated away. */}
                <PosterStrength standing={standing} />
                <span className="text-xs text-muted">
                  <GameName variant={game.variant} raised /> · {game.size}×{game.size} · {describeMoveTime(game.moveTimeMs)}
                  {game.allowResign ? "" : " · no resigning"}
                </span>
              </span>
              <SitButton id={game.id} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * A poster's level and rating, the way the tables of players print them: the
 * level as a compact badge leading to its rung, and the rating with its tier and,
 * where the computer players earned it, the mark that says so. A poster with no
 * settled rating reads Unrated, never a starting figure nobody earned.
 */
function PosterStrength({ standing }: { standing: PosterStanding | null }) {
  const rating = standing?.rating ?? null;
  return (
    <span className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted" data-testid="open-game-standing">
      {standing?.level != null ? <LevelName level={standing.level} compact testId="open-game-level" /> : null}
      <span className="font-mono tabular-nums" data-testid="open-game-rating">
        {rating === null ? TIER_DISPLAY.unrated.label : `${rating.rating} · ${TIER_DISPLAY[rating.tier].label}`}
        {rating !== null && rating.pool === RATING_POOLS.computer ? (
          <span className="ml-1 font-mincho" title={MY_GAMES_COPY.openBoard.computerPool} data-testid="rating-pool-computer">
            機械
          </span>
        ) : null}
      </span>
    </span>
  );
}
