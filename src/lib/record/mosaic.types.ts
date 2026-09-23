/**
 * One position of a game as the mosaic draws it — see `frameOf` — the number of
 * the move it followed, and that move's name on the board ("H8", "pass").
 */
export type MosaicFrame = { board: string; move: number; name: string };

/** Everything one picture needs: which positions, the board they sit on, and the picture's shape in pixels. */
export type MosaicPicture = {
  frames: readonly MosaicFrame[];
  size: number;
  grid: string;
  width: number;
  height: number;
  /**
   * What goes in the spaces the last row leaves over. Filled, each is an empty
   * board and the last one carries `details`; left, they are the dark ground.
   * John: "visually possibly disturbing to see all black and part of the screen."
   */
  fillSpare: boolean;
  /** The game's own lines — who, what, how it ended, when — for the last spare space. */
  details: readonly string[];
};
