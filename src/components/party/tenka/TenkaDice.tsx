import { useState } from "react";

import { PANEL_CLASS } from "@/components/ui/ui.constants";
import type { TenkaGame, TenkaOwner } from "@/lib/party/tenka/tenka.types";
import { TENKA_NEUTRAL } from "@/lib/party/tenka/tenka.constants";
import { tenkaMapOf } from "@/lib/party/tenka/tenkaMap";
import { tenkaPlayerName } from "@/lib/party/tenka/tenkaTurn";

import { TENKA_COPY } from "./tenka.constants";
import { DressedDieClient } from "./TenkaDressedClient";

/** One die, in its thrower's colour, drawn by Korokoro (`TenkaDressed.tsx`): the number said to a screen reader, and kept on the element for a spec. */
function Die({ value, owner, side, small, tumble, index, count }: { value: number; owner: TenkaOwner; side: "attack" | "defend"; small: boolean; tumble: boolean; index: number; count: number }) {
  const label = `${side === "attack" ? "Attacker's" : "Defender's"} die: ${value}`;
  return (
    <span className="flex shrink-0" role="img" aria-label={label} data-testid="tenka-die" data-value={value} data-face={value}>
      <DressedDieClient face={value} owner={owner} side={side} small={small} tumble={tumble} index={index} count={count} label={label} />
    </span>
  );
}

/** "Ann", or "the neutral army", as the middle of a sentence says it. */
function whoIs(game: TenkaGame, owner: TenkaOwner): string {
  return owner === TENKA_NEUTRAL ? "the neutral army" : tenkaPlayerName(game, owner);
}

const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * THE LAST ROLL OF THE TURN, as dice and in words: what each side threw (the
 * last throw of a run), what each lost in all, and whether the territory
 * fell. Before anything is thrown it is one quiet line and no bigger.
 *
 * `compact` is the phase bar's copy on a phone, where the panel beside the
 * map is out of sight under it: the dice a size smaller and the words
 * shorter, and nothing at all before the first throw.
 */
export function TenkaDice({ game, compact = false }: { game: TenkaGame; compact?: boolean }) {
  const roll = game.lastRoll;
  // Which throw this is since the table was opened: 0 for one already made (shown at rest), then 1, 2… for each made while it is open, which tumble onto the faces the game threw.
  const [seen, setSeen] = useState({ roll, throws: 0 });
  if (seen.roll !== roll) setSeen({ roll, throws: roll === null ? seen.throws : seen.throws + 1 });
  const tumble = seen.throws > 0;
  const dieCount = roll === null ? 0 : roll.attackDice.length + roll.defendDice.length;
  const testId = compact ? "tenka-bar-dice" : "tenka-dice";
  if (roll === null) {
    if (compact) return null;
    return (
      <p className={`${PANEL_CLASS} py-2 text-sm text-muted`} data-testid={testId} data-rolled="false">
        No dice thrown yet this turn.
      </p>
    );
  }
  const attacker = whoIs(game, roll.attacker);
  const defender = whoIs(game, roll.defender);
  const from = tenkaMapOf(game).territories[roll.from].name;
  const to = tenkaMapOf(game).territories[roll.to].name;
  const lost = (who: string, armies: number) => `${who} lost ${TENKA_COPY.armies(armies)}`;
  const losses = [roll.attackerLost > 0 ? lost(attacker, roll.attackerLost) : null, roll.defenderLost > 0 ? lost(defender, roll.defenderLost) : null].filter((one) => one !== null);
  const dice = (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1" data-testid={compact ? undefined : "tenka-attack-dice"}>
        {roll.attackDice.map((value, at) => (
          <Die key={`${seen.throws}-${at}`} value={value} owner={roll.attacker} side="attack" small={compact} tumble={tumble} index={at} count={dieCount} />
        ))}
      </span>
      <span className="text-xs text-muted">against</span>
      <span className="flex items-center gap-1" data-testid={compact ? undefined : "tenka-defend-dice"}>
        {roll.defendDice.map((value, at) => (
          <Die key={`${seen.throws}-${at}`} value={value} owner={roll.defender} side="defend" small={compact} tumble={tumble} index={roll.attackDice.length + at} count={dieCount} />
        ))}
      </span>
    </div>
  );
  if (compact) {
    return (
      <div className="flex flex-col gap-1" data-testid={testId} data-rolled="true" data-took={roll.took ? "true" : "false"}>
        {dice}
        <p className="text-xs">
          {roll.throws > 1 ? `${roll.throws} throws. ` : ""}
          {sentence(losses.join(", and "))}.{roll.took ? <strong>{` ${attacker} takes ${to}!`}</strong> : null}
        </p>
      </div>
    );
  }
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid={testId} data-rolled="true" data-took={roll.took ? "true" : "false"} data-throws={roll.throws}>
      {dice}
      <p className="text-sm" data-testid="tenka-roll-words">
        {roll.throws > 1 ? `${roll.throws} throws from ${from} into ${to}: ` : `${from} into ${to}: `}
        {attacker} threw {roll.attackDice.join(", ")}; {defender} threw {roll.defendDice.join(", ")}. {sentence(losses.join(", and "))}.
        {roll.took ? <strong data-testid="tenka-took"> {`${attacker} takes ${to}!`}</strong> : null}
      </p>
    </section>
  );
}
