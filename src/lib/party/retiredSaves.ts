// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { PARTY_KINDS } from "./party.constants";
import { isOldTenkaSave } from "./tenka/tenkaOldSave";

/**
 * A GAME KEPT BY AN EARLIER VERSION OF ITS RULES, which the rules now refuse to
 * play out again (Tenka 2.0.0, 2026-10-02, changed both maps). The site holds
 * such a game as text in two places beside the browser's own: a game kept from
 * one device (`/games/<slug>/kept/<id>`) and a table on several devices, both
 * on `PartyTable.state`. Neither can be replayed, and neither is lost: who sat
 * where and how it stood are columns, not the replay, so the record, the
 * History row and the table's seats are all still true.
 *
 * Asked wherever a stored game would otherwise be offered as playable, so the
 * answer is "it ended with the old map" rather than a board that is blank or a
 * server that throws on the next move. A game that gains a major version of its
 * own adds its test here.
 */
export function retiredSave(game: string, state: string | null | undefined): boolean {
  return game === PARTY_KINDS.tenka && isOldTenkaSave(state);
}
