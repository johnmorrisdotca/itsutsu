"use client";

import { useState } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BUTTON_LEAD, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { scoreWords } from "@/lib/party/diceTable/diceTableRules";
import { TEN_THOUSAND_DICE } from "@/lib/party/tenThousand/tenThousand";
import { diceInMask, tenThousandScore } from "@/lib/party/tenThousand/tenThousandScore";
import type { TenThousandGame, TenThousandMove } from "@/lib/party/tenThousand/tenThousand.types";

import { DiceTray } from "../yacht/DiceTray";
import { DiceScores } from "./DiceScores";
import type { DiceBoardProps } from "./diceTable.types";
import { SmallDice } from "./SmallDice";

const BLANK: readonly number[] = new Array<number>(TEN_THOUSAND_DICE).fill(0);

/** What the last move did, in a line. */
function news(game: TenThousandGame, names: readonly string[], say: ReturnType<typeof useSpeaker>): string {
  const last = game.last;
  if (last === null) return say.say("party.dice.ten.first", { points: String(game.size) });
  const name = names[last.seat] ?? "";
  if (last.kind === "bust") return say.say("party.dice.ten.bust", { name, points: String(last.lost) });
  if (last.kind === "banked") return say.say("party.dice.banked", { name, points: String(last.points) });
  if (last.kind === "kept") return last.hot ? say.say("party.dice.ten.hot", { name, points: String(last.points) }) : say.say("party.dice.ten.kept", { name, points: String(last.points) });
  return say.say("party.dice.ten.choose", { name });
}

/**
 * TEN THOUSAND'S TABLE: the six dice in the tray, what this turn has set aside
 * under it, and everybody's banked points. Tap the dice to set aside, and the
 * press says what they score; dice that score nothing together cannot be set
 * aside, and the press says so rather than refusing afterwards.
 */
export function TenThousandBoard({ game, appearance, names, canMove, onMove }: DiceBoardProps<TenThousandGame, TenThousandMove>) {
  const say = useSpeaker();
  const [choice, setChoice] = useState<{ at: number; mask: number }>({ at: -1, mask: 0 });
  const playing = game.phase === "playing";
  const at = game.thrown;
  const mask = choice.at === at ? choice.mask : 0;
  const choosing = canMove && playing && game.stage === "keep";
  const canRoll = canMove && playing && game.stage !== "keep";
  const canBank = canMove && playing && game.stage === "more";
  const chosen = diceInMask(game.dice, mask);
  const score = chosen.length === 0 ? null : tenThousandScore(chosen);
  const hot = game.stage === "more" && game.dice.length === 0;
  const left = game.stage === "roll" || hot ? TEN_THOUSAND_DICE : game.dice.length;
  // Six slots always, so the dice lie where they lay as the turn goes on.
  const shown = game.dice.length === 0 ? BLANK : [...game.dice, ...BLANK].slice(0, TEN_THOUSAND_DICE);
  const held = shown.map((_, die) => (mask & (1 << die)) !== 0);
  const roll = () => {
    if (canRoll) onMove({ kind: "roll" });
  };
  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="ten-thousand-board" data-stage={game.stage} data-thrown={game.thrown} data-turn-points={game.turnPoints} data-to-play={game.toPlay}>
      <p className="min-h-10 text-sm" data-testid="dicetable-news" aria-live="polite">
        {news(game, names, say)}
      </p>
      <DiceTray
        dice={shown}
        held={held}
        rolled={shown.map(() => game.stage === "keep")}
        rollKey={game.thrown}
        appearance={appearance}
        heldWord={say.say("party.dice.ten.asideMark")}
        onDie={choosing ? (die) => setChoice({ at, mask: mask ^ (1 << die) }) : undefined}
        onTray={canRoll ? roll : undefined}
        label={say.say("party.dice.tapTray")}
      />
      <div className="flex flex-col gap-3" data-bare-beside>
        <div className="flex min-h-9 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="font-semibold" data-testid="dicetable-turn">
            {playing ? say.say("party.dice.turnPoints", { name: names[game.toPlay] ?? "", points: String(game.turnPoints) }) : ""}
          </span>
          {game.aside.length === 0 ? null : <SmallDice dice={game.aside} label={say.say("party.dice.ten.aside")} testId="ten-thousand-aside" />}
        </div>
        {game.stage === "keep" && playing ? (
          <button type="button" onClick={() => onMove({ kind: "keep", mask })} disabled={!choosing || score === null} className={`${BUTTON_LEAD} ${choosing && score !== null ? BUTTON_STRONG : BUTTON_QUIET}`} data-testid="dicetable-keep" data-score={score ?? undefined}>
            {chosen.length === 0 ? say.say("party.dice.ten.chooseDice") : score === null ? say.say("party.dice.ten.notAll") : say.say("party.dice.ten.keep", { points: String(score) })}
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={roll} disabled={!canRoll} className={`${BUTTON_LEAD} ${canRoll ? BUTTON_STRONG : BUTTON_QUIET}`} data-testid="dicetable-roll">
              {say.say("party.dice.ten.rollDice", { dice: String(left) })}
            </button>
            <button type="button" onClick={() => onMove({ kind: "bank" })} disabled={!canBank} className={`${BUTTON_LEAD} ${BUTTON_QUIET}`} data-testid="dicetable-bank">
              {say.say("party.dice.bank", { points: String(game.turnPoints) })}
            </button>
          </div>
        )}
        <DiceScores names={names} figures={game.banked.map(scoreWords)} toPlay={playing ? game.toPlay : null} heading={game.lastRoundFrom === null ? say.say("party.dice.scoresTo", { points: scoreWords(game.size) }) : say.say("party.dice.ten.lastRound")} marked={game.winners} />
      </div>
    </div>
  );
}
