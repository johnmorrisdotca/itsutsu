import { PICTURE_PX } from "./games.constants";
import type { PictureSize } from "./games.types";

/**
 * A picture's width and height at one of the two sizes, as an inline style.
 *
 * A STYLE RATHER THAN A CLASS, on purpose. Tailwind can only build a class it
 * finds written out whole, so `size-[140px]` would have to be typed as a second
 * literal beside `size-[70px]` — which is exactly the second number the large
 * size exists not to have. A style reads `PICTURE_PX`, where large is twice
 * regular by construction.
 */
export function pictureBox(size: PictureSize): { width: number; height: number } {
  const side = PICTURE_PX[size];
  return { width: side, height: side };
}
