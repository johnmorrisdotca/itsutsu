import type { ResultOutcome } from "@/lib/history/gameResult.types";

/** The headline said to a player, where the card speaks to "you": an English label beside its own kanji, which a Japanese reader is shown instead. */
export const RESULT_HEADLINES: Record<Exclude<ResultOutcome, "decided">, { label: string; kanji: string }> = {
  won: { label: "You won", kanji: "勝ち" },
  lost: { label: "You lost", kanji: "負け" },
  draw: { label: "Draw", kanji: "引き分け" },
};
