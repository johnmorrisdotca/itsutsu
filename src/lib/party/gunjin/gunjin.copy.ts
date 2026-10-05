// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import type { VariantCopy } from "../../gomoku/variants.constants";

/**
 * GUNJIN 軍人, hidden-rank military board games for two, 2026-10-05. John:
 * "The Stratego games should be pass and play, right? unless with a computer."
 *
 * The games are old and nobody's: the Japanese army chess it is named for, the
 * Filipino and Chinese games of the same family, and a capture-the-flag game on
 * the shape the best-known boxed one made familiar. The boxed game's name and
 * art are its owner's and appear nowhere here; the fourth board is called
 * Capture Flag, as the package calls it (`@johnmorrisdotca/gunjin`, MIT).
 */
export const GUNJIN_DISPLAY: VariantCopy = {
  label: "Gunjin",
  kanji: "軍人",
  tagline: "Two armies of hidden pieces: you know your own ranks, never theirs. Find the flag, and keep yours.",
  origin:
    /* Checked 2026-10-05 against the package's own rules notes (docs/RULES.md in its repository) for the four boards; the history is only what is common to all of them. */
    "A family of board games where every piece is hidden from the other side: you can see what yours are and have to guess at theirs, and a fight is settled by rank. Gunjin shogi, Japanese army chess, is the one it is named for, once played with an umpire who says who wins each fight and no more. Salpakan comes from the Philippines, Luzhanqi from China, and Capture Flag is the shape of the best-known boxed game of the kind. The rules of these games are nobody's; each board here is the package's own careful version of one of them.",
  alsoKnownAs: ["Army chess", "Military chess", "Hidden-piece chess"],
  country: "JP",
  wikipedia: "Gunjin Shōgi",
  rules: [
    "Choose a board, then each side arranges its pieces in secret on its own rows, one player at a time with the phone passed between. The arrangement is the first move: put the flag where it is hard to reach, mines and bombs where they will be struck.",
    "Then take turns moving one piece. Moves are along the rows and columns; how far depends on the piece. Move onto an enemy piece to fight it. Your own ranks are shown to you on your turn and the other side's are never shown.",
    "A fight is decided by rank, with the exceptions of each board: a spy beats a general, an engineer or miner defuses a mine or bomb, and a mine or bomb stops almost everything. Equal pieces remove each other. Only Capture Flag shows both ranks to both players when pieces fight; on the others you are told only what was taken.",
    "Win by taking the flag (or, on Gunjin Shogi, by reaching a headquarters; on Salpakan, by marching your flag home), or by leaving the other side with no move. Resign at any time.",
    "Between turns the phone is covered: the screen names who to pass it to and shows nothing of the board until they press that it is them.",
  ],
  board:
    "Gunjin Shogi (9×9, 31 pieces) is the one the game is named for and the default. Salpakan (9×8, 21 pieces) and Luzhanqi Mini (7×8, 14 pieces) are quicker. Capture Flag (10×10, 40 pieces, with lakes) is the long game. Pass one phone between two players, or play on two devices.",
};
