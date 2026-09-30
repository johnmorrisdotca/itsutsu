"use client";

import type { PartyCheckersState } from "@/lib/gomoku/party/partyCheckers.types";
import type { PartyHalmaState } from "@/lib/gomoku/party/partyHalma.types";
import type { DotsGame } from "@/lib/party/dotsAndBoxes/dotsAndBoxes.types";
import type { RaceMove } from "@/lib/party/online/onlineGames";
import type { OnlineGameKey } from "@/lib/party/online/online.types";

import { DOTS_COPY } from "../party.constants";
import type { OnlineBoardProps, OnlineView } from "./online.types";
import { CHECKERS_RACE, HALMA_RACE } from "../partyRaces";
import { DotsOnline } from "./DotsOnline";
import { RaceOnline } from "./RaceOnline";
import { BlocksOnline, blocksStanding } from "./BlocksOnline";
import { GhostOnline, ghostStanding } from "./GhostOnline";
import { KumimojiOnline, kumimojiStanding } from "./KumimojiOnline";
import { MancalaOnline, mancalaStanding } from "./MancalaOnline";
import { PairGoOnline, pairGoStanding } from "./PairGoOnline";
import { TenkaOnline, tenkaStanding } from "./TenkaOnline";
import { TrainOnline, trainStanding } from "./TrainOnline";
import { HitotsuOnline, hitotsuStanding } from "./HitotsuOnline";

/**
 * EACH GAME'S BOARD AT A TABLE ON SEVERAL DEVICES, by game: a `Record` over
 * `OnlineGameKey`, so a game that can be played online does not compile
 * without a board to draw it. The rules each is checked by are
 * `ONLINE_GAMES` (`lib/party/online/onlineGames.ts`); this only draws.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- each row's game and move are its own; the table reads one row at a time, through `onlineRulesOf`.
export const ONLINE_VIEWS: Record<OnlineGameKey, OnlineView<any, any>> = {
  dotsAndBoxes: {
    Board: DotsOnline,
    standing: (game: DotsGame, seat: number) => DOTS_COPY.boxes(game.scores[seat] ?? 0),
    testId: "dots-game",
  } satisfies OnlineView<DotsGame, number>,
  chineseCheckers: {
    Board: (props: OnlineBoardProps<PartyCheckersState, RaceMove>) => <RaceOnline kind={CHECKERS_RACE} {...props} />,
    standing: (game: PartyCheckersState, seat: number) => `${CHECKERS_RACE.rules.piecesHome(game, seat)} of ${CHECKERS_RACE.rules.piecesEach(game)} home`,
    testId: CHECKERS_RACE.testId,
  } satisfies OnlineView<PartyCheckersState, RaceMove>,
  halma: {
    Board: (props: OnlineBoardProps<PartyHalmaState, RaceMove>) => <RaceOnline kind={HALMA_RACE} {...props} />,
    standing: (game: PartyHalmaState, seat: number) => `${HALMA_RACE.rules.piecesHome(game, seat)} of ${HALMA_RACE.rules.piecesEach(game)} home`,
    testId: HALMA_RACE.testId,
  } satisfies OnlineView<PartyHalmaState, RaceMove>,
  blockFive: { Board: BlocksOnline, standing: blocksStanding, testId: "party-blocks" },
  go: { Board: PairGoOnline, standing: pairGoStanding, testId: "pairgo" },
  kumimoji: { Board: KumimojiOnline, standing: kumimojiStanding, testId: "kumimoji-online" },
  superghost: { Board: GhostOnline, standing: ghostStanding, testId: "ghost-game" },
  mancala: { Board: MancalaOnline, standing: mancalaStanding, testId: "mancala-game" },
  tenka: { Board: TenkaOnline, standing: tenkaStanding, testId: "tenka-game", wide: true },
  mexicanTrain: { Board: TrainOnline, standing: trainStanding, testId: "train-game" },
  hitotsu: { Board: HitotsuOnline, standing: hitotsuStanding, testId: "hitotsu-game" },
};
