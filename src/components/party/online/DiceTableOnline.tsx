"use client";

import { AskIfAway } from "@/components/game/AskIfAway";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import type { DiceTableKind } from "@/lib/party/diceTable/diceTable.constants";
import type { DiceTableBase } from "@/lib/party/diceTable/diceTable.types";
import { seatedName } from "@/lib/party/partyNames";

import { DICE_TABLE_ROWS } from "../diceTable/diceTableRows";
import { onlineWords } from "../partyWords";
import type { OnlineBoardProps } from "./online.types";

/**
 * A PLAIN DICE GAME AT A TABLE ON SEVERAL DEVICES: the very board the table on one
 * device draws, its presses going to the server rather than the browser's own copy of
 * the rules. Nothing covers it between turns, since nobody else is looking at this
 * screen, and at Liar's Dice this seat was sent no cup but its own.
 */
export function DiceTableOnline({ kind, game, appearance, canMove, onMove, mySeat }: OnlineBoardProps<DiceTableBase<unknown>, unknown> & { kind: DiceTableKind }) {
  const say = useSpeaker();
  const ONLINE_COPY = onlineWords(say.locale);
  const row = DICE_TABLE_ROWS[kind];
  const names = game.players.map((_, seat) => seatedName(game, seat, say));
  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="dicetable-online" data-kind={kind} data-state={game.phase} data-to-play={game.toPlay}>
      <row.Board game={game} appearance={appearance} names={names} viewer={mySeat} canMove={canMove} onMove={onMove} />
      <AskIfAway watching={canMove && game.phase === "playing"} detail={ONLINE_COPY.idleDetail} kept={ONLINE_COPY.idleKept} />
    </div>
  );
}
