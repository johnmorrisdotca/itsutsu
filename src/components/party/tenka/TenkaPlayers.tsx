import { PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { TENKA_NEUTRAL, TENKA_PHASES, TENKA_WORLD_ROUNDS } from "@/lib/party/tenka/tenka.constants";
import type { TenkaGame } from "@/lib/party/tenka/tenka.types";
import { armiesHeld, tenkaPlayerName, territoriesHeld } from "@/lib/party/tenka/tenkaTurn";

import { MarbleChip } from "../MarbleChip";
import { TENKA_COPY, TENKA_NEUTRAL_MARBLE } from "./tenka.constants";

/**
 * WHO IS AT THE TABLE, in turn order, with what each holds: territories,
 * armies on the map and cards in hand — the one whose turn it is marked, a
 * player knocked out struck through. At a table of two the neutral army is
 * listed under them, since it holds a third of the world.
 */
export function TenkaPlayers({ game }: { game: TenkaGame }) {
  const rows = game.players.map((_, seat) => seat);
  const neutral = game.players.length === 2;
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="tenka-players">
      <h2 className={`${SECTION_TITLE} flex items-baseline justify-between gap-2`}>
        <span>
          At the table <span className="font-mincho normal-case tracking-normal">席</span>
        </span>
        <span className="normal-case tracking-normal" data-testid="tenka-round">
          {TENKA_COPY.roundOf(game.round, game.rounds, TENKA_WORLD_ROUNDS)}
        </span>
      </h2>
      <ol className="flex flex-col gap-1">
        {rows.map((seat) => {
          const current = seat === game.toPlay && game.phase !== TENKA_PHASES.over;
          return (
            <li
              key={seat}
              className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm ${current ? "bg-rule/60 font-semibold" : ""} ${game.out[seat] ? "text-muted line-through" : ""}`}
              data-testid="tenka-player"
              data-player={seat}
              data-territories={territoriesHeld(game.owners, seat)}
              data-out={game.out[seat] ? "true" : undefined}
            >
              <MarbleChip player={seat} />
              <span className="min-w-0 flex-1 truncate">{tenkaPlayerName(game, seat)}</span>
              <span className="shrink-0 text-right text-xs text-muted tabular-nums">
                {game.out[seat]
                  ? TENKA_COPY.out
                  : `${territoriesHeld(game.owners, seat)} · ${armiesHeld(game, seat)} · ${game.hands[seat].length}`}
              </span>
            </li>
          );
        })}
        {neutral ? (
          <li className="flex items-center gap-2 px-2 py-1 text-sm text-muted" data-testid="tenka-neutral">
            <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold" style={{ background: TENKA_NEUTRAL_MARBLE.fill, color: TENKA_NEUTRAL_MARBLE.ink }} aria-hidden="true">
              {TENKA_NEUTRAL_MARBLE.letter}
            </span>
            <span className="min-w-0 flex-1 truncate">Neutral army</span>
            <span className="shrink-0 text-xs tabular-nums">
              {territoriesHeld(game.owners, TENKA_NEUTRAL)} · {armiesHeld(game, TENKA_NEUTRAL)}
            </span>
          </li>
        ) : null}
      </ol>
      <p className="text-xs text-muted">Territories · armies · cards.</p>
    </section>
  );
}
