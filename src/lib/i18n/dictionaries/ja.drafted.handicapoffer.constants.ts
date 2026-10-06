import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the handicapoffer.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer's pass (`review`).
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_HANDICAPOFFER: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "handicapoffer.already": {
    text: "{game}では、{colour}にすでに決まっている規則です。",
    back: "Already a rule of {game} for {colour}.",
    review: AGENT_READ,
  },
  "handicapoffer.twoStones": {
    text: "1手に2つ置くゲームでのみ選べます。",
    back: "Only available in a game that places two stones a turn.",
    review: AGENT_READ,
  },
  "handicapoffer.captures": {
    text: "石を取れるゲームでのみ選べます。",
    back: "Only available in a game where stones can be captured.",
    review: AGENT_READ,
  },
};
