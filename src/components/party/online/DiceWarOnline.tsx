"use client";

import { diceWarPeopleToRoll } from "@johnmorrisdotca/korokoro";

import { AskIfAway } from "@/components/game/AskIfAway";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BUTTON_LEAD, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { diceWarSeatName } from "@/lib/party/diceWar/diceWar.constants";
import { diceWarSaid } from "@/lib/party/diceWar/diceWarWords";
import type { DiceWarPress, DiceWarTable } from "@/lib/party/online/onlineDice";

import { DiceWarBoard } from "../diceWar/DiceWarBoard";
import { diceWarScreenWords, onlineWords } from "../partyWords";
import type { OnlineBoardProps } from "./online.types";

/**
 * DICE WAR AT A TABLE ON SEVERAL DEVICES: each person presses Roll on their own device
 * and the dice fall when the last of them has, so a press says only that the seat is
 * ready. The dice come from the server's seed; a browser never sends one.
 */
export function DiceWarOnline({ game: table, canMove, onMove, mySeat }: OnlineBoardProps<DiceWarTable, DiceWarPress>) {
  const say = useSpeaker();
  const DICE_WAR_COPY = diceWarScreenWords(say.locale);
  const ONLINE_COPY = onlineWords(say.locale);
  const { game, pressed } = table;
  const over = game.phase === "over";
  const name = (seat: number) => diceWarSeatName(game.players, game.computers, seat, say);
  const waitingOn = diceWarPeopleToRoll(game).filter((seat) => !pressed.includes(seat));
  const pressedMine = pressed.includes(mySeat);
  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="dicewar-game" data-state={over ? "finished" : "playing"} data-throws={game.throws.length} data-pressed={pressed.length} data-round={game.round}>
      <div className="flex min-h-[3.5rem] flex-col gap-0.5" aria-live="polite">
        <p className="text-sm text-muted" data-testid="dicewar-said">
          {diceWarSaid(game, name, say)}
        </p>
        <p className="text-sm" data-testid="dicewar-next">
          {over ? "" : pressedMine && waitingOn.length > 0 ? say.say("party.dice.war.waiting", { names: say.joined(waitingOn.map(name)) }) : ""}
        </p>
      </div>
      {over ? null : (
        <div data-bare-beside>
          <button type="button" onClick={() => onMove({ kind: "roll" })} disabled={!canMove} className={`${BUTTON_LEAD} ${canMove ? BUTTON_STRONG : BUTTON_QUIET}`} data-testid="dicewar-roll">
            {DICE_WAR_COPY.rollDice}
          </button>
        </div>
      )}
      <DiceWarBoard game={game} />
      <AskIfAway watching={canMove && !over} detail={ONLINE_COPY.idleDetail} kept={ONLINE_COPY.idleKept} />
    </div>
  );
}
