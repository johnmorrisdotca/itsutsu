"use client";

import { useState } from "react";

import { AskIfAway } from "@/components/game/AskIfAway";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BUTTON_LEAD, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { YACHT_ROLLS } from "@/lib/party/yacht/yacht.constants";
import { YACHT_PHASES, isHeld } from "@/lib/party/yacht/yacht";
import type { YachtGame, YachtMove } from "@/lib/party/yacht/yacht.types";

import { onlineWords, yachtWords } from "../partyWords";
import { DiceTray } from "../yacht/DiceTray";
import { YachtSheet } from "../yacht/YachtSheet";
import { YachtTurnLine } from "../yacht/YachtTurnLine";
import type { OnlineBoardProps } from "./online.types";

/**
 * YACHT AT A TABLE ON SEVERAL DEVICES: the turn line, the tray and the sheet the table
 * on one device draws, pressed only on the reader's own turn. Which dice to hold is
 * the reader's until they throw, and is sent with the throw. The dice that fall are the
 * server's: a throw says which to hold and nothing about what comes up.
 */
export function YachtOnline({ game, appearance, canMove, onMove }: OnlineBoardProps<YachtGame, YachtMove>) {
  const say = useSpeaker();
  const YACHT_COPY = yachtWords(say.locale);
  const ONLINE_COPY = onlineWords(say.locale);
  const [choice, setChoice] = useState<{ at: string; mask: number } | null>(null);
  const playing = game.phase === YACHT_PHASES.playing;
  const at = `${game.turn}.${game.rolls}`;
  const mask = choice !== null && choice.at === at ? choice.mask : game.held;
  const canRoll = canMove && playing && game.rolls < YACHT_ROLLS;
  const canHold = canMove && playing && game.rolls > 0 && game.rolls < YACHT_ROLLS;
  const lastRoll = game.last !== null && game.last.move.kind === "roll" ? game.last.move.hold : null;
  const roll = () => {
    if (canRoll) onMove({ kind: "roll", hold: game.rolls === 0 ? 0 : mask });
  };
  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="yacht-game" data-state={game.phase} data-to-play={game.toPlay} data-rolls={game.rolls} data-thrown={game.thrown}>
      <YachtTurnLine game={game} />
      <DiceTray
        dice={game.dice}
        held={game.dice.map((_, die) => isHeld(mask, die))}
        rolled={game.dice.map((_, die) => lastRoll !== null && !isHeld(lastRoll, die))}
        rollKey={game.thrown}
        appearance={appearance}
        onDie={canHold ? (die) => setChoice({ at, mask: mask ^ (1 << die) }) : undefined}
        onTray={canRoll ? roll : undefined}
        label={canRoll ? YACHT_COPY.tapTray : YACHT_COPY.noRolls}
      />
      <div className="flex min-w-0 flex-col gap-3" data-bare-beside>
        {playing ? (
          <button type="button" onClick={roll} disabled={!canRoll} className={`${BUTTON_LEAD} ${canRoll ? BUTTON_STRONG : BUTTON_QUIET}`} data-testid="yacht-roll">
            {game.rolls === 0 ? YACHT_COPY.rollFirst : YACHT_COPY.roll}
          </button>
        ) : null}
        <YachtSheet game={game} onBox={canMove && playing ? (box) => onMove({ kind: "score", box }) : undefined} />
      </div>
      <AskIfAway watching={canMove && playing} detail={ONLINE_COPY.idleDetail} kept={ONLINE_COPY.idleKept} />
    </div>
  );
}
