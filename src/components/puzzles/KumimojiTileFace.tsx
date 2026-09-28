import type { CSSProperties } from "react";

import type { TileFaceOf } from "@/lib/puzzles/kumimoji/tileFace";

/** The brand's charcoal and ivory (`/brand/itsutsu-avatar-charcoal.svg`), fixed in both themes as the white tile is. */
const WILD_STYLE: CSSProperties = { backgroundColor: "#22231f", color: "#fffef9" };

/** A tile's style with a wild's colours laid over it. */
export function wildStyle(face: TileFaceOf, style: CSSProperties): CSSProperties {
  return face.wild ? { ...style, ...WILD_STYLE } : style;
}

/**
 * THE INSIDE OF A TILE, in the tray, on the table and under the finger.
 *
 * A Japanese tile shows the other forms it plays as small in its top corner:
 * ゆ with ゅ, は with ば and ぱ, お with を. The WILD is the site's own mark:
 * John, 2026-09-28, "it should be the LOGO or Itsutsu kanji or the 5 dots
 * kanji in a cool design" — the 五 of 五つ in charcoal and ivory, over the five
 * stones of the logo. Once given a letter it shows that letter and stays
 * charcoal, so a wild is never mistaken for a tile of the set.
 */
export function TileFace({ face }: { face: TileFaceOf }) {
  return (
    <>
      <span className={face.blank ? "translate-y-[-10%] font-mincho" : undefined}>{face.glyph}</span>
      {face.forms === "" ? null : (
        <span aria-hidden="true" className="absolute right-[7%] top-[5%] text-[0.34em] font-normal leading-none opacity-75" data-testid="kumimoji-tile-forms">
          {face.forms}
        </span>
      )}
      {face.blank ? <WildStones /> : null}
    </>
  );
}

/** The logo's five stones — dark, light, light, light, dark — drawn ivory on the charcoal tile. */
function WildStones() {
  return (
    <svg aria-hidden="true" viewBox="0 0 208 52" className="absolute bottom-[9%] left-1/2 w-[62%] -translate-x-1/2">
      {[20, 62, 104, 146, 188].map((x, at) => (
        <circle key={x} cx={x} cy={26} r={15} fill={at === 0 || at === 4 ? "#fffef9" : "#22231f"} stroke="#fffef9" strokeWidth={5} />
      ))}
    </svg>
  );
}
