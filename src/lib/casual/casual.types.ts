/**
 * THE CASUAL GAMES: small games played alone on a phone or a desk, in a minute or
 * two a level, that the site keeps no record of. They are Karakuri's eight
 * (`@johnmorrisdotca/karakuri`), and `docs/plans/casual-games/README.md` says
 * why they are a kind of their own: they are not a rule variant (no two colours, no
 * engine, no ladder), not a puzzle (a puzzle here is checked by the server and
 * earns points), and not a party game (a party is who sits round the table).
 */
export type CasualKind = "saveTheCharacter" | "pinRescue" | "nutsAndBolts" | "stretchGrabber" | "gridEscape" | "ropeCut" | "tubeSort" | "choiceStory";

/** What a casual game is, apart from its words. */
export type CasualSpec = {
  /** The game's id in the package (`@johnmorrisdotca/karakuri`), which is also its address. */
  id: string;
  /** How many levels it has: the package's `KARAKURI_GAMES[id].levels`, which a test holds this to. */
  levels: number;
  /** Whether the board needs a drag (the page stops scrolling under a finger on it) or only taps. */
  gesture: "drag" | "tap";
  /** Whether it runs the package's physics. */
  physics: boolean;
};
