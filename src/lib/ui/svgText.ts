/**
 * WHERE AN SVG TEXT'S BASELINE GOES, FOR THE TEXT TO SIT IN THE MIDDLE OF A POINT.
 *
 * John, 2026-09-25, on an iPhone looking at /games: "Images look wrong." Every
 * digit on the Numbers mark and every letter of GOMOJI sat a quarter of a
 * square high, across the lines rather than in their squares. They were
 * centred with `dominant-baseline="central"`, which Chrome honours and iPhone
 * Safari does not, so a desk showed them right and a phone did not.
 *
 * So the baseline is placed by hand, the same in every browser: the middle,
 * plus a little over a third of the font size. That is half a capital's or a
 * digit's height in the site's type, which is what these pictures print — a
 * digit, a capital, a short label. `svgText.coverage.test.ts` refuses
 * `dominant-baseline` anywhere under `src/`, so the phone cannot drift again.
 */
export const CENTRED_TEXT_DROP = 0.35;

/** The `y` to give an SVG `<text>` whose middle should be at `middle`, at `fontSize`. */
export function centredBaseline(middle: number, fontSize: number): number {
  return middle + fontSize * CENTRED_TEXT_DROP;
}
