import type { MyGameGroup } from "@/lib/history/myGames";

export const MY_GAMES_COPY = {
  title: { label: "Your games", kanji: "対局中" },
  groups: {
    yourMove: { label: "Your move", kanji: "手番", hint: "Waiting on you." },
    theirMove: { label: "Their move", kanji: "相手番", hint: "Waiting on the other side. You will be told when it is yours." },
    unstarted: { label: "Not started", kanji: "未着手", hint: "Boards with no stones yet. Hand out the other seat, or play first." },
    finished: { label: "Lately finished", kanji: "終局", hint: "Filed in the record." },
  } satisfies Record<MyGameGroup, { label: string; kanji: string; hint: string }>,
  stale: "Stale",
  staleHint: (days: number) => `No move for more than ${days} days. Resign it, or make a move.`,
  resign: { label: "Resign", kanji: "投了" },
  resignConfirm: "Resign this game? The other side wins and it is filed in the record.",
  localGame: { label: "On this device", kanji: "この端末" },
  continueGame: "Continue",
  yourTurn: (count: number) => (count === 1 ? "1 game waiting on you" : `${count} games waiting on you`),
} as const;
