import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { RULE_VARIANTS } from "@/lib/gomoku/gomoku.constants";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";

/**
 * Every game name a kept record prints, decided once: the Itsutsu game it
 * actually is, or a plain statement that there is none here.
 *
 * So a legacy record's "Flipversi" line links straight to our own Reversi,
 * and its "Backgammon" says truthfully that it is not played here rather than
 * being forced onto something it isn't.
 *
 * AN ALIAS NAMES THE GAME, NOT THE BOARD. "Halma 10x10" leads to Halma's own
 * page, which offers the 10×10 board among its others; the record keeps its
 * own words for it. A name in neither table is drawn as plain italic text —
 * and that silence is the fault: Checkers was a game here for releases while
 * every record still called it one we did not have. The alias gate,
 * `gameAliases.coverage.test.ts`, fails the build when a recorded name is in
 * neither table, when a record uses a name one of our games goes by without
 * leading to it, or when a name is in both.
 */
export const GAME_ALIASES: Readonly<Record<string, RuleVariant>> = {
  // ItsYourTurn / GoldToken: five in a row, no restriction.
  "Go-Moku": RULE_VARIANTS.freestyle,
  "Go Moku": RULE_VARIANTS.freestyle,
  "Pro Go-Moku": RULE_VARIANTS.freestyle,
  "Large Go Moku": RULE_VARIANTS.freestyle,
  "Small Go Moku": RULE_VARIANTS.freestyle,

  // Pente and its capture-and-forbidden-shape cousin, Keryo Pente — the game
  // sannuki is itself inspired by (see RULE_VARIANT_DISPLAY.sannuki).
  Pente: RULE_VARIANTS.ninuki,
  "Pro Pente": RULE_VARIANTS.sannuki,
  "Keryo Pente": RULE_VARIANTS.sannuki,
  "Golden Pente": RULE_VARIANTS.ninuki,

  // The flipping game, under each site's own name for it.
  Reversi: RULE_VARIANTS.reversi,
  Flipversi: RULE_VARIANTS.reversi,
  "Flipversi 6x6": RULE_VARIANTS.miniReversi,
  "Flipversi 10x10": RULE_VARIANTS.grandReversi,
  "Anti-Flipversi": RULE_VARIANTS.antiReversi,
  "Anti-Flipversi 6x6": RULE_VARIANTS.antiReversi,

  // The race game, under the name every site gives it — and ItsYourTurn's
  // 10×10 table of it, which is the same step-or-jump race on a board our
  // Halma also offers.
  Halma: RULE_VARIANTS.halma,
  "Halma 10x10": RULE_VARIANTS.halma,

  // ItsYourTurn's Checkers is the English/American game on 8×8 with forced
  // capture, which is the game here.
  Checkers: RULE_VARIANTS.checkers,

  "Connect 6": RULE_VARIANTS.connect6,
  "Connect Six": RULE_VARIANTS.connect6,

  // Four in a column — the game dropFour is itself inspired by Connect Four.
  "Four In a Row": RULE_VARIANTS.dropFour,
  Stack4: RULE_VARIANTS.dropFour,
  "Stack 4x4": RULE_VARIANTS.dropFour,

  // GoldToken's own Four In a Row family, matched by mechanic against ours.
  "Cylindrical Four (Only) In a Row": RULE_VARIANTS.ringDrop,
  "Giveaway Four in a Row": RULE_VARIANTS.giveawayDrop,
  "Blackhole Four in a Row": RULE_VARIANTS.holeDrop,
  "Hotspot Four in a Row": RULE_VARIANTS.hotDrop,
  "Wormhole Four in a Row": RULE_VARIANTS.wormDrop,
  "Zero G Four in a Row": RULE_VARIANTS.edgeDrop,
};

const BACKGAMMON = "A backgammon game: dice and a race home, and nothing here is played with dice.";
const HIDDEN_FLEET = "A hidden-fleet guessing game; nothing here is played blind.";
const CARDS = "A card game; nothing here is played with cards.";

/**
 * The games a kept record names that have no game here, each with the reason.
 *
 * Said rather than merely left out, so "not a game played here" is a decision
 * somebody made about that name and not a name nobody looked at. When one of
 * these becomes a game here, it moves to `GAME_ALIASES` — the gate refuses a
 * name in both.
 */
export const NO_GAME_HERE: Readonly<Record<string, string>> = {
  // Checkers' relatives from ItsYourTurn. Only the standard game is played here.
  "Anti-Checkers": "Giveaway checkers, where losing every piece wins; only standard checkers is played here.",
  "Crowded Checkers": "A checkers variant with its own crowded starting position; only standard checkers is played here.",

  // Flipping games on boards ours do not have.
  Hexversi: "Reversi on a hexagonal board; every Reversi here is played on squares.",
  "Flipversi Blackhole 10x10": "Reversi on 10×10 with a blocked hole in the board; Grand Reversi here has no hole.",

  // The backgammon family, from both sites.
  Backgammon: BACKGAMMON,
  "Backgammon (3 Point)": BACKGAMMON,
  "Backgammon (5 Point)": BACKGAMMON,
  "Backgammon (7 Point)": BACKGAMMON,
  "Backgammon (9 Point)": BACKGAMMON,
  "Backgammon Level 2": BACKGAMMON,
  "Backgammon Level 3": BACKGAMMON,
  "Backgammon Race": BACKGAMMON,
  "Backgammon Race Level 2": BACKGAMMON,
  "Casual Backgammon": BACKGAMMON,
  "Pro Backgammon": BACKGAMMON,
  "Pro Backgammon Level 2": BACKGAMMON,
  "Pro Backgammon Race": BACKGAMMON,
  "Pro Backgammon-9": BACKGAMMON,
  "Anti-Backgammon": BACKGAMMON,
  Nackgammon: BACKGAMMON,
  "Nackgammon (3 Point)": BACKGAMMON,
  "Nackgammon (5 Point)": BACKGAMMON,
  "Nackgammon (7 Point)": BACKGAMMON,
  "Nackgammon (9 Point)": BACKGAMMON,
  "Pro Nackgammon": BACKGAMMON,
  "Long Gammon": BACKGAMMON,
  "Long Gammon (3 Point)": BACKGAMMON,
  "Long Gammon (5 Point)": BACKGAMMON,
  "Long Gammon (7 Point)": BACKGAMMON,
  "Long Gammon (9 Point)": BACKGAMMON,
  Hypergammon: BACKGAMMON,
  "Hypergammon (3 Point)": BACKGAMMON,
  "Hypergammon (5 Point)": BACKGAMMON,
  Tabula: BACKGAMMON,

  // Hidden fleets, cards, and GoldToken's own games.
  Battleboats: HIDDEN_FLEET,
  "Battleboats Plus": HIDDEN_FLEET,
  Salvo: HIDDEN_FLEET,
  "Hit&Miss Salvo": HIDDEN_FLEET,
  Skat: CARDS,
  Whist: CARDS,
  "Euro Domination": "GoldToken's game of conquest on a map of Europe; nothing like it is played here.",
  GoldFences: "GoldToken's fences game; nothing like it is played here.",
  Inverticade: "A GoldToken game of its own; nothing like it is played here.",
};

/** The Itsutsu variant a source site's own game name corresponds to, or null when there isn't one. */
export function aliasedVariant(gameName: string): RuleVariant | null {
  return GAME_ALIASES[gameName] ?? null;
}

/**
 * The other way round: every name the source sites gave one of our games,
 * for a page that says what a game is also known as. Only names that differ
 * from our own label are worth listing, and each once.
 *
 * A record's name for one of its BOARDS of our own game is not another name
 * for the game: "Halma 10x10" is Halma on 10×10, and a rules page saying Halma
 * is "also known as Halma 10x10" would be wrong. Those still link from the
 * record — that is the alias — and are left off this list.
 */
export function aliasesFor(variant: RuleVariant): string[] {
  const own = RULE_VARIANT_DISPLAY[variant].label.toLowerCase();
  const sizedOwn = new RegExp(`^${own.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\d+x\\d+$`);
  const names = Object.entries(GAME_ALIASES)
    .filter(([name, target]) => target === variant && name.toLowerCase() !== own && !sizedOwn.test(name.toLowerCase()))
    .map(([name]) => name);
  return [...new Set(names)];
}
