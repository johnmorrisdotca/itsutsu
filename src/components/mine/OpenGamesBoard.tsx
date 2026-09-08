import { cookies } from "next/headers";

import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { SEAT_DISPLAY, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { variantLabel } from "@/lib/gomoku/variants.constants";
import { describeMoveTime } from "@/lib/history/deadline";
import { fetchOpenGames } from "@/lib/history/openGames";
import { seatClaims } from "@/lib/history/seatCookie";
import { MY_GAMES_COPY } from "./mine.constants";
import { SitButton } from "./SitButton";

/**
 * The noticeboard: games somebody has posted with a seat for anyone. Shown
 * only when there is something on it, and never a game this browser is
 * already in.
 */
export async function OpenGamesBoard() {
  const claims = seatClaims((await cookies()).getAll());
  const games = await fetchOpenGames(claims.keys());
  if (games.length === 0) return null;
  const copy = MY_GAMES_COPY.openBoard;

  return (
    <section id="open-seats" className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="open-games">
      <h2 className="flex items-baseline gap-2 text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
        {copy.label}
        <span className="font-mincho text-[0.8rem] font-normal tracking-normal">{copy.kanji}</span>
        <span className="font-normal tracking-normal">{games.length}</span>
      </h2>
      <p className="text-xs text-muted">{copy.hint}</p>
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
