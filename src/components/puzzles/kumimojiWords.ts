import { speaker, type Speaker } from "@/lib/i18n/i18n";
import { nameOf } from "@/lib/puzzles/kumimoji/party";
import type { PartyGame } from "@/lib/puzzles/kumimoji/party.types";
import { tileFace } from "@/lib/puzzles/kumimoji/tileFace";

/**
 * What a screen reader says for a tile, in the reader's language: its letter, or that it is a wild and what it
 * stands for. The package's own `tileDescription` says the same in English only, so the pages that draw a tile
 * hand this to the table and the tray instead (`KumimojiTable`'s `tileDescription`).
 */
export function tileSaid(say: Speaker): (tile: string) => string {
  return (tile) => {
    const face = tileFace(tile);
    if (!face.wild) return face.glyph.toUpperCase();
    return face.blank ? say.say("pkumi.tile.wildBlank") : say.say("pkumi.tile.wild", { glyph: face.glyph });
  };
}

/** The names of some players, in a line: "Ann, Bo and Cy", "アン、ボー、シー". */
export function inALine(say: Speaker, names: readonly string[]): string {
  return say.list(names);
}

/** The small dot between two facts in a caption: a spaced middle dot in English, a bare one in Japanese. */
export function dotOf(say: Speaker): string {
  return say.locale === "ja" ? "・" : " · ";
}

/**
 * A seat's name as the table shows it. A seat nobody named, and a computer's, are "Player 3" and "Computer 2"
 * in the game (the package gives them those names); a Japanese reader is shown them in Japanese, and a name a
 * person typed is shown as typed.
 */
export function seatName(say: Speaker, game: PartyGame, at: number): string {
  const name = nameOf(game, at);
  const number = /(\d+)$/.exec(name)?.[1];
  if (number === undefined) return name;
  const english = speaker("en");
  for (const key of ["pkumi.party.playerLabel", "pkumi.party.computerName"] as const) {
    if (name === english.say(key, { n: number })) return say.say(key, { n: number });
  }
  return name;
}
