import { gameArtPath } from "@/lib/gomoku/artwork";
import type { Speaker } from "@/lib/i18n/i18n";
import { originFor, wikipediaUrl } from "@/lib/learn/origins";
import type { RulesPage } from "@/lib/learn/rulesPage";

import { partyTable } from "../i18n/partyTables";

import { partyCopy } from "./partyCopy";
import { partyBoardsWords, partyPlayersWords } from "./partyOfferedWords";
import { PARTY_TABLE_WORDS } from "./partyTableWords";
import type { PartyKind } from "./party.types";

export { partyBoardsWords, partyPlayersWords };

/**
 * A party game's rules page, in the game template: Object, Board, Play, House.
 *
 * The same `RulesPage` shape a game builds from its spec and a puzzle from
 * its own (`puzzleRulesPage`), so the one rules page draws all three. The
 * facts come from the game's spec and its copy: the players and boards are
 * `PARTY_SPECS`'s, never a second description. The sentences are the reader's
 * language: the game's own copy through `partyCopy`, what its table says of
 * itself through `PARTY_TABLE_WORDS`, and the lines built from its spec
 * (`partyOfferedWords.ts`) through phrases.
 */
export function partyRulesPage(kind: PartyKind, say: Speaker): RulesPage {
  const copy = partyCopy(kind, say.locale);
  const words = partyTable(PARTY_TABLE_WORDS, "tableWords", say.locale)[kind];
  const object = [copy.tagline, copy.rules.at(-1) ?? copy.tagline];
  const board = [say.say("party.rules.played", { words: partyBoardsWords(kind, say), board: copy.board }), say.say("party.rules.forPlayers", { players: partyPlayersWords(kind, say) })];
  const play = [...copy.rules.slice(0, -1), words.turn];
  const house = [words.house, ...(words.more ?? []), say.say("party.rules.kept"), say.say("party.rules.never")];

  return {
    variant: kind,
    title: copy.label,
    kanji: copy.kanji,
    tagline: copy.tagline,
    origin: copy.origin,
    inspiredBy: copy.inspiredBy,
    alsoKnownAs: [...(copy.alsoKnownAs ?? [])],
    from: originFor(copy.country, say.locale),
    wikipedia: copy.wikipedia === undefined ? null : wikipediaUrl(copy.wikipedia),
    object,
    board,
    play,
    house,
    image: gameArtPath(kind),
  };
}
