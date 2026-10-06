import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the pieces.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer agent's pass (`review`), the same shape the
 * drafted dictionary's own rows take.
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_PIECES: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "pieces.refusal.free": {
    text: "{colour}なら空いています。",
    back: "{colour} is free.",
    review: AGENT_READ,
  },
  "pieces.seat.same": {
    text: "相手側はすでにその色で打っています。",
    back: "The other side is already playing in that colour.",
    review: AGENT_READ,
  },
  "pieces.seat.alike": {
    text: "その色は、相手側の駒と似すぎていて、見分けがつきません。",
    back: "That colour is too similar to the other side's pieces to tell them apart.",
    review: AGENT_READ,
  },
  "pieces.table.same": {
    text: "卓にいる別の人が、すでにその色を使っています。",
    back: "Another person at the table is already using that colour.",
    review: AGENT_READ,
  },
  "pieces.table.letter": {
    text: "別の人のビー玉に、その色の文字がついています。",
    back: "Another person's marble carries that colour's letter.",
    review: AGENT_READ,
  },
  "pieces.table.alike": {
    text: "その色は、別の人のビー玉と似すぎていて、見分けがつきません。",
    back: "That colour is too similar to another person's marbles to tell them apart.",
    review: AGENT_READ,
  },
};
