import type { PhraseKey } from "../i18n.constants";

/**
 * Japanese the site already spoke.
 *
 * Every phrase here is a word that is **already on the site**, in John's own
 * voice, published and read long before any of this existed — the kanji
 * beside a heading, lifted verbatim to become the heading itself for a reader
 * of that script. None of it was translated by anybody. Nothing in this file
 * needs checking by a Japanese reader, because nothing in it is new.
 *
 * That is the whole reason it is a separate file from `ja.drafted.constants`.
 * The site's owner does not read Japanese, so "which of these words did a
 * machine make up" is a question he has to be able to answer by looking,
 * not by asking. Here the answer is none of them.
 *
 * `where` is not a comment: `japanese.coverage.test.ts` greps the source tree
 * for each of these strings and fails if it is no longer there. When it
 * fires, the site has stopped saying that word somewhere — and the entry has
 * quietly become a translation, which means it belongs in the drafted file
 * with the rest of the text somebody still has to read.
 */
export const JA_ALREADY_SAID: Partial<Record<PhraseKey, { text: string; where: string }>> = {
  "nav.about": { text: "五つについて", where: "the About page's own heading" },
  "nav.rules": { text: "規則", where: "the Rules trail and heading on a game's rules page" },
  "nav.record": { text: "棋譜", where: "the Record page's title" },
  "nav.players": { text: "対局者", where: "the Players page heading" },
  "nav.everyGame": { text: "全種目", where: "the Every game heading on /games, over the catalogue" },
  "nav.learn": { text: "学び", where: "the Learn heading on its own page" },
  /*
   * The navigation lost its 管理 in 0.124.0 and the Admin page's own heading
   * kept it, which is what keeps this entry on this side of the line: the
   * word is still published, so showing it to a Japanese reader says nothing
   * new. It is also on the join form and the operator's badge.
   */
  "nav.admin": { text: "管理", where: "the Admin page's own heading, the join form, and the operator badge" },

  "filter.board": { text: "盤", where: "the Board section of every rules page" },
  "filter.rules": { text: "規則", where: "the Rules field in the record's filter bar" },

  "rules.object": { text: "目的", where: "the Object section of every rules page" },
  "rules.board": { text: "盤", where: "the Board section of every rules page" },
  "rules.play": { text: "手順", where: "the Play section of every rules page" },
  "rules.house": { text: "細則", where: "the House rules section of every rules page" },
  "rules.learn": { text: "学び", where: "the Learn panel in a game's rules sidebar" },
};
