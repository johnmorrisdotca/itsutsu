"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BUTTON_LEAD, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import type { PigGame, PigMove } from "@/lib/party/pig/pig.types";

import { DiceTray } from "../yacht/DiceTray";
import { DiceScores } from "./DiceScores";
import type { DiceBoardProps } from "./diceTable.types";

/** What the last move did, in a line. */
function news(game: PigGame, names: readonly string[], say: ReturnType<typeof useSpeaker>): string {
  const last = game.last;
  if (last === null) return say.say("party.dice.pig.first", { points: String(game.size) });
  const name = names[last.seat] ?? "";
  if (last.kind === "bust") return say.say("party.dice.pig.bust", { name, points: String(last.lost) });
  if (last.kind === "banked") return say.say("party.dice.banked", { name, points: String(last.points) });
  return say.say("party.dice.pig.rolled", { name, die: String(last.die), points: String(last.turn) });
}

/**
 * PIG'S TABLE: one die in the tray, Roll and Bank under it, and everybody's
 * banked points. Tap the tray to throw, as at every dice table. The die lands on
 * the face the game threw (`throwDice`), which was decided before it tumbled.
 */
export function PigBoard({ game, appearance, names, canMove, onMove }: DiceBoardProps<PigGame, PigMove>) {
  const say = useSpeaker();
  const playing = game.phase === "playing";
  const canBank = canMove && playing && game.turnPoints > 0;
  const roll = () => {
    if (canMove && playing) onMove({ kind: "roll" });
  };
  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="pig-board" data-thrown={game.thrown} data-turn-points={game.turnPoints} data-to-play={game.toPlay}>
      <p className="min-h-10 text-sm" data-testid="dicetable-news" aria-live="polite">
        {news(game, names, say)}
      </p>
      <DiceTray dice={[game.die]} held={[false]} rolled={[true]} rollKey={game.thrown} appearance={appearance} onTray={canMove && playing ? roll : undefined} label={say.say("party.dice.tapTray")} />
      <div className="flex flex-col gap-3" data-bare-beside>
        <p className="text-sm font-semibold" data-testid="dicetable-turn">
          {playing ? say.say("party.dice.turnPoints", { name: names[game.toPlay] ?? "", points: String(game.turnPoints) }) : ""}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={roll} disabled={!canMove || !playing} className={`${BUTTON_LEAD} ${canMove && playing ? BUTTON_STRONG : BUTTON_QUIET}`} data-testid="dicetable-roll">
            {say.say("party.dice.roll")}
          </button>
          <button type="button" onClick={() => onMove({ kind: "bank" })} disabled={!canBank} className={`${BUTTON_LEAD} ${BUTTON_QUIET}`} data-testid="dicetable-bank">
            {say.say("party.dice.bank", { points: String(game.turnPoints) })}
          </button>
        </div>
        <DiceScores names={names} figures={game.banked.map(String)} toPlay={playing ? game.toPlay : null} heading={say.say("party.dice.scoresTo", { points: String(game.size) })} marked={game.winners} />
      </div>
    </div>
  );
}
