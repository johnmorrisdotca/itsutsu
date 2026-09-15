import { THUMB_SIZE, gameThumbPath } from "@/lib/gomoku/artwork";

import type { PictureSize } from "./games.types";
import { pictureBox } from "./picture";
import { pictureOf } from "./gamePicture";

/**
 * The small board beside a game's name, in a list of games — THE ONE WAY a
 * game's picture is drawn.
 *
 * John, on /play: "it's all just text. very ugly and hard to scan. no icons or
 * images…" — and again on /games and a player's page: "Looks like we aren't
 * showing the icons for all the variant games in a family!… Strange how we
 * don't see icons in the Player pages, etc... that's a BUG too." Every game has
 * a screenshot of its own board, required by the New Game Gate, and a Reversi
 * board, a Halma star and a Hex grid tell themselves apart at forty pixels in a
 * way words do not. So this is the real board, cut to size once by
 * `pnpm art:thumbs` and served as a static file — see
 * scripts/make-game-thumbs.mjs for why not the optimiser.
 *
 * A plain <img>, on purpose, like the rules page's board: the file is already
 * the size it is drawn at, so there is nothing for next/image to do but add a
 * metered step. `width` and `height` are the file's own, so the row has its
 * shape before the picture arrives; `loading="lazy"` because a record page can
 * list fifty rows and a reader sees eight.
 *
 * AT ONE OF THE SITE'S THREE SIZES, never a class of its own: `size` is
 * "small" in a table, a ledger or a row of a list, "regular" on a card or a
 * tile (`PICTURE_PX`). It used to be named by where it sat — 48px on a card, 40
 * in a row, 24 in a table, 20 in a tag — then John asked for one regular size
 * everywhere, and then: "Tables keep small pictures". `className` is for
 * placing it — a margin, an alignment — and `gamePictures.coverage.test.ts`
 * refuses a size class there.
 *
 * DECORATIVE BY DEFAULT. Every list that draws this also prints the game's name
 * beside it, and a screen reader that hears "Gomoku board" and then "Gomoku"
 * has been told one thing twice. Pass `alt` where the picture is the only place
 * the game is named.
 *
 * It sits UNDER a row's stretched link, in flow and unpositioned, so a tap on
 * it opens the row and it is never a stop of its own.
 *
 * WHICH GAME is `pictureOf`'s answer, the same three ways `GameName` accepts — a
 * key, a slug, or a name another site gave it — so a name and its picture are
 * never about two different games. Two ways to have no answer, drawn
 * differently for a reason:
 *
 *  - a VARIANT this site no longer knows, in a row of games that were played
 *    here: a blank of the same size, so the row keeps its shape and nothing
 *    claims to be a board that is not one;
 *  - a NAME with no game here — "Backgammon" in a record kept from another
 *    site: nothing at all. That name is not a game of ours, and a blank square
 *    beside it would dress it up as one with its picture missing.
 */
export function GameThumb({
  variant,
  name,
  size,
  alt = "",
  className = "",
}: {
  /** The game, as its variant key or slug. */
  variant?: string;
  /** A name as another site wrote it, which is a game here only through its alias. */
  name?: string;
  /** One of the site's three picture sizes: small in a table or a row, regular on a card. */
  size: PictureSize;
  /** What it is a picture of, where the name is not already beside it. */
  alt?: string;
  /** Placement only — a margin or an alignment. Never a size. */
  className?: string;
}) {
  const frame = `shrink-0 rounded-md border border-rule ${className}`.trim();
  const box = pictureBox(size);
  const game = pictureOf({ variant, name });
  if (game === null) {
    if (variant === undefined) return null;
    return (
      <span aria-hidden="true" className={`${frame} inline-block bg-shade`} style={box} data-testid="game-thumb-blank" data-picture={size} />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a static thumbnail already cut to the size it is drawn at
    <img
      src={gameThumbPath(game)}
      alt={alt}
      width={THUMB_SIZE}
      height={THUMB_SIZE}
      loading="lazy"
      decoding="async"
      className={`${frame} object-cover`}
      style={box}
      data-testid="game-thumb"
      data-variant={game}
      data-picture={size}
    />
  );
}
