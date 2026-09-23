/** One position of a game as the mosaic draws it — see `frameOf` — and the move it followed. */
export type MosaicFrame = { board: string; move: number };

/** Everything one picture needs: which positions, the board they sit on, and the picture's shape in pixels. */
export type MosaicPicture = {
  frames: readonly MosaicFrame[];
  size: number;
  grid: string;
  width: number;
  height: number;
};
