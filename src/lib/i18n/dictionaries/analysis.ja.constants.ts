import { AGENT_READ_2026_10_06, type CopyReview, type JaLine } from "../copyJa.types";
import type { Outlook } from "../../gomoku/analysis.types";

/**
 * The threat reading's words in Japanese, beside the English rows they sit
 * with: `OUTLOOK_DISPLAY` and `FATAL_MOVE_DISPLAY` in `analysis.constants.ts`,
 * which the measured ladder's fingerprint hashes (`ladderFingerprint.ts`), so
 * they are never edited for a translation. Everything else in that file is a
 * name with its own kanji (五連, 活四, 四三, 受け…), which a Japanese reader is
 * shown instead of the English (`Speaker.pairName`).
 *
 * The English label is a short heading beside a one-character kanji (受, 危,
 * 勝), and a character alone is not a Japanese heading, so each outlook has a
 * heading of its own here.
 */
export type OutlookCopyJa = {
  label: JaLine;
  detail: JaLine;
  review: CopyReview;
};

export const OUTLOOK_COPY_JA: Record<Outlook, OutlookCopyJa> = {
  won: {
    label: ["勝ち", "Won"],
    detail: ["5つ並びました。対局は終わりです。", "Five are in a row. The game is over."],
    review: AGENT_READ_2026_10_06,
  },
  winning: {
    label: ["必勝の形です", "It is a winning shape"],
    detail: ["相手が止められない線があります。見つけられますか？", "There is a line the other side cannot stop. Can you find it?"],
    review: AGENT_READ_2026_10_06,
  },
  ahead: {
    label: ["主導権があります", "You have the initiative"],
    detail: ["相手が答えているのは、こちらの狙いです。この調子で続けましょう。", "What the other side is answering is our threats. Let us keep going like this."],
    review: AGENT_READ_2026_10_06,
  },
  even: {
    label: ["互角", "Even"],
    detail: ["盤上に、強制されている手はまだありません。", "There is no forced move on the board yet."],
    review: AGENT_READ_2026_10_06,
  },
  danger: {
    label: ["受けが必要です", "A defence is needed"],
    detail: ["盤上に狙いがあります。受けないと、5つ並んでしまいます。", "There is a threat on the board. If it is not defended, five will be in a row."],
    review: AGENT_READ_2026_10_06,
  },
  critical: {
    label: ["あと1手で負けです", "One move from losing"],
    detail: ["いま、まさに正しい場所を止めないと、次の1手で決まってしまいます。", "If you do not stop exactly the right place now, the next move decides it."],
    review: AGENT_READ_2026_10_06,
  },
  lost: {
    label: ["敗勢です", "The position is lost"],
    detail: ["相手には止められない勝ちがあります。見つけられれば、ですが。", "The other side has a win that cannot be stopped, if they find it."],
    review: AGENT_READ_2026_10_06,
  },
};

export const FATAL_MOVE_COPY_JA: { label: JaLine; detail: JaLine; review: CopyReview } = {
  label: ["敗着", "Losing move"],
  detail: ["この手で勝負が決まってしまいました。この手の前までは、まだ戦える形でした。", "This move decided the game. Before this move, the position could still be fought."],
  review: AGENT_READ_2026_10_06,
};
