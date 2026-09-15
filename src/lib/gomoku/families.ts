import type { AlsoListing, GameFamily, ShelvedGame } from "./families.types";
import type { RuleVariant } from "./gomoku.types";

/**
 * The games grouped the way a newcomer should meet them: one first, then
 * families.
 *
 * **`key` IS AN IDENTITY AND `title` IS DISPLAY**, and the two are kept apart
 * because something now stores one of them. The XP ledger pays `firstOfFamily`
 * once per family and remembers which by writing the family down — so if that
 * were the title, renaming "Small boards" to "Quick games" would make every
 * member's first game of the renamed family a family they had never met, and
 * pay 50 XP again to everybody. Nothing would report it: a re-award is a
 * perfectly ordinary row.
 *
 * So a key is chosen once and never changed, and the title is free to be
 * reworded. `XP_DESIGN.md` flagged this as the honest trade of using a display
 * string as an identity and left the decision to whoever wired the tour; this
 * is that decision, taken the other way. Kebab-case, matching the addresses
 * this site builds elsewhere.
 *
 * **`games` IS A GAME'S HOME**, exactly one family each. A game may also be
 * shown on another family's shelf — see `ALSO_LISTED_IN` — but it lives here.
 */
export const GAME_FAMILIES: GameFamily[] = [
  {
    key: "five-in-a-row",
    title: "Five in a row",
    kanji: "五目",
    blurb: "The classic and its tournament forms. Start with Gomoku; the rest tighten the rules.",
    games: ["freestyle", "standard", "renju", "omok", "caro", "connect6", "misereFive"],
  },
  {
    key: "captures",
    title: "Captures",
    kanji: "取り",
    blurb: "Five in a row, or take enough of the other side's stones.",
    games: ["ninuki", "sannuki"],
  },
  {
    key: "drops",
    title: "Drops",
    kanji: "落とし",
    blurb: "Stones fall to the bottom of their column. Quick, and good on a phone.",
    games: ["dropFour", "ringDrop", "holeDrop", "hotDrop", "clearDrop", "giveawayDrop", "edgeDrop", "wormDrop"],
  },
  {
    key: "pieces-and-twists",
    title: "Pieces and twists",
    kanji: "駒と回し",
    blurb: "Our own games: lay dominoes or blocks from a shared queue, or turn the board after every stone.",
    games: ["dominoFive", "blockFive", "twistFive", "twistFour"],
  },
  {
    key: "flips",
    title: "Flips",
    kanji: "反転",
    blurb: "Nothing is yours until the end. Bracket a run of the other colour and it turns.",
    games: ["reversi", "classicReversi", "antiReversi", "miniReversi", "grandReversi"],
  },
  {
    key: "strange-boards",
    title: "Strange boards",
    kanji: "変盤",
    blurb: "Five in a row, on a board that does not behave: edges that join, and squares you cannot use.",
    games: ["toroidalFive", "obstacleFive"],
  },
  {
    key: "races",
    title: "Races",
    kanji: "競走",
    blurb: "No lines and nothing captured. Get every piece across the board before the other side does.",
    games: ["halma", "chineseCheckers"],
  },
  {
    key: "connections",
    title: "Connections",
    kanji: "連結",
    blurb: "No lines and nothing taken. Join your own two sides of the board before the other side joins theirs.",
    games: ["hex"],
  },
  {
    key: "checkers",
    title: "Checkers",
    kanji: "チェッカー",
    blurb: "No lines, no queue, no board full of stones. Jump the other side's pieces off, or be left with no move at all.",
    games: ["checkers", "internationalDraughts", "brazilianDraughts", "canadianCheckers", "russianDraughts", "poolCheckers"],
  },
  {
    key: "territory",
    title: "Territory",
    kanji: "陣地",
    blurb: "No lines, nothing moves, and stones are captured whole. Surround more of the board than the other side.",
    games: ["go"],
  },
  {
    key: "small-boards",
    title: "Small boards",
    kanji: "小盤",
    blurb: "Games you can read to the end, and games where the trick is what you must not do.",
    games: ["tictactoe", "wildTicTacToe", "notakto", "trapThree", "squareFour", "makerBreaker"],
  },
];

/**
 * THE OTHER SHELVES A GAME IS FOUND ON, declared by the game.
 *
 * John, 2026-09-15: Small boards held Tic-tac-toe, a three-in-a-row, and had no
 * small Reversi, though one would belong there just as much. A family is a way
 * of finding a game, not a filing cabinet — so a game may be listed on another
 * family's shelf, for discovery, under three rules:
 *
 *  - ONE GAME, ONE IDENTITY. A listing is the same variant shown twice — the
 *    same rules, ratings, record and address — never a copy, and picking it
 *    from either shelf starts the same game. Its HOME is the family whose
 *    `games` holds it, and everything that must count a game once reads the
 *    home and only the home: its family page (`familyPath`), "also in this
 *    family" (`siblingsOf`), a family's figures on /games, and the XP for a
 *    first game of a family or a family won (`familyKeyOf`, `familyToWin`).
 *    So a guest adds no game, no play and no crown to the shelf it visits.
 *  - SAY WHERE ELSE IT LIVES. Every shelf that shows a guest says "also under"
 *    its home, so the repetition reads as meant.
 *  - A SHELF, NOT A CATALOGUE. Only a game somebody looking at that family for
 *    that family's reason would want to find, with the reason beside it — not
 *    every small variant of every game. `variants.coverage.test.ts` refuses a
 *    listing with no reason, one on the game's own family or a family that does
 *    not exist, and a game shown twice on one shelf.
 */
export const ALSO_LISTED_IN: Partial<Record<RuleVariant, readonly AlsoListing[]>> = {
  miniReversi: [
    {
      family: "small-boards",
      why: "Reversi on a 4×4 or 6×6 board is over in minutes: the quick small game somebody opening this shelf is after.",
    },
  ],
  twistFour: [
    {
      family: "small-boards",
      why: "Four in a row on a 4×4 board whose quarters turn: as small and as quick as Tic-tac-toe, with a trick in it.",
    },
  ],
};

/** Whether a family's shelf shows this game, at home or as a guest. */
export function familyShows(family: GameFamily, variant: RuleVariant): boolean {
  return (
    family.games.includes(variant) || (ALSO_LISTED_IN[variant] ?? []).some((listing) => listing.family === family.key)
  );
}

/**
 * The games a family's shelf shows: its own, in their load-bearing order, then
 * the guests listed on it from other families, each carrying its home.
 *
 * A family's COUNTS read `family.games`, never this: a guest is counted once,
 * at home.
 */
export function gamesShownIn(family: GameFamily): ShelvedGame[] {
  const own: ShelvedGame[] = family.games.map((variant) => ({ variant, listed: "home" }));
  const guests = (Object.keys(ALSO_LISTED_IN) as RuleVariant[]).flatMap((variant): ShelvedGame[] => {
    const home = familyOf(variant);
    const listedHere = (ALSO_LISTED_IN[variant] ?? []).some((listing) => listing.family === family.key);
    return home === null || home.key === family.key || !listedHere ? [] : [{ variant, listed: "shelf", home }];
  });
  return [...own, ...guests];
}

/** The other games in the family a variant belongs to, for "also try" links. */
export function siblingsOf(variant: RuleVariant): { family: (typeof GAME_FAMILIES)[number]; games: RuleVariant[] } | null {
  const family = GAME_FAMILIES.find((entry) => entry.games.includes(variant));
  if (family === undefined) return null;
  return { family, games: family.games.filter((game) => game !== variant) };
}

/**
 * The family a variant belongs to, whole — the game itself included.
 *
 * Deliberately not `siblingsOf`, which leaves the game out because it exists
 * to say "also try". A family PAGE is about the family, and a list of a
 * family's games that omits the one you are standing in is a list that is
 * wrong about the family. Two questions, two functions.
 */
export function familyOf(variant: RuleVariant): (typeof GAME_FAMILIES)[number] | null {
  return GAME_FAMILIES.find((entry) => entry.games.includes(variant)) ?? null;
}

/**
 * The key of the family a variant belongs to, or null when it is in none.
 *
 * Null rather than the variant's own name or an empty string, and the caller
 * has to deal with it: the XP ledger keys an award on this, and a stand-in
 * value would be a family that does not exist earning a family's award. Every
 * variant is in a family today and `variants.coverage.test.ts` keeps it that
 * way, so null is the answer to a question about a game that has not been put
 * in one yet — which is a thing to stay silent about, not to guess at.
 */
export function familyKeyOf(variant: RuleVariant): string | null {
  return familyOf(variant)?.key ?? null;
}
