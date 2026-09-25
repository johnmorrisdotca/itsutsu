/**
 * THE COMPUTER PLAYERS, AS A NAME NEEDS THEM: their member ids and countries,
 * and nothing else.
 *
 * `PlayerName` draws a BOT badge and a flag beside every program's name, on
 * every page (John, 2026-09-25: "if it's a bot, it NEEDS the bot tag after the
 * name… All names should be code reuse"). It runs in the browser too, and the
 * full table in `bots.constants.ts` brings the engine's expert lists with it,
 * so this is the few bytes a name needs. `botNames.test.ts` holds it equal to
 * the full table, so a program added there fails the build until it is here.
 */
export const BOT_NAME_COUNTRIES: ReadonlyMap<string, string> = new Map([
  ["razryad", "Russia"],
  ["kyu", "Japan"],
  ["dan", "Japan"],
  ["meijin", "Japan"],
  ["guoshou", "China"],
  ["tamenoki", "Japan"],
  ["meritalu", "Estonia"],
  ["monkton", "United States"],
  ["tinsdale", "United States"],
  ["hondo", "Japan"],
  ["wuyi", "Taiwan"],
  ["rafa-duarte", "Brazil"],
  ["ingrid-solheim", "Norway"],
  ["amara-okafor", "Nigeria"],
  ["mina-park", "South Korea"],
  ["kenji-arakawa", "Japan"],
  ["li-wenjing", "China"],
]);

/** Whether a member id is one of the computer players. */
export function isBotName(memberId: string | null | undefined): boolean {
  return memberId !== null && memberId !== undefined && BOT_NAME_COUNTRIES.has(memberId);
}
