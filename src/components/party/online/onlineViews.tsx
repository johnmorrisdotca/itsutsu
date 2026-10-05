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
import dynamic from "next/dynamic";
import { gunjinStanding } from "./gunjinStanding";
import { sugorokuStanding } from "@/lib/party/sugoroku/sugorokuWords";
import { SUGOROKU_KIND_LIST, type SugorokuKind } from "@/lib/party/sugoroku/sugoroku.constants";

/**
 * The backgammon board at a table, loaded in the browser only: its drawing is the package's, and a page's server function does not carry it.
 * The table's first paint keeps the room the board will take.
 */
const SugorokuOnline = dynamic(() => import("./SugorokuOnline").then((module) => module.SugorokuOnline), {
  ssr: false,
  loading: () => <div className="min-h-[30rem]" data-testid="sugoroku-game" data-ready="false" aria-busy="true" />,
});

/**
 * Gunjin's board at a table, loaded in the browser only as the backgammon board is: its drawing and its engine are the package's.
 * The table's first paint keeps the room the board will take.
 */
const GunjinOnline = dynamic(() => import("./GunjinOnline").then((module) => module.GunjinOnline), {
  ssr: false,
  loading: () => <div className="min-h-[30rem]" data-testid="gunjin-game" data-ready="false" aria-busy="true" />,
});

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
  gunjin: { Board: GunjinOnline, standing: gunjinStanding, testId: "gunjin-game" },
  // The seven backgammon games share one board; it lies across, so, like Tenka's map, it is laid out wide, in its own shape (`tables`).
  ...(Object.fromEntries(SUGOROKU_KIND_LIST.map((kind) => [kind, { Board: SugorokuOnline, standing: sugorokuStanding, testId: "sugoroku-game", wide: true, tables: true }])) as Record<SugorokuKind, OnlineView<any, any>>), // eslint-disable-line @typescript-eslint/no-explicit-any -- as the table above.
};
