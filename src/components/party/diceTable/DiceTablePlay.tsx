"use client";

import { useEffect, useRef, useState } from "react";

import type { Appearance } from "@/components/board/board.types";
import { AskIfAway } from "@/components/game/AskIfAway";
import { WinCoverOver, useWinMoment } from "@/components/game/WinCover";
import { resultLine, tableNews } from "@/components/game/winNews";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { PlayingNow } from "@/components/layout/PlayingNow";
import { gameEndingCopy } from "@/components/play/gameEnding.constants";
import { TableEnding } from "@/components/play/GameEnding";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_LEAD, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { gameNameFor } from "@/lib/catalogue/gameKeys";
import type { DiceTableKind } from "@/lib/party/diceTable/diceTable.constants";
import { sameTableAgain } from "@/lib/party/diceTable/diceTable";
import type { DiceTableBase } from "@/lib/party/diceTable/diceTable.types";
import { seatedName } from "@/lib/party/partyNames";
import { resignedBy } from "@/lib/party/resign";
import { resignDiceTable } from "@/lib/party/resignTables";
import { freshSeed } from "@/lib/puzzles/random";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { useCardComputer } from "../cards/useCardComputer";
import { MarbleChip } from "../MarbleChip";
import { PartyHandOver } from "../PartyHandOver";
import { PartySeatColour } from "../PartySeatColour";
import { partyScreenWords } from "../partyWords";
import { TableWallpaper } from "../TableWallpaper";
import { useDiceSound } from "../yacht/diceSound";
import { DICE_TABLE_ROWS } from "./diceTableRows";

type Kept = DiceTableBase<unknown>;

/**
 * A PLAIN DICE GAME UNDER WAY, on one device: the game's own board, the computer's
 * moves (`useCardComputer`, which reads only what its seat may know), the win
 * cover and the table's furniture. One component for all four, as `CardPlay` is
 * for the card games.
 *
 * WHERE THE DICE ARE HIDDEN (Liar's Dice) and two or more people share the device,
 * the board is covered between their turns, names who to pass it to, and opens
 * only when that person says it is them; a reload covers it again, so a reload
 * cannot be used to look. With one person at the table their own dice are simply
 * shown, whoever is to move. On a computer's turn at a table of several people,
 * nobody's dice are drawn.
 */
export function DiceTablePlay({ kind, game, keep, appearance, gameHref }: { kind: DiceTableKind; game: Kept; keep: (game: Kept | null) => void; appearance: Appearance; gameHref: string }) {
  const say = useSpeaker();
  const PARTY_COPY = partyScreenWords(say.locale);
  const hydrated = useHydrated();
  const sound = useDiceSound();
  const row = DICE_TABLE_ROWS[kind];
  const over = game.phase === "over";
  const resigned = resignedBy(game);
  const GAME_ENDING_COPY = gameEndingCopy(say);
  const moment = useWinMoment(over ? "ended" : "playing");
  useCardComputer(row.rules, game, keep as (game: unknown) => void);

  // The dice's own sound answers the throw, whoever made it.
  const thrown = row.thrown(game);
  const heard = useRef(thrown);
  useEffect(() => {
    if (thrown > heard.current) sound.play(1);
    heard.current = thrown;
  }, [thrown, sound]);

  const people = game.computers.flatMap((computer, seat) => (computer ? [] : [seat]));
  const lonePerson = people.length === 1 ? people[0]! : null;
  const names = game.players.map((_, seat) => seatedName(game, seat, say));
  const toPlay = over ? null : game.toPlay;
  const personToMove = toPlay !== null && game.computers[toPlay] !== true;

  // Who has said it is them, for this seat at this point of the game: gone when the game moves on, and on a reload.
  const position = `${toPlay}:${game.moves.length}`;
  const [opened, setOpened] = useState<string | null>(null);
  const covered = row.hidden && !over && lonePerson === null && personToMove && opened !== position;
  const viewer = !row.hidden ? toPlay : over ? null : lonePerson !== null ? lonePerson : personToMove ? toPlay : null;

  const play = (move: unknown) => {
    const next = row.rules.play(game, move);
    if (next !== null) keep(next as Kept);
  };
  const again = () => {
    const fresh = sameTableAgain(row.rules as never, game as never, freshSeed());
    if (fresh !== null) keep(fresh as Kept);
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start" data-testid="dicetable-game" data-kind={kind} data-state={game.phase} data-to-play={game.toPlay} data-covered={covered ? "true" : undefined} {...readyMark(hydrated)}>
      <div className="flex min-w-0 flex-col gap-3" data-scale-board data-bare-board>
        <PlayingNow on={moment.playing} />
        {/* How it ended, said where the game's own turn line is, and still there once the cover has gone. */}
        {over ? (
          <p className="text-base font-semibold" data-testid="dicetable-result" aria-live="polite">
            {resigned !== null ? GAME_ENDING_COPY.resignedResult(names[resigned] ?? "", game.winners.map((seat) => names[seat] ?? "")) : resultLine(names, game.winners, false, say)}
          </p>
        ) : null}
        {covered ? (
          <PartyHandOver name={names[game.toPlay]!} mark={<MarbleChip player={game.toPlay} />} testId="dicetable-pass" note={say.say("party.dice.liars.passNote")} onReady={() => setOpened(position)} />
        ) : (
          <WinCoverOver news={moment.open ? tableNews({ names, winners: game.winners, you: lonePerson, detail: null, next: { label: `${PARTY_COPY.again} →`, onPress: again } }, say) : null} onClose={moment.close}>
            <row.Board game={game} appearance={appearance} names={names} viewer={viewer} canMove={personToMove} onMove={play} />
          </WinCoverOver>
        )}
        {over ? (
          <button type="button" onClick={again} className={`${BUTTON_LEAD} ${BUTTON_STRONG}`} data-testid="dicetable-again">
            {PARTY_COPY.again} →
          </button>
        ) : null}
      </div>
      <aside className="flex min-w-0 flex-col gap-4">
        {/* The colour of whoever is to play, on their turn; a computer's seat keeps its table colour. Furniture in just the board. */}
        {personToMove && !covered ? (
          <div data-chrome>
            <PartySeatColour seat={game.toPlay} name={names[game.toPlay]!} playing={game.players.length} />
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={sound.toggle} aria-pressed={sound.on} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="dice-sound" data-on={sound.on ? "true" : "false"}>
            {sound.on ? say.say("party.dice.soundOn") : say.say("party.dice.soundOff")}
          </button>
          <TableEnding prefix="dicetable" game={game} playing={!over} toPlay={toPlay} seats={game.players.length} nameOf={(seat) => names[seat] ?? ""} onResign={(seat) => keep(resignDiceTable(game, seat))} onNewGame={() => keep(null)} />
        </div>
        <p className="text-xs text-muted">{PARTY_COPY.kept}</p>
        {over ? <TableWallpaper game={kind} result={resultLine(names, game.winners, false, say)} /> : null}
        <p className="text-sm">
          <Link href={gameHref} className="underline underline-offset-4">
            {say.say("party.dice.about", { game: gameNameFor(kind, say) })} →
          </Link>
        </p>
      </aside>
      <AskIfAway watching={!over} detail={PARTY_COPY.idleDetail} kept={PARTY_COPY.idleKept} />
    </section>
  );
}
