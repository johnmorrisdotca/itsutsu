import { PANEL_CLASS } from "@/components/ui/ui.constants";
import type { TenkaGame, TenkaOwner } from "@/lib/party/tenka/tenka.types";
import { usePartyMarbles } from "../partyMarbles";
import { TENKA_NEUTRAL } from "@/lib/party/tenka/tenka.constants";
import { TENKA_TERRITORIES } from "@/lib/party/tenka/tenkaMap";
import { tenkaPlayerName } from "@/lib/party/tenka/tenkaTurn";

import { TENKA_COPY } from "./tenka.constants";
import { ownerMarble } from "./TenkaChips";

/** Where each pip of a face sits on a three-by-three grid, 0 to 8 from the top left. */
const PIPS: Record<number, readonly number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

/** One die, in its thrower's colour: the pips drawn, the number said to a screen reader. */
function Die({ value, owner, small }: { value: number; owner: TenkaOwner; small: boolean }) {
  // Every place's marble as this table shows it, with any colour a player chose (`usePartyMarbles`).
  const marbles = usePartyMarbles();
  const marble = ownerMarble(owner, marbles);
  return (
    <svg viewBox="0 0 30 30" className={`${small ? "size-7" : "size-9"} shrink-0`} role="img" aria-label={String(value)} data-testid="tenka-die" data-value={value}>
      <rect x={1} y={1} width={28} height={28} rx={6} fill={marble.fill} stroke="rgba(0,0,0,0.55)" strokeWidth={1.2} />
      {PIPS[value].map((pip) => (
        <circle key={pip} cx={7.5 + (pip % 3) * 7.5} cy={7.5 + Math.floor(pip / 3) * 7.5} r={2.6} fill={marble.ink} />
      ))}
    </svg>
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
  const from = TENKA_TERRITORIES[roll.from].name;
  const to = TENKA_TERRITORIES[roll.to].name;
  const lost = (who: string, armies: number) => `${who} lost ${TENKA_COPY.armies(armies)}`;
  const losses = [roll.attackerLost > 0 ? lost(attacker, roll.attackerLost) : null, roll.defenderLost > 0 ? lost(defender, roll.defenderLost) : null].filter((one) => one !== null);
  const dice = (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1" data-testid={compact ? undefined : "tenka-attack-dice"}>
        {roll.attackDice.map((value, at) => (
          <Die key={at} value={value} owner={roll.attacker} small={compact} />
        ))}
      </span>
      <span className="text-xs text-muted">against</span>
      <span className="flex items-center gap-1" data-testid={compact ? undefined : "tenka-defend-dice"}>
        {roll.defendDice.map((value, at) => (
          <Die key={at} value={value} owner={roll.defender} small={compact} />
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
