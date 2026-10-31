"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BUTTON_LEAD, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { SAYU_MOST_DICE, sayuFace } from "@/lib/party/sayu/sayu";
import type { SayuGame, SayuMove } from "@/lib/party/sayu/sayu.types";

import { DiceTray } from "../yacht/DiceTray";
import { DiceScores } from "./DiceScores";
import type { DiceBoardProps } from "./diceTable.types";

/** The word under a die for where its counter went. */
const FACE_WORDS = { left: "party.dice.sayu.left", right: "party.dice.sayu.right", pot: "party.dice.sayu.pot", keep: "party.dice.sayu.keep" } as const;

const SLOTS = Array.from({ length: SAYU_MOST_DICE }, (_, at) => at);

/**
 * SAYU'S TABLE: up to three dice in the tray, each saying under it where its
 * counter went, and everybody's counters with the pot. The dice are ordinary
 * dice: a colour-blind reader, a reader of Japanese and a reader who has never
 * played all read the same word under the same die.
 */
export function SayuBoard({ game, appearance, names, canMove, onMove }: DiceBoardProps<SayuGame, SayuMove>) {
  const say = useSpeaker();
  const playing = game.phase === "playing";
  const roll = () => {
    if (canMove && playing) onMove({ kind: "roll" });
  };
  const dice = SLOTS.map((at) => game.dice[at] ?? 0);
  const marks = dice.map((die) => (die === 0 ? "" : say.say(FACE_WORDS[sayuFace(die)])));
  const thrower = game.thrower;
  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="sayu-board" data-thrown={game.thrown} data-pot={game.pot} data-to-play={game.toPlay}>
      <p className="min-h-10 text-sm" data-testid="dicetable-news" aria-live="polite">
        {thrower === null ? say.say("party.dice.sayu.first", { counters: String(game.size) }) : say.say("party.dice.sayu.threw", { name: names[thrower] ?? "" })}
      </p>
      <DiceTray dice={dice} held={dice.map(() => true)} rolled={dice.map((die) => die !== 0)} rollKey={game.thrown} appearance={appearance} ringsHeld={false} marks={marks} onTray={canMove && playing ? roll : undefined} label={say.say("party.dice.tapTray")} />
      <div className="flex flex-col gap-3" data-bare-beside>
        <button type="button" onClick={roll} disabled={!canMove || !playing} className={`${BUTTON_LEAD} ${canMove && playing ? BUTTON_STRONG : BUTTON_QUIET}`} data-testid="dicetable-roll">
          {playing ? say.say("party.dice.sayu.roll", { dice: String(Math.min(game.counters[game.toPlay] ?? 0, SAYU_MOST_DICE)) }) : say.say("party.dice.roll")}
        </button>
        <DiceScores names={names} figures={game.counters.map(String)} toPlay={playing ? game.toPlay : null} heading={say.say("party.dice.sayu.counters")} foot={{ label: say.say("party.dice.sayu.pot"), figure: String(game.pot) }} marked={game.winners} />
      </div>
    </div>
  );
}
