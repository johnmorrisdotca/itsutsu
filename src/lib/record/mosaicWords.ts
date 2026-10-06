import type { PhraseKey } from "../i18n/i18n.constants";
import type { Speaker } from "../i18n/i18n";

import type { MosaicPick, MosaicShape } from "./mosaic.constants";

/**
 * A mosaic's words in the reader's language: the dialog's, the picture's own
 * title-bar note and the two shapes. `MOSAIC_COPY` is the same in English for the
 * places with no speaker.
 */
export function mosaicWords(say: Speaker) {
  return {
    heading: say.say("mosaic.heading"),
    openLabel: say.say("mosaic.openLabel"),
    blurb: say.say("mosaic.blurb"),
    make: say.say("mosaic.make"),
    making: say.say("mosaic.making"),
    download: say.say("mosaic.download"),
    fullScreen: say.say("mosaic.fullScreen"),
    again: say.say("mosaic.again"),
    failed: say.say("mosaic.failed"),
    shapeLabel: say.say("mosaic.shapeLabel"),
    close: say.say("mosaic.close"),
    pickLegend: (count: number, tiles: number) => say.say("mosaic.pickLegend", { count: String(count), tiles: String(tiles) }),
    picks: {
      opening: say.say("mosaic.pickOpening"),
      spread: say.say("mosaic.pickSpread"),
      ending: say.say("mosaic.pickEnding"),
    } satisfies Record<Exclude<MosaicPick, "every">, string>,
    shownOf: (shown: number, total: number) => say.say("mosaic.shownOf", { shown: String(shown), total: String(total) }),
  };
}

const SHAPE_PHRASES: Record<MosaicShape, { label: PhraseKey; note: PhraseKey }> = {
  landscape: { label: "mosaic.landscape", note: "mosaic.landscapeNote" },
  portrait: { label: "mosaic.portrait", note: "mosaic.portraitNote" },
};

/** A shape's name and what it is for, in the reader's language. */
export function shapeWords(say: Speaker, shape: MosaicShape): { label: string; note: string } {
  const phrases = SHAPE_PHRASES[shape];
  return { label: say.say(phrases.label), note: say.say(phrases.note) };
}
