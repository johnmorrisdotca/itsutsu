import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the readmoves.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer's pass (`review`).
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_READMOVES: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "readmoves.unreadable": {
    text: "「{text}」を読み取れませんでした。",
    back: "\"{text}\" could not be read.",
    review: AGENT_READ,
  },
  "readmoves.pass": {
    text: "この手順にパスが含まれていますが、この盤はまだパスに対応していません。",
    back: "This list of moves contains a pass, but this board does not support passes yet.",
    review: AGENT_READ,
  },
  "readmoves.nothing": {
    text: "手を読み取れませんでした。「H8 K10 J9」のような並びか、SGFの棋譜を試してください。",
    back: "No moves could be read. Try a list like \"H8 K10 J9\", or an SGF record.",
    review: AGENT_READ,
  },
  "readmoves.offBoard": {
    text: "「{word}」は、{size}×{size}の盤上の点ではありません。",
    back: "\"{word}\" is not a point on a {size}×{size} board.",
    review: AGENT_READ,
  },
};
