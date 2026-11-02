"use client";

import { useState } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BUTTON_LEAD, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { PICK_CHIP_OPEN, PICK_CHIP_SHUT } from "@/components/live/picker.constants";
import { LIARS_FACES, beatsBid, diceOnTable } from "@/lib/party/liarsDice/liarsDice";
import type { LiarsGame, LiarsMove } from "@/lib/party/liarsDice/liarsDice.types";

import { DiceTray } from "../yacht/DiceTray";
import { DiceScores } from "./DiceScores";
import type { DiceBoardProps } from "./diceTable.types";
import { SmallDice } from "./SmallDice";

/** The fewest a bid of this face may name now. */
function leastCount(game: LiarsGame, face: number): number {
  const bid = game.bid;
  if (bid === null) return 1;
  return beatsBid(bid, bid.count, face) ? bid.count : bid.count + 1;
}

/**
 * LIAR'S DICE AT THE TABLE: the reader's own dice in the tray and nobody else's,
 * the bid to beat, how many and which number to bid, and Liar! After a call,
 * every cup as it was lifted, until the next call. `viewer` says whose dice this
 * page may draw; it is null where nobody's may be, and a cup is then drawn empty.
 */
export function LiarsBoard({ game, appearance, names, viewer, canMove, onMove }: DiceBoardProps<LiarsGame, LiarsMove>) {
  const say = useSpeaker();
  const [face, setFace] = useState<number>(LIARS_FACES[0]);
  const [picked, setPicked] = useState<{ at: number; count: number } | null>(null);
  const playing = game.phase === "playing";
  const at = game.moves.length + game.thrown * 1000;
  const fewest = leastCount(game, face);
  const most = diceOnTable(game);
  const count = Math.min(most, Math.max(fewest, picked !== null && picked.at === at ? picked.count : fewest));
  const mayBid = canMove && playing && beatsBid(game.bid, count, face) && fewest <= most;
  const mine = viewer === null ? null : (game.cups[viewer] ?? []);
  const shown = mine ?? new Array<number>(game.size).fill(0);
  const called = game.called;
  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="liars-board" data-round={game.round} data-to-play={game.toPlay} data-viewer={viewer ?? undefined} data-bid={game.bid === null ? "" : `${game.bid.count}x${game.bid.face}`}>
      <p className="min-h-10 text-sm font-semibold" data-testid="liars-bid" aria-live="polite">
        {game.bid === null ? (playing ? say.say("party.dice.liars.opens", { name: names[game.toPlay] ?? "" }) : "") : say.say("party.dice.liars.bidBy", { name: names[game.bid.seat] ?? "", count: String(game.bid.count), face: String(game.bid.face) })}
      </p>
      <DiceTray dice={shown} held={shown.map(() => false)} rolled={shown.map(() => game.moves.at(-1)?.kind === "call" || game.moves.length === 0)} rollKey={game.round} appearance={appearance} label={say.say("party.dice.liars.yourDice")} />
      <div className="flex flex-col gap-3" data-bare-beside>
        {playing ? (
          <fieldset className="flex flex-col gap-2" disabled={!canMove} data-testid="liars-bidding">
            <legend className="sr-only">{say.say("party.dice.liars.bid")}</legend>
            <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={say.say("party.dice.liars.whichNumber")}>
              {LIARS_FACES.map((option) => (
                <button key={option} type="button" role="radio" aria-checked={option === face} onClick={() => setFace(option)} data-testid="liars-face" data-face={option} className={`min-h-11 rounded-lg border text-base font-semibold disabled:opacity-50 ${option === face ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}>
                  {option}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-1.5">
              <button type="button" aria-label={say.say("party.dice.liars.fewer")} disabled={count <= fewest} onClick={() => setPicked({ at, count: count - 1 })} className={`min-h-11 rounded-lg border text-base font-semibold disabled:opacity-50 ${PICK_CHIP_SHUT}`} data-testid="liars-fewer">
                −
              </button>
              <button type="button" onClick={() => onMove({ kind: "bid", count, face })} disabled={!mayBid} className={`${BUTTON_LEAD} ${mayBid ? BUTTON_STRONG : BUTTON_QUIET}`} data-testid="liars-make-bid" data-count={count} data-face={face}>
                {say.say("party.dice.liars.bidThis", { count: String(count), face: String(face) })}
              </button>
              <button type="button" aria-label={say.say("party.dice.liars.more")} disabled={count >= most} onClick={() => setPicked({ at, count: count + 1 })} className={`min-h-11 rounded-lg border text-base font-semibold disabled:opacity-50 ${PICK_CHIP_SHUT}`} data-testid="liars-more">
                +
              </button>
            </div>
            <button type="button" onClick={() => onMove({ kind: "call" })} disabled={!canMove || game.bid === null} className={`${BUTTON_LEAD} ${BUTTON_QUIET}`} data-testid="liars-call">
              {say.say("party.dice.liars.call")}
            </button>
          </fieldset>
        ) : null}
        <DiceScores names={names} figures={game.cups.map((cup) => (cup.length === 0 ? say.say("party.dice.liars.out") : say.count("party.dice.liars.dice", cup.length)))} toPlay={playing ? game.toPlay : null} heading={say.say("party.dice.liars.onTable", { count: String(most) })} marked={game.winners} />
        {called === null ? null : (
          <section className="flex flex-col gap-1.5" data-testid="liars-called" data-found={called.found} data-loser={called.loser}>
            <p className="text-sm">
              {say.say(called.found >= called.bid.count ? "party.dice.liars.stood" : "party.dice.liars.fellShort", {
                caller: names[called.caller] ?? "",
                bidder: names[called.bidder] ?? "",
                count: String(called.bid.count),
                face: String(called.bid.face),
                found: String(called.found),
                loser: names[called.loser] ?? "",
              })}
            </p>
            <ul className="flex flex-col gap-1">
              {called.cups.map((cup, seat) =>
                cup.length === 0 ? null : (
                  <li key={seat} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="min-w-20 truncate">{names[seat]}</span>
                    <SmallDice dice={cup} label={names[seat] ?? ""} testId="liars-lifted" />
                  </li>
                ),
              )}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
