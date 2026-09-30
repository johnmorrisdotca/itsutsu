import { colourOf, faceOf, hitotsuWords, isWild } from "@/lib/party/hitotsu/hitotsuDeck";
import type { HitotsuCard, HitotsuColour } from "@/lib/party/hitotsu/hitotsu.types";
import { centredBaseline } from "@/lib/ui/svgText";

import { HITOTSU_COLOUR_LOOK, HITOTSU_FACE_MARK } from "./hitotsu.constants";

const QUARTERS: readonly HitotsuColour[] = ["R", "Y", "G", "B"];

/** The four colours in a ring's quarters: a wild's middle, and the back's. */
function Quarters({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      {QUARTERS.map((colour, at) => {
        const from = (at * Math.PI) / 2 - Math.PI / 2;
        const to = from + Math.PI / 2;
        const path = `M ${cx} ${cy} L ${cx + r * Math.cos(from)} ${cy + r * Math.sin(from)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(to)} ${cy + r * Math.sin(to)} Z`;
        return <path key={colour} d={path} fill={HITOTSU_COLOUR_LOOK[colour].fill} />;
      })}
    </g>
  );
}

/**
 * ONE HITOTSU CARD, face or back, as wide as its parent makes it and 7/5 as
 * tall: the deck's own design. A face is its colour inside a white edge, a
 * white diamond in the middle holding the number or symbol, the same in two
 * corners, and the colour's element in the other two, so no card is told by
 * colour alone. A wild is ink black with the four colours quartered in its
 * middle. The back is ink with 一つ in a ring of the four colours.
 *
 * A picture and not a control, as `PlayingCard` is: the hand wraps it in the
 * button that says its name. A face-down card names nothing.
 */
export function HitotsuCardView({ card, faceUp = true, chosen = false, called, className }: { card?: HitotsuCard; faceUp?: boolean; chosen?: boolean; called?: HitotsuColour; className?: string }) {
  const showing = faceUp && card !== undefined;
  const colour = showing ? colourOf(card) : null;
  const look = HITOTSU_COLOUR_LOOK[colour ?? "W"];
  const face = showing ? faceOf(card) : "";
  const mark = HITOTSU_FACE_MARK[face] ?? face;
  const wild = showing && isWild(card);
  return (
    <span
      className={`surface-light relative block aspect-[5/7] rounded-[9%/6.5%] shadow-[0_1px_2px_rgba(0,0,0,0.35)] transition-transform ${chosen ? "-translate-y-[6%] ring-[3px] ring-moss" : ""} ${className ?? ""}`}
      data-hitotsu-card={showing ? card : "back"}
      data-face-up={showing ? "true" : "false"}
    >
      <svg viewBox="0 0 100 140" className="block h-full w-full" aria-hidden="true">
        <rect x="0" y="0" width="100" height="140" rx="9" fill="#fffdf6" />
        <rect x="5" y="5" width="90" height="130" rx="6" fill={showing ? look.fill : HITOTSU_COLOUR_LOOK.W.fill} />
        {showing ? (
          <>
            <g transform="translate(50 70) rotate(45)">
              <rect x="-27" y="-27" width="54" height="54" rx="6" fill={wild ? HITOTSU_COLOUR_LOOK.W.fill : "#fffdf6"} stroke="#fffdf6" strokeWidth="3" />
            </g>
            {wild ? <Quarters cx={50} cy={70} r={face === "F" ? 20 : 26} /> : null}
            {mark === "" ? null : (
              <text x="50" y={centredBaseline(70, mark.length > 1 ? 26 : 38)} textAnchor="middle" fontSize={mark.length > 1 ? 26 : 38} fontWeight="800" fill={wild ? "#fffdf6" : look.fill} stroke={wild ? HITOTSU_COLOUR_LOOK.W.fill : "none"} strokeWidth={wild ? 1.5 : 0} fontFamily="system-ui, sans-serif">
                {mark}
              </text>
            )}
            <text x="15" y="22" textAnchor="middle" fontSize="17" fontWeight="800" fill={look.ink} fontFamily="system-ui, sans-serif">
              {mark === "" ? "★" : mark}
            </text>
            <text x="85" y="130" textAnchor="middle" fontSize="17" fontWeight="800" fill={look.ink} fontFamily="system-ui, sans-serif" transform="rotate(180 85 124)">
              {mark === "" ? "★" : mark}
            </text>
            <text x="85" y="22" textAnchor="middle" fontSize="14" fill={look.ink} fontFamily="serif">
              {look.element}
            </text>
            <text x="15" y="130" textAnchor="middle" fontSize="14" fill={look.ink} fontFamily="serif" transform="rotate(180 15 124)">
              {look.element}
            </text>
            {called === undefined ? null : <circle cx="50" cy="118" r="7" fill={HITOTSU_COLOUR_LOOK[called].fill} stroke="#fffdf6" strokeWidth="2.5" />}
          </>
        ) : (
          <>
            <circle cx="50" cy="70" r="31" fill="#fffdf6" />
            <Quarters cx={50} cy={70} r={28} />
            <circle cx="50" cy="70" r="19" fill={HITOTSU_COLOUR_LOOK.W.fill} />
            <text x="50" y={centredBaseline(71, 15)} textAnchor="middle" fontSize="15" fontWeight="700" fill="#fffdf6" fontFamily="serif">
              一つ
            </text>
          </>
        )}
      </svg>
    </span>
  );
}

/** What a card is called aloud, for its button and the table's lines. */
export function hitotsuCardLabel(card: HitotsuCard): string {
  return hitotsuWords(card);
}
