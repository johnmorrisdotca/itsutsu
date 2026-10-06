import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the clock.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer's pass (`review`).
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_CLOCK: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "clock.noneDescription": {
    text: "好きなだけ考えられます。",
    back: "You can think for as long as you like.",
    review: AGENT_READ,
  },
  "clock.blitzDescription": {
    text: "持ち時間3分、そのあと10秒の秒読みが3回。",
    back: "Time allowance 3 minutes, then three periods of 10-second byo-yomi.",
    review: AGENT_READ,
  },
  "clock.rapidDescription": {
    text: "持ち時間10分、そのあと30秒の秒読みが3回。",
    back: "Time allowance 10 minutes, then three periods of 30-second byo-yomi.",
    review: AGENT_READ,
  },
  "clock.classicalDescription": {
    text: "持ち時間30分、そのあと1分の秒読みが5回。",
    back: "Time allowance 30 minutes, then five periods of 1-minute byo-yomi.",
    review: AGENT_READ,
  },
};
