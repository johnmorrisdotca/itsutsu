"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import type { BoardThemeTokens } from "@/components/board/board.types";
import type { ComputerSaid } from "@/lib/puzzles/kumimoji/computer.types";
import { planComputerTurn } from "@/lib/puzzles/kumimoji/computerTurn";
import { nameOf } from "@/lib/puzzles/kumimoji/party";
import type { PartyGame } from "@/lib/puzzles/kumimoji/party.types";
import { tileFace } from "@/lib/puzzles/kumimoji/tileFace";
import type { TileWords } from "@/lib/puzzles/kumimoji/tileWords";

import { COMPUTER_PAUSE_MS } from "./kumimoji.constants";
import { ComputerMark } from "./KumimojiDeskParts";
import { PartyBoard } from "./KumimojiPartyBoards";
import { keepParty } from "./kumimojiPartyKept";

/** What a step of a computer's turn did, in a few words. */
function sayStep(said: ComputerSaid | null, words: TileWords): string {
  if (said === null) return "Looking at its tiles…";
  switch (said.kind) {
    case "rebuilt":
      return "Took its tiles up to build again";
    case "laid":
      return `Laid ${(words.wordOf(said.word) ?? said.word).toUpperCase()}`;
    case "drew":
      return "Draw: a tile for everybody";
    case "traded":
      return `Traded ${tileFace(said.tile).glyph.toUpperCase()} for three tiles`;
    case "done":
      return said.out ? "Done, and out" : "Done";
    case "resigned":
      return "Resigned: it can do nothing more";
  }
}

/**
 * A COMPUTER'S TURN, played out where everybody can see it: the pass screen
 * is not shown for it, since nobody takes the device, and the table it plays
 * on gains its tiles one word at a time. The whole turn is planned first
 * (`planComputerTurn`), in this browser and nowhere else, then shown a step
 * every `COMPUTER_PAUSE_MS` — a fixed pause that waits while the tab is
 * hidden, never a poll — and the game after its last step is kept. The next
 * player's pass screen follows, opening on this table.
 *
 * Only the last step is kept, so a reload in the middle plays the same turn
 * again from its start (the plan is the same plan), and a reload after it
 * finds it done. `children` is what sits under it: the order of play and the
 * way to end the game.
 */
export function KumimojiPartyComputer({ game, words, theme, children }: { game: PartyGame; words: TileWords; theme: BoardThemeTokens; children: ReactNode }) {
  const steps = useMemo(() => planComputerTurn(game, words), [game, words]);
  /* How many steps are on the screen: none at first, then one more each pause; one pause past the last, the game moves on. */
  const [shown, setShown] = useState(0);
  const last = steps.at(-1)?.game ?? null;
  /* A plan that does not move the game on would play itself for ever: it is shown and not kept (`planComputerTurn` says why it cannot happen). */
  const moves = last !== null && (last.turns > game.turns || last.ending !== null);

  useEffect(() => {
    if (shown > steps.length || (shown === steps.length && !moves)) return;
    let timer: number | undefined;
    const next = () => {
      timer = undefined;
      if (shown < steps.length) setShown(shown + 1);
      else if (last !== null) keepParty(last);
    };
    const wait = () => {
      if (timer === undefined && document.visibilityState === "visible") timer = window.setTimeout(next, COMPUTER_PAUSE_MS);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") wait();
      else if (timer !== undefined) {
        window.clearTimeout(timer);
        timer = undefined;
      }
    };
    wait();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [shown, steps, last, moves]);

  const at = Math.min(shown, steps.length);
  const frame = at === 0 ? game : steps[at - 1]!.game;
  const said = at === 0 ? null : steps[at - 1]!.said;
  return (
    <section className="flex flex-col gap-3" data-testid="kumimoji-party-computer" data-player={game.turn} data-step={at} data-steps={steps.length}>
      <p className="flex min-w-0 items-center gap-2 text-base font-semibold" data-testid="kumimoji-party-whose">
        <span className="min-w-0 truncate">{nameOf(game, game.turn)} is playing</span>
        <ComputerMark />
      </p>
      <p className="min-h-5 text-sm text-muted" data-testid="kumimoji-party-computer-said" aria-live="polite">
        {moves ? sayStep(said, words) : "This computer cannot move: end the game below."}
      </p>
      <PartyBoard game={frame} at={game.turn} theme={theme} />
      {children}
    </section>
  );
}
