import { gameArtPath } from "@/lib/gomoku/artwork";
import type { Speaker } from "@/lib/i18n/i18n";
import { originFor, wikipediaUrl } from "@/lib/learn/origins";
import type { RulesPage } from "@/lib/learn/rulesPage";

import { CARD_GAME_LIST } from "../cardGames/cardGames.constants";
import { partyTable } from "../i18n/partyTables";
import { DICE_TABLE_KINDS } from "./diceTable/diceTable.constants";

import { partyCopy } from "./partyCopy";
import { partyBoardsWords, partyPlayersWords } from "./partyOfferedWords";
import { PARTY_TABLE_WORDS } from "./partyTableWords";
import type { PartyKind } from "./party.types";

export { partyBoardsWords, partyPlayersWords };

/** The games whose table on several devices keeps its dice or its deal on the server, and says so: named here so a rules page does not carry the online rows. */
const SERVER_DEALS: ReadonlySet<PartyKind> = new Set<PartyKind>(["yacht", "pachisi", "diceWar", ...DICE_TABLE_KINDS, ...CARD_GAME_LIST]);

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
  const house = [words.house, ...(words.more ?? []), ...(SERVER_DEALS.has(kind) ? [say.say("party.rules.serverDeals")] : []), say.say("party.rules.kept"), say.say("party.rules.never")];

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
