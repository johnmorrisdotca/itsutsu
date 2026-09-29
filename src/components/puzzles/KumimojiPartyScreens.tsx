"use client";

import { useState } from "react";

import type { BoardThemeTokens } from "@/components/board/board.types";
import Link from "@/components/ui/Link";
import { PressLabel } from "@/components/ui/PressLabel";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PLAY_BUTTON, SECTION_HEADING, SECTION_HEADING_KANJI } from "@/components/ui/ui.constants";
import { playPath } from "@/lib/gomoku/slugs";
import { nameOf } from "@/lib/puzzles/kumimoji/party";
import type { PartyGame } from "@/lib/puzzles/kumimoji/party.types";
import { winnersOf } from "@/lib/puzzles/kumimoji/partyTurns";
import { KUMIMOJI_PARTY } from "@/lib/puzzles/kumimoji/tiles.constants";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";

import { inALine, KumimojiPartyAll } from "./KumimojiPartyBoards";
import { useKeptParty } from "./kumimojiPartyKept";

/** The play page of a kept game: its own settings and number of players, and never a name. */
export function partyAddress(game: PartyGame): string {
  const s = game.settings;
  return `${playPath("kumimoji")}${puzzleQuery({ size: s.size, level: s.level, seed: s.seed, hints: s.hints, gameLength: s.gameLength, language: s.language, doubleSet: s.doubleSet, diagonals: s.diagonals, players: game.players.length })}`;
}

/**
 * WHO IS PLAYING, before the deal: a name for each seat, or none for "Player
 * 2". Typed here, on the play page, rather than on the set-up screen, so the
 * set-up screen keeps one height whatever number is chosen; kept only in
 * this browser, filled from the last game's.
 */
export function KumimojiPartyNames({
  count,
  remembered,
  replacing,
  onBegin,
}: {
  count: number;
  remembered: readonly string[];
  /** Another pass-and-play game this browser is keeping, which beginning forgets. */
  replacing: PartyGame | null;
  onBegin: (names: string[]) => void;
}) {
  return (
    <form
      className="flex flex-col gap-3"
      data-testid="kumimoji-party-names"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        onBegin(Array.from({ length: count }, (_, at) => String(form.get(`player-${at}`) ?? "")));
      }}
    >
      <h2 className={SECTION_HEADING}>
        Who is playing? <span className={SECTION_HEADING_KANJI}>誰</span>
      </h2>
      <p className="text-sm text-muted">
        {count} players pass this device round, each with a hand and a table of their own. Names stay in this browser; leave one empty for its number.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {Array.from({ length: count }, (_, at) => (
          <label key={at} className="flex items-center gap-2 text-sm">
            <span className="w-16 shrink-0 text-muted">Player {at + 1}</span>
            <input
              name={`player-${at}`}
              defaultValue={remembered[at] ?? ""}
              placeholder={`Player ${at + 1}`}
              maxLength={KUMIMOJI_PARTY.nameMost}
              autoComplete="off"
              className="min-w-0 flex-1 rounded border border-rule bg-paper px-2 py-1.5 text-ink"
              data-testid="kumimoji-party-name"
              data-at={at}
            />
          </label>
        ))}
      </div>
      {replacing === null ? null : (
        <p className="text-sm text-muted" data-testid="kumimoji-party-replacing">
          Beginning forgets the pass-and-play game this browser is keeping.{" "}
          <Link href={partyAddress(replacing)} className="underline underline-offset-2">
            Continue that one instead
          </Link>
          .
        </p>
      )}
      <button type="submit" className={PLAY_BUTTON} data-testid="kumimoji-party-begin">
        <PressLabel words="Begin" kanji="始" />
      </button>
    </form>
  );
}

/**
 * UNDER THE PASS SCREEN: the order of play, and ending the game for
 * everybody, which asks twice.
 */
export function KumimojiPartyOrder({ game, onEnd }: { game: PartyGame; onEnd: () => void }) {
  const [ending, setEnding] = useState(false);
  return (
    <>
      <ol className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm text-muted" data-testid="kumimoji-party-order" aria-label="The order of play">
        {game.players.map((_, at) => (
          <li key={at} className={at === game.turn ? "font-semibold text-ink" : game.resigned.includes(at) ? "line-through" : ""} data-resigned={game.resigned.includes(at) ? "true" : undefined}>
            {nameOf(game, at)}
            {game.resigned.includes(at) ? " (resigned)" : game.out.includes(at) ? " (out)" : ""}
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
        {ending ? (
          <>
            <span>End this game for everybody? It is not kept.</span>
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_STRONG}`} onClick={onEnd} data-testid="kumimoji-party-end-yes">
              Yes, end it
            </button>
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={() => setEnding(false)}>
              Keep playing
            </button>
          </>
        ) : (
          <button type="button" className="text-muted underline underline-offset-2" onClick={() => setEnding(true)} data-testid="kumimoji-party-end">
            End this game
          </button>
        )}
      </div>
    </>
  );
}

/** The line over the finish: who won, how. */
function headline(game: PartyGame): string {
  const winners = winnersOf(game).map((at) => nameOf(game, at));
  if (game.ending === "tied") return `Tied: ${inALine(winners)}`;
  if (game.ending === "standing") return `${winners[0] ?? ""} wins, the last one standing`;
  return winners.length === 1 ? `${winners[0]} wins` : `${inALine(winners)} share the win`;
}

/**
 * THE FINISH: who won, and every player's crossword and what was left in
 * their hand, on the same grid as All tables. Play again deals a new bag to
 * the same players.
 */
export function KumimojiPartyFinish({ game, theme, onAgain }: { game: PartyGame; theme: BoardThemeTokens; onAgain: () => void }) {
  return (
    <div className="flex flex-col gap-4" data-testid="kumimoji-party-finish" data-ending={game.ending ?? ""}>
      <h2 className={SECTION_HEADING} data-testid="kumimoji-party-winner">
        {headline(game)}
      </h2>
      <KumimojiPartyAll game={game} theme={theme} />
      <button type="button" className={PLAY_BUTTON} onClick={onAgain} data-testid="kumimoji-party-again">
        <PressLabel words="Play again, same players" kanji="再" />
      </button>
    </div>
  );
}

/**
 * "CONTINUE THE PASS-AND-PLAY GAME", on Kumimoji's set-up screen, while this
 * browser keeps one half played (`kumimojiPartyKept.ts`): the local game's
 * answer to the Resume a solo game has there.
 */
export function KumimojiPartyResume() {
  const game = useKeptParty();
  if (game === null || game.ending !== null) return null;
  return (
    <Link href={partyAddress(game)} className={PLAY_BUTTON} data-testid="kumimoji-party-continue">
      <PressLabel words="Continue the pass-and-play game" kanji="続" />
    </Link>
  );
}
