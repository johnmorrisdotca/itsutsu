import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { THUMB_SIZE, gameThumbPath } from "@/lib/gomoku/artwork";

/**
 * The small board beside a game's name, in a list of games.
 *
 * John, on /play: "it's all just text. very ugly and hard to scan. no
 * icons or images… Individual game family variants do not have icons, but
 * they should at least use the family icon." They have better than the
 * family's icon: every game has a screenshot of its own board, required by
 * the New Game Gate, and a Reversi board, a Halma star and a Hex grid tell
 * themselves apart at forty pixels in a way the family mark cannot. So this
 * is the real board, cut to size once by `pnpm art:thumbs` and served as a
 * static file — see scripts/make-game-thumbs.mjs for why not the optimiser.
 *
 * A plain <img>, on purpose, like the rules page's board: the file is
 * already the size it is drawn at, so there is nothing for next/image to do
 * but add a metered step. `width` and `height` are the file's own, so the
 * row has its shape before the picture arrives; `loading="lazy"` because a
 * record page can list fifty rows and a reader sees eight.
 *
 * DECORATIVE BY DEFAULT. Every list that draws this also prints the game's
 * name beside it, and a screen reader that hears "Gomoku board" and then
 * "Gomoku" has been told one thing twice. Pass `alt` where the picture is
 * the only place the game is named.
 *
 * It sits UNDER a row's stretched link, in flow and unpositioned, so a tap
 * on it opens the row and it is never a stop of its own.
 *
 * A game this site no longer knows — a row kept from before a game was
 * renamed — gets a blank of the same size rather than a broken picture: the
 * row keeps its shape, and nothing claims to be a board that is not one.
 */
export function GameThumb({
  variant,
  alt = "",
  className = "size-10",
}: {
  /** The game, as its variant key. */
  variant: string;
  /** What it is a picture of, where the name is not already beside it. */
  alt?: string;
  /** Its size — `size-10` in a row, `size-6` in a table cell. */
  className?: string;
}) {
  const frame = `shrink-0 rounded-md border border-rule ${className}`;
  if (!(variant in RULE_VARIANT_DISPLAY)) {
    return <span aria-hidden="true" className={`${frame} bg-shade`} data-testid="game-thumb-blank" />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a static thumbnail already cut to the size it is drawn at
    <img
      src={gameThumbPath(variant)}
      alt={alt}
      width={THUMB_SIZE}
      height={THUMB_SIZE}
      loading="lazy"
      decoding="async"
      className={`${frame} object-cover`}
      data-testid="game-thumb"
      data-variant={variant}
    />
  );
}
