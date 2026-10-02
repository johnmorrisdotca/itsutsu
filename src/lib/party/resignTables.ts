import { TRAIN_PHASES, type TrainGame } from "@johnmorrisdotca/domino";
import type { DiceWarGame } from "@johnmorrisdotca/korokoro";
import type { HitotsuGame } from "@johnmorrisdotca/hitotsu";

import { BLOCKS_STATUS } from "@/lib/gomoku/party/partyBlocks";
import type { PartyBlocksState } from "@/lib/gomoku/party/partyBlocks.types";
import { PARTY_STATUS } from "@/lib/gomoku/party/partyRace";
import type { PartyRaceState } from "@/lib/gomoku/party/partyRace.types";

import { DOTS_STATUS } from "./dotsAndBoxes/dotsAndBoxes";
import type { DotsGame } from "./dotsAndBoxes/dotsAndBoxes.types";
import { MANCALA_STATUS } from "./mancala/mancala";
import type { MancalaGame } from "./mancala/mancala.types";
import type { PachisiGame } from "./pachisi/pachisi.types";
import { resignWinners, resigning } from "./resign";
import { GHOST_PHASE } from "./superghost/superghost";
import type { GhostGame } from "./superghost/superghost.types";
import { TENKA_PHASES } from "./tenka/tenka.constants";
import type { TenkaGame } from "./tenka/tenka.types";
import { YACHT_PHASES } from "./yacht/yacht";
import type { YachtGame } from "./yacht/yacht.types";

/**
 * HOW EACH PASS-AND-PLAY GAME ENDS WHEN THE PLAYER TO MOVE RESIGNS, in the
 * engine's own terms for over (`resign.ts` has the rule): the other seat wins
 * at a table of two, nobody wins at a bigger one. Card games need no entry —
 * their engines come from a package, and their table reads the resignation
 * itself (`CardPlay`).
 */
const winnersOf = (game: { players: readonly unknown[] }, seat: number) => resignWinners(game.players.length, seat);

export const resignDots = (game: DotsGame, seat: number) => resigning(game, seat, { status: DOTS_STATUS.finished, winners: winnersOf(game, seat) });
export const resignGhost = (game: GhostGame, seat: number) => resigning(game, seat, { phase: GHOST_PHASE.finished, winners: winnersOf(game, seat) });
export const resignMancala = (game: MancalaGame, seat: number) => resigning(game, seat, { status: MANCALA_STATUS.finished, winners: winnersOf(game, seat) });
export const resignTrain = (game: TrainGame, seat: number) => resigning(game, seat, { phase: TRAIN_PHASES.finished, winners: winnersOf(game, seat) });
export const resignTenka = (game: TenkaGame, seat: number) => resigning(game, seat, { phase: TENKA_PHASES.over, winners: winnersOf(game, seat) });
export const resignYacht = (game: YachtGame, seat: number) => resigning(game, seat, { phase: YACHT_PHASES.finished, winners: winnersOf(game, seat) });
export const resignPachisi = (game: PachisiGame, seat: number) => resigning(game, seat, { phase: "finished", pending: [], winners: winnersOf(game, seat) });
export const resignHitotsu = (game: HitotsuGame, seat: number) => resigning(game, seat, { phase: "over", toPlay: null });
export const resignDiceWar = (game: DiceWarGame, seat: number) => resigning(game, seat, { phase: "over" });
export const resignBlocks = (game: PartyBlocksState, seat: number) => resigning(game, seat, { status: BLOCKS_STATUS.over });

/** A race table (Chinese Checkers, Halma, Checkers): won by the other of two; at a bigger table it stops with nobody the winner. */
export function resignRace<S extends PartyRaceState>(game: S, seat: number): S & { resignedBy: number } {
  const [winner] = winnersOf(game, seat);
  return resigning(game, seat, winner === undefined ? ({ status: PARTY_STATUS.stuck, winner: null } as Partial<S>) : ({ status: PARTY_STATUS.won, winner } as Partial<S>));
}
