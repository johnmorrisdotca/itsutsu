import { TileFace } from "@/components/puzzles/KumimojiTileFace";
import { kanaTileCode, tileFace } from "@/lib/puzzles/kumimoji/tileFace";
import { GHOST_END, GHOST_PHASE } from "@/lib/party/superghost/superghost";
import type { GhostEnd } from "@/lib/party/superghost/superghost.types";

import { GHOST_COPY, ghostShown } from "./party.constants";
import type { GhostFragmentProps } from "./party.types";

/** One letter of the fragment: large, on a tile, a Japanese kana with the other forms it plays as small in its corner. */
const TILE =
  "relative inline-flex h-12 w-10 items-center justify-center rounded-lg border border-rule-strong bg-paper text-3xl font-bold text-ink shadow-[0_1px_2px_rgba(0,0,0,0.25)] sm:h-16 sm:w-12 sm:text-4xl";

/** Where a letter may go: dashed, so it reads as a place and not a letter, with the letter waiting in it faint. */
const SLOT =
  "inline-flex h-12 w-10 items-center justify-center rounded-lg border-2 border-dashed text-2xl font-bold transition-colors focus-visible:ring-2 focus-visible:ring-moss outline-none disabled:cursor-default sm:h-16 sm:w-12 sm:text-3xl";

/**
 * THE FRAGMENT, the one thing the whole table watches: the letters so far,
 * large, in the middle. On a turn, a dashed place stands at each end; tap a
 * letter on the keyboard and it waits faint in both, and a tap on either end
 * puts it there — the same as Add before and Add after below. Before a
 * round's first letter, how the last round was lost is said here (`note`).
 *
 * Japanese is drawn in the tiles of the Japanese Kumimoji (`TileFace`): は
 * with ば and ぱ small in its corner, because the fragment's は is all three.
 */
export function GhostFragment({ game, pending, onEnd, note }: GhostFragmentProps) {
  const letters = [...game.fragment];
  const turn = game.phase === GHOST_PHASE.adding;
  const shownPending = pending === null ? null : ghostShown(pending, game.language);
  const slot = (end: GhostEnd) => (
    <button
      type="button"
      className={`${SLOT} ${pending === null ? "border-rule-strong text-muted/50" : "border-ink bg-ivory text-ink/45 hover:bg-rule/60"}`}
      onClick={() => onEnd(end)}
      disabled={pending === null}
      aria-label={end === GHOST_END.before ? GHOST_COPY.addBefore(shownPending) : GHOST_COPY.addAfter(shownPending)}
      data-testid={`ghost-slot-${end}`}
    >
      {shownPending ?? "+"}
    </button>
  );
  return (
    <div
      className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-rule bg-ivory/60 px-2 py-4 sm:min-h-36"
      data-testid="ghost-fragment"
      data-fragment={game.fragment}
      aria-live="polite"
    >
      {note}
      <div className="flex max-w-full flex-wrap items-center justify-center gap-1 sm:gap-1.5" role="group" aria-label={letters.length === 0 ? GHOST_COPY.empty : ghostShown(game.fragment, game.language)}>
        {turn ? slot(GHOST_END.before) : null}
        {letters.length === 0 && !turn ? <span className="text-sm text-muted">{GHOST_COPY.empty}</span> : null}
        {letters.map((letter, at) => (
          <span key={at} className={TILE} data-testid="ghost-letter" aria-hidden="true">
            {game.language === "japanese" ? <TileFace face={tileFace(kanaTileCode(letter) ?? letter)} /> : ghostShown(letter, game.language)}
          </span>
        ))}
        {turn ? slot(GHOST_END.after) : null}
      </div>
    </div>
  );
}
