import Link from "next/link";

import { CountryMark } from "@/components/players/CountryMark";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { SEAT_DISPLAY, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { describeMoveTime } from "@/lib/history/deadline";
import type { GameSummary } from "@/lib/history/gameHistory.types";
import { posterOf, type OpenSeatFilter } from "@/lib/history/openSeatsFilter";
import { MY_GAMES_COPY, OPEN_SEATS_FILTER_COPY, START_COPY } from "./mine.constants";
import { OpenSeatsFilters } from "./OpenSeatsFilters";
import { PlayerName } from "@/components/players/PlayerName";
import { SitButton } from "./SitButton";
import { GameName } from "@/components/games/GameName";

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
 */
export function OpenGamesBoard({
  games,
  shown,
  filter,
  total,
  countryByMemberId,
}: {
  games: GameSummary[];
  /** Seats matching the filter, before the board's own display cap. */
  shown: number;
  filter: OpenSeatFilter;
  total: number;
  /** Where each signed-in poster is, by member id — the flag beside their name. */
  countryByMemberId: Map<string, string>;
}) {
  const copy = MY_GAMES_COPY.openBoard;

  return (
    <section id="open-seats" className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="open-games">
      <h2 className="flex items-baseline gap-2 text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
        {copy.label}
        <span className="font-mincho text-[0.8rem] font-normal tracking-normal">{copy.kanji}</span>
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
          const country = poster.memberId === null ? null : (countryByMemberId.get(poster.memberId) ?? null);
          return (
            <li
              key={game.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-rule px-3 py-2 text-sm"
              data-testid="open-game"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-medium">
                  <PlayerName
                    name={poster.name}
                    fallback={game.openSeat === "black" ? SEAT_DISPLAY.two.label : SEAT_DISPLAY.one.label}
                  />
                  {/* Where they are, which is most of why they answer at four in the morning. */}
                  <CountryMark country={country} className="ml-1 text-xs" />
                  <span className="px-1 text-muted">is waiting for someone to play</span>
                  {game.openSeat === "black" ? STONE_DISPLAY.black.label : STONE_DISPLAY.white.label}
                </span>
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
