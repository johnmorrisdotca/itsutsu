import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { SEAT_DISPLAY, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { variantLabel } from "@/lib/gomoku/variants.constants";
import { describeMoveTime } from "@/lib/history/deadline";
import type { GameSummary } from "@/lib/history/gameHistory.types";
import { MY_GAMES_COPY, START_COPY } from "./mine.constants";
import { SitButton } from "./SitButton";

/**
 * The noticeboard: games somebody has posted with a seat for anyone. It sits
 * beside the room, and an empty board says so rather than disappearing —
 * "nobody is asking" is the thing a person needs to know before they ask.
 * A game this browser is already in is never on it; you cannot sit across
 * from yourself.
 */
export function OpenGamesBoard({ games }: { games: GameSummary[] }) {
  const copy = MY_GAMES_COPY.openBoard;

  return (
    <section id="open-seats" className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="open-games">
      <h2 className="flex items-baseline gap-2 text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
        {copy.label}
        <span className="font-mincho text-[0.8rem] font-normal tracking-normal">{copy.kanji}</span>
        {games.length > 0 ? <span className="font-normal tracking-normal">{games.length}</span> : null}
      </h2>
      <p className="text-xs text-muted">{games.length === 0 ? START_COPY.noSeats : copy.hint}</p>
      <ul className="flex flex-col gap-1.5">
        {games.map((game) => (
          <li
            key={game.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-rule px-3 py-2 text-sm"
            data-testid="open-game"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate font-medium">
                {(game.openSeat === "black" ? game.whiteName : game.blackName).trim() ||
                  (game.openSeat === "black" ? SEAT_DISPLAY.two.label : SEAT_DISPLAY.one.label)}
                <span className="px-1 text-muted">is waiting for someone to play</span>
                {game.openSeat === "black" ? STONE_DISPLAY.black.label : STONE_DISPLAY.white.label}
              </span>
              <span className="text-xs text-muted">
                {variantLabel(game.variant)} · {game.size}×{game.size} · {describeMoveTime(game.moveTimeMs)}
                {game.allowResign ? "" : " · no resigning"}
              </span>
            </span>
            <SitButton id={game.id} />
          </li>
        ))}
      </ul>
    </section>
  );
}
