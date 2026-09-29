"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import type { BoardThemeTokens } from "@/components/board/board.types";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { judgeTiles } from "@/lib/puzzles/kumimoji/computerPlay";
import { drawAll, mayDrawAll, nameOf, partyTilesLeft, seatPlay, withSeatPlay } from "@/lib/puzzles/kumimoji/party";
import type { GridVerdict } from "@/lib/puzzles/kumimoji/grid";
import type { PartyGame } from "@/lib/puzzles/kumimoji/party.types";
import { doneRefused, endTurn, goesOut, handCanSpell, isLastTurn, lastStanding, mayResign, resign } from "@/lib/puzzles/kumimoji/partyTurns";
import type { TilePlay } from "@/lib/puzzles/kumimoji/play";
import type { TileWords } from "@/lib/puzzles/kumimoji/tileWords";

import { KumimojiGhost, KumimojiWildPicker } from "./KumimojiDeskParts";
import { KumimojiPartyAll } from "./KumimojiPartyBoards";
import { KumimojiTable, type TableHandle } from "./KumimojiTable";
import { KumimojiTray } from "./KumimojiTray";
import { PARTY_TRAY_ROOM } from "./kumimoji.constants";
import { keepParty } from "./kumimojiPartyKept";
import { sayState, useKumimojiDesk } from "./useKumimojiDesk";

/** Help in a game with no points costs nothing: the press is allowed or not, and nothing is counted. */
const NOTHING_SPENT = () => undefined;

/**
 * WHERE A TURN'S PRESSES GO: on one device, straight into the game this
 * browser keeps; at a table on several devices, a change within the turn stays
 * on this device and Draw, Done and Resign are sent (`KumimojiOnline`). The
 * rules of each press are the same either way.
 */
export type PartyTurnHands = {
  /** A change within the turn — laid, lifted, turned, traded — as the game it makes. */
  change: (next: PartyGame) => void;
  /** Draw: everybody takes a tile, from the game as it stands and the table's verdict. */
  draw: (game: PartyGame, verdict: GridVerdict) => void;
  /** Done, with the table's verdict and whether the hand spells a word. */
  done: (game: PartyGame, verdict: GridVerdict, spells: boolean) => void;
  resign: (game: PartyGame) => void;
};

/** The presses of a game kept in this browser. */
export const KEPT_HANDS: PartyTurnHands = {
  change: (next) => keepParty(next),
  draw: (game) => keepParty(drawAll(game)),
  done: (game, verdict, spells) => keepParty(endTurn(game, verdict, () => spells)),
  resign: (game) => keepParty(resign(game)),
};

/**
 * ONE PLAYER'S TURN in a pass-and-play game: their table and their hand, on
 * the same desk the solo game plays on (`useKumimojiDesk`), with Done under
 * the tray. Mounted afresh for every turn (keyed on the turn's number), so
 * what was chosen, the typing square, the Help cycle and how the table was
 * turned or zoomed all start again for each player: nothing of one player's
 * view reaches the next.
 *
 * Every move is written straight to the kept game (`keepParty`), which is the
 * one copy of it: this component holds only the view.
 */
export function KumimojiPartyTurn({
  game,
  words,
  theme,
  onHide,
  hands = KEPT_HANDS,
  busy = false,
}: {
  game: PartyGame;
  words: TileWords;
  theme: BoardThemeTokens;
  /** Back to the pass screen; absent at a table on several devices, where there is nobody to pass to. */
  onHide?: () => void;
  hands?: PartyTurnHands;
  /** A press on its way to the table: nothing more is pressed until it answers. */
  busy?: boolean;
}) {
  const play = seatPlay(game);
  // Every table is read by the rules the game was set up with: with Diagonals, along its diagonals too.
  const verdict = useMemo(() => judgeTiles(play.tiles, words, { diagonals: game.settings.diagonals }), [play.tiles, words, game.settings.diagonals]);
  const apply = useCallback((next: (now: TilePlay) => TilePlay) => hands.change(withSeatPlay(game, next(seatPlay(game)))), [game, hands]);
  /* All tables, zoomed out over the desk: nothing on the desk answers while it is up. */
  const [looking, setLooking] = useState(false);
  const root = useRef<HTMLElement>(null);
  const table = useRef<TableHandle>(null);
  const desk = useKumimojiDesk({ play, apply, closed: looking, words, help: { allowed: game.settings.hints, spend: NOTHING_SPENT }, root, table });
  /* Whether this hand spells a word, asked of the list once per hand rather than at every render. */
  const spellable = useMemo(() => handCanSpell(play.hand, words), [play.hand, words]);
  const handSpells = useCallback(() => spellable, [spellable]);
  const refused = doneRefused(game, verdict, handSpells);
  const out = goesOut(game, verdict);
  const left = partyTilesLeft(game);
  const name = nameOf(game, game.turn);
  const [resigning, setResigning] = useState(false);

  const presses = {
    ...desk.presses,
    trade: { ...desk.presses.trade, urge: refused === "trade" },
    draw: {
      can: !busy && mayDrawAll(game, verdict),
      run: () => {
        desk.clear();
        hands.draw(game, verdict);
      },
    },
  };
  const said = out
    ? "Your hand is used and your crossword is sound: press Done to go out."
    : sayState(play.hand.length, left, verdict, "Sound. Draw, and everybody takes a tile.");
  const note =
    refused === "trade"
      ? "No word in your hand: choose a tile and trade it for three first."
      : refused === "standing"
        ? "Everybody else has resigned. Lay a tile on a sound crossword and press Done to win, or resign."
        : null;

  if (looking) {
    return (
      <section className="flex flex-col gap-3" data-testid="kumimoji-party-turn" data-player={game.turn} data-looking="true">
        <KumimojiPartyAll game={game} theme={theme} own={game.turn} onOwn={() => setLooking(false)} onClose={() => setLooking(false)} />
      </section>
    );
  }
  return (
    <section ref={root} className={`flex flex-col gap-3 ${PARTY_TRAY_ROOM}`} data-testid="kumimoji-party-turn" data-player={game.turn}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="min-w-0 truncate text-base font-semibold" data-testid="kumimoji-party-whose">
          {name}&rsquo;s turn{isLastTurn(game) ? ", the last" : lastStanding(game) ? ", the last one standing" : ""}
        </p>
        <span className="flex shrink-0 items-baseline gap-3 text-sm">
          <button type="button" className="text-moss underline underline-offset-2" onClick={() => setLooking(true)} data-testid="kumimoji-party-all-open">
            All tables <span className="font-mincho opacity-70">全</span>
          </button>
          {/* Handed over too soon, or to the wrong person: the pass screen again, with nothing played or lost. */}
          {onHide === undefined ? null : (
            <button type="button" className="text-muted underline underline-offset-2" onClick={onHide} data-testid="kumimoji-party-hide">
              Pass back
            </button>
          )}
        </span>
      </div>
      {/* The table's column for the size chooser (`BoardScale`): at Large and Full it takes the width, and the hand moves beside it. */}
      <div data-scale-board data-scale-stack data-bare-board>
        <KumimojiTable
          tiles={play.tiles}
          theme={theme}
          misspelt={verdict.misspelt}
          apart={verdict.apart}
          chosen={desk.chosenSquare}
          cursor={desk.cursor}
          turn={desk.turn}
          onTurn={desk.turnTable}
          onSquare={desk.onSquare}
          onTileDown={desk.onTableDown}
          handle={table}
        />
      </div>
      <p className="min-h-5 text-sm text-muted" data-testid="kumimoji-said" data-sound={verdict.sound ? "true" : "false"} aria-live="polite">
        {desk.helpSaid ?? said}
      </p>
      {desk.selectedWild ? <KumimojiWildPicker language={game.settings.language} words={words} tile={desk.selectedTile!} disabled={false} onChoose={desk.adjustSelected} /> : null}
      {/* Resign, once nothing more can be got from the bag (`mayResign`), and only after a second press says so. */}
      {mayResign(game) ? (
        <div className="flex flex-wrap items-center gap-2 text-sm" data-testid="kumimoji-party-resign-row">
          {resigning ? (
            <>
              <span>Resign, and play no more turns this game?</span>
              <button type="button" className={`${BUTTON_BASE} ${BUTTON_STRONG}`} onClick={() => hands.resign(game)} disabled={busy} data-testid="kumimoji-party-resign-yes">
                Yes, resign
              </button>
              <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={() => setResigning(false)} data-testid="kumimoji-party-resign-no">
                Keep playing
              </button>
            </>
          ) : (
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={() => setResigning(true)} data-testid="kumimoji-party-resign">
              Resign
            </button>
          )}
        </div>
      ) : null}
      <KumimojiTray
        hand={play.hand}
        chosenAt={desk.chosenAt}
        left={left}
        disabled={false}
        presses={presses}
        onHandTile={desk.onHandTile}
        onHandDown={desk.onHandDown}
        onTray={desk.onTray}
        done={{
          label: out ? "Done, and go out" : "Done",
          can: !busy && refused === null,
          run: () => hands.done(game, verdict, spellable),
          note,
        }}
      />
      <KumimojiGhost ghost={desk.ghost} />
    </section>
  );
}
