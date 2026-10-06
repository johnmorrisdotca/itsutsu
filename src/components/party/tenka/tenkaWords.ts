import { TENKA_STRINGS, continentNameIn, territoryNameIn } from "@johnmorrisdotca/tenka";
import type { TenkaContinent, TenkaMapKey, TenkaTerritoryData } from "@johnmorrisdotca/tenka";

import type { Speaker } from "@/lib/i18n/i18n";

import { tenkaWords } from "../partyWords";

/**
 * TENKA'S WORDS THAT ARE BUILT FROM A GAME OR A MAP, in the reader's language.
 *
 * A territory's and a continent's name are the package's own (`TENKA_STRINGS`, English and Japanese, from the
 * classic world and Europe maps; the Japanese names are the established ones for each place), read by the key the
 * map gives each, never by a name typed here. English keeps the map's own name, so what an English reader sees
 * and what a spec reads (`data-name`) are one.
 */

/** A territory's name as the reader reads it. */
export function territoryName(territory: Pick<TenkaTerritoryData, "key" | "name">, say: Speaker): string {
  return say.locale === "ja" ? territoryNameIn(TENKA_STRINGS.ja, territory.key) || territory.name : territory.name;
}

/** A continent's or a region's name as the reader reads it. */
export function continentName(continent: Pick<TenkaContinent, "key" | "name">, say: Speaker): string {
  return say.locale === "ja" ? continentNameIn(TENKA_STRINGS.ja, continent.key) || continent.name : continent.name;
}

/** "Round 3" for a game played to the last player standing, "Round 3 of 20" for one played for a number of rounds. */
export function tenkaRoundLine(say: Speaker, round: number, rounds: number, world: number): string {
  return rounds === world ? say.say("party.tenka.roundOne", { round: String(round) }) : say.say("party.tenka.roundOf", { round: String(round), rounds: String(rounds) });
}

/** What a length chip says: "The whole world", "All of Europe", or "10 rounds". */
export function tenkaLengthWords(say: Speaker, rounds: number, world: number, map: TenkaMapKey): string {
  if (rounds !== world) return say.say("party.tenka.lengthRounds", { count: String(rounds) });
  return say.say(map === "europe" ? "party.tenka.lengthEurope" : "party.tenka.lengthWorld");
}

/** The line under the set-up's map about how the game ends. */
export function tenkaLengthNote(say: Speaker, rounds: number, world: number, map: TenkaMapKey): string {
  if (rounds !== world) return say.say("party.tenka.noteRounds", { count: String(rounds) });
  return say.say(map === "europe" ? "party.tenka.noteEurope" : "party.tenka.noteWorld");
}

/** A held territory count, "5 territories" or 5領土, from the table's words. */
export function tenkaTerritoriesHeld(say: Speaker, count: number): string {
  return tenkaWords(say.locale).territories(count);
}

/** The package's own locale for the reader's: the two it has, and English for anything else. */
export function tenkaLocale(locale: string): "en" | "ja" {
  return locale === "ja" ? "ja" : "en";
}
