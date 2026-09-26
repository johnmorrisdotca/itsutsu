import type { MosaicPick } from "./mosaic.constants";

/**
 * One position of a game as the mosaic draws it — see `frameOf` — the number of
 * the move it followed, and that move's name on the board ("H8", "pass").
 */
export type MosaicFrame = { board: string; move: number; name: string };

/**
 * The words across the top of a picture: its name after the brand, and the
 * lines under it — the date, the event, the result, where the record came
 * from — joined with " · " and wrapped onto at most two lines.
 */
export type MosaicTitle = { name: string; details: readonly string[] };

/** Everything one picture needs: which positions, the board they sit on, the picture's shape in pixels and its title. */
export type MosaicPicture = {
  /** Every position there is; the picture shows as many as its grid holds, chosen by `pick`. */
  frames: readonly MosaicFrame[];
  pick: MosaicPick;
  size: number;
  grid: string;
  width: number;
  height: number;
  title: MosaicTitle;
};
