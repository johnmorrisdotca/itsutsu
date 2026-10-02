// Relative, not `@/`: the browser specs import this file, and Playwright resolves no alias in what it imports.
import type { GameKey } from "../catalogue/gameKeys";

import type { AlsoListing } from "./families.types";

/*
 * Its own file since 2026-09-28, when Halma for four joined the Party games
 * shelf and `families.ts` reached its 500-line limit: the families are what a
 * game belongs to, and this is where else each is shown. `families.ts` reads
 * it for every shelf (`familyShows`, `gamesShownIn`).
 */

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
export const ALSO_LISTED_IN: Partial<Record<GameKey, readonly AlsoListing[]>> = {
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
  /*
   * THE BOARDS DRAWN ON HEXAGONS were listed here on Strange boards from
   * 2026-09-22 (John: "shouldn't Strange boards also include all Hex boards,
   * Rhombus?"), each keeping its home — Hex under Territory and races,
   * Hexversi under Turn and take. They came off on 2026-09-26 to make room
   * under the eight-game cap for the two rock games, Scattered Rocks and
   * Rockfall, whose home is Strange boards beside Obstacle Five: a guest adds
   * no game to a shelf, and these two are found at home. Putting them back is
   * two entries here, once the shelf has room for them again:
   *
   *   hex: family "strange-boards", "A rhombus of hexagons, and the only board
   *     here you win by crossing rather than by lining up."
   *   honeycomb: family "strange-boards", "Reversi on a hexagon of hexagons,
   *     where a stone has six neighbours instead of eight and the middle is
   *     sealed."
   *
   * (Chinese Checkers left the same shelf for the same cap — see its own
   * entry below.)
   */
  chineseCheckers: [
    /*
     * NOT ON STRANGE BOARDS ANY MORE, though its star is the strangest board
     * here. John, 2026-09-22: "I want to have MAX 8 items per family... so
     * strange boards has 9 items. what could be merged or taken out? Chinese
     * checkers?" It was the one game on three shelves — its home in Races
     * (Territory and races since 2026-09-24), and shown under Checkers for
     * its name and here for its board — so it is the one that could leave a
     * shelf and still be found twice.
     */
    /*
     * BY THE NAME, not by the rules. Nothing is captured in Chinese Checkers
     * and no piece is crowned, so it is not a game of draughts and its home
     * is with the races. But it is called Chinese Checkers, and the shelf marked
     * Checkers is the first place anybody looking for it will open. John,
     * 2026-09-22: "Checkers board should have Chinese checkers as well, since
     * the name." A shelf is for finding a game, and the name is how people
     * find this one.
     */
    {
      family: "checkers",
      why: "Checkers by name only: nothing is taken and nothing is crowned — you are racing your ten pieces to the far point of the star.",
    },
    /*
     * FOR THE STAR'S SIX POINTS. The rated game is for two, but the board was
     * made for six, and its own page offers the game for two, three, four or
     * six players passed round one device (`/games/chinese-checkers/pass-and-play`).
     */
    {
      family: "party",
      why: "Pass and play for up to six: two, three, four or six players round one device, each racing ten pieces across the star.",
    },
  ],
  /*
   * OFF PARTY GAMES, 2026-10-01. Folding Dice into it put seven games at home
   * there, and a shelf shows eight at most, its guests included, so one guest
   * stays: Chinese Checkers, the six-player table. Three left, each still
   * offered from its own page:
   *   - Pair Go, two teams of two (`/games/go/pass-and-play`);
   *   - Block Five for four, a corner each (`/games/block-five/pass-and-play`);
   *   - Kumimoji for up to eight (`/games/kumimoji/pass-and-play`).
   * Halma for four and Mahjong left the same shelf earlier, for the same cap.
   */
};
