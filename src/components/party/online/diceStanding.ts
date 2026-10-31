import type { Speaker } from "@/lib/i18n/i18n";
import type { DiceTableKind } from "@/lib/party/diceTable/diceTable.constants";
import { scoreWords } from "@/lib/party/diceTable/diceTableScore";
import { PACHISI_HOME } from "@/lib/party/pachisi/pachisi.constants";
import type { PachisiGame } from "@/lib/party/pachisi/pachisi.types";
import type { DiceWarTable } from "@/lib/party/online/onlineDice";
import { sheetTotal } from "@/lib/party/yacht/yachtScore";
import type { YachtGame } from "@/lib/party/yacht/yacht.types";

/** How a seat stands at each dice game, for its row in a table's seat list: free of the boards, which are loaded in the browser only. */
export const yachtStanding = (game: YachtGame, seat: number, say: Speaker): string => say.say("party.dice.points", { points: String(sheetTotal(game.sheets[seat] ?? [])) });

/** Pawns home, out of four. */
export const pachisiStanding = (game: PachisiGame, seat: number, say: Speaker): string => say.say("party.dice.home", { home: String((game.pawns[seat] ?? []).filter((pawn) => pawn === PACHISI_HOME).length) });

export const diceWarStanding = (table: DiceWarTable, seat: number, say: Speaker): string => say.say("party.dice.points", { points: String(table.game.scores[seat] ?? 0) });

type Counted = { banked?: readonly number[]; cups?: readonly (readonly number[])[]; counters?: readonly number[] };

/** Pig's and Ten Thousand's points, Liar's Dice's dice, Sayu's counters. */
export function diceTableStanding(kind: DiceTableKind): (game: Counted, seat: number, say: Speaker) => string {
  if (kind === "liarsDice") return (game, seat, say) => ((game.cups?.[seat]?.length ?? 0) === 0 ? say.say("party.dice.liars.out") : say.count("party.dice.liars.dice", game.cups![seat]!.length));
  if (kind === "sayu") return (game, seat, say) => say.count("party.dice.sayu.count", game.counters?.[seat] ?? 0);
  return (game, seat, say) => say.say("party.dice.points", { points: scoreWords(game.banked?.[seat] ?? 0) });
}
