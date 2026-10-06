import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import type { Speaker } from "@/lib/i18n/i18n";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";

/**
 * Strategy, written to be learned from. Each guide is a few sections of
 * plain paragraphs and bullet lists, keyed by the variants it applies to, so
 * one guide can serve a whole family and a rules page can link the guide
 * that fits. Terms are given with their Japanese names where the game has
 * them, because that is how the literature names them.
 *
 * What a guide SAYS is in the phrase table (`learn.*`), one phrase to a paragraph or a bullet: this file holds the
 * order of the sections and which game each guide covers, and `guideWords` reads one in the reader's language.
 */
export type GuideSection = {
  heading: PhraseKey;
  paragraphs?: readonly PhraseKey[];
  points?: readonly PhraseKey[];
};

export type Guide = {
  slug: string;
  title: PhraseKey;
  kanji: string;
  summary: PhraseKey;
  variants: readonly RuleVariant[];
  sections: readonly GuideSection[];
};

export const GUIDES: readonly Guide[] = [
  {
    slug: "five-in-a-row",
    title: "learn.five.title",
    kanji: "五目の基本",
    summary: "learn.five.summary",
    variants: ["freestyle", "standard", "renju", "omok", "caro", "ninuki", "dominoFive", "blockFive", "misereFive", "toroidalFive", "obstacleFive", "scatteredRocks", "rockfall"],
    sections: [
      { heading: "learn.five.threatsH", paragraphs: ["learn.five.threatsA", "learn.five.threatsB"] },
      { heading: "learn.five.shapesH", points: ["learn.five.shapesA", "learn.five.shapesB", "learn.five.shapesC", "learn.five.shapesD"] },
      { heading: "learn.five.tempoH", paragraphs: ["learn.five.tempoA", "learn.five.tempoB"] },
      { heading: "learn.five.openingH", points: ["learn.five.openingA", "learn.five.openingB", "learn.five.openingC"] },
      { heading: "learn.five.readingH", points: ["learn.five.readingA", "learn.five.readingB", "learn.five.readingC"] },
      { heading: "learn.five.misereH", points: ["learn.five.misereA", "learn.five.misereB"] },
    ],
  },
  {
    slug: "renju",
    title: "learn.renju.title",
    kanji: "連珠の考え方",
    summary: "learn.renju.summary",
    variants: ["renju"],
    sections: [
      { heading: "learn.renju.restrictH", paragraphs: ["learn.renju.restrictA", "learn.renju.restrictB"] },
      { heading: "learn.renju.threeH", points: ["learn.renju.threeA", "learn.renju.threeB", "learn.renju.threeC", "learn.renju.threeD"] },
      { heading: "learn.renju.openingsH", points: ["learn.renju.openingsA", "learn.renju.openingsB", "learn.renju.openingsC"] },
      { heading: "learn.renju.protocolsH", paragraphs: ["learn.renju.protocolsA", "learn.renju.protocolsB"] },
    ],
  },
  {
    slug: "captures",
    title: "learn.caps.title",
    kanji: "二抜きの考え方",
    summary: "learn.caps.summary",
    variants: ["ninuki", "sannuki"],
    sections: [
      { heading: "learn.caps.pairH", paragraphs: ["learn.caps.pairA", "learn.caps.pairB"] },
      { heading: "learn.caps.defenceH", points: ["learn.caps.defenceA", "learn.caps.defenceB", "learn.caps.defenceC"] },
      { heading: "learn.caps.proH", paragraphs: ["learn.caps.proA"] },
      { heading: "learn.caps.sannukiH", points: ["learn.caps.sannukiA", "learn.caps.sannukiB", "learn.caps.sannukiC"] },
    ],
  },
  {
    slug: "connect-six",
    title: "learn.six.title",
    kanji: "六子棋の考え方",
    summary: "learn.six.summary",
    variants: ["connect6"],
    sections: [
      { heading: "learn.six.countH", points: ["learn.six.countA", "learn.six.countB", "learn.six.countC"] },
      { heading: "learn.six.shapeH", paragraphs: ["learn.six.shapeA"] },
    ],
  },
  {
    slug: "drops",
    title: "learn.drops.title",
    kanji: "落としの考え方",
    summary: "learn.drops.summary",
    variants: ["dropFour", "ringDrop", "holeDrop", "hotDrop", "clearDrop", "giveawayDrop", "edgeDrop", "wormDrop"],
    sections: [
      { heading: "learn.drops.storedH", paragraphs: ["learn.drops.storedA", "learn.drops.storedB"] },
      { heading: "learn.drops.parityH", points: ["learn.drops.parityA", "learn.drops.parityB"] },
      { heading: "learn.drops.variantsH", points: ["learn.drops.variantsA", "learn.drops.variantsB", "learn.drops.variantsC", "learn.drops.variantsD", "learn.drops.variantsE", "learn.drops.variantsF"] },
    ],
  },
  {
    slug: "twist",
    title: "learn.twist.title",
    kanji: "回しの考え方",
    summary: "learn.twist.summary",
    variants: ["twistFive", "twistFour"],
    sections: [
      { heading: "learn.twist.edgeH", paragraphs: ["learn.twist.edgeA", "learn.twist.edgeB"] },
      { heading: "learn.twist.turnH", points: ["learn.twist.turnA", "learn.twist.turnB", "learn.twist.turnC"] },
    ],
  },
  {
    slug: "small-games",
    title: "learn.small.title",
    kanji: "小さな盤の考え方",
    summary: "learn.small.summary",
    variants: ["trapThree", "squareFour", "tictactoe", "wildTicTacToe", "notakto", "makerBreaker"],
    sections: [
      { heading: "learn.small.trapH", points: ["learn.small.trapA", "learn.small.trapB", "learn.small.trapC"] },
      { heading: "learn.small.squareH", points: ["learn.small.squareA", "learn.small.squareB", "learn.small.squareC"] },
      { heading: "learn.small.tttH", points: ["learn.small.tttA", "learn.small.tttB", "learn.small.tttC"] },
      { heading: "learn.small.wildH", points: ["learn.small.wildA", "learn.small.wildB"] },
      { heading: "learn.small.notaktoH", points: ["learn.small.notaktoA", "learn.small.notaktoB"] },
      { heading: "learn.small.makerH", points: ["learn.small.makerA", "learn.small.makerB", "learn.small.makerC"] },
    ],
  },
  {
    slug: "pieces",
    title: "learn.pieces.title",
    kanji: "駒の考え方",
    summary: "learn.pieces.summary",
    variants: ["dominoFive", "blockFive"],
    sections: [
      { heading: "learn.pieces.queueH", paragraphs: ["learn.pieces.queueA", "learn.pieces.queueB"] },
      { heading: "learn.pieces.cutsH", points: ["learn.pieces.cutsA", "learn.pieces.cutsB", "learn.pieces.cutsC"] },
      { heading: "learn.pieces.nothingH", paragraphs: ["learn.pieces.nothingA"] },
    ],
  },
];

/** The guides that apply to a variant, most specific first. */
export function guidesFor(variant: RuleVariant): Guide[] {
  return GUIDES.filter((guide) => guide.variants.includes(variant)).sort(
    (a, b) => a.variants.length - b.variants.length,
  );
}

export function guideBySlug(slug: string): Guide | null {
  return GUIDES.find((guide) => guide.slug === slug) ?? null;
}

/** A guide in the reader's language: its title, summary and every paragraph and bullet. */
export function guideWords(guide: Guide, say: Speaker) {
  return {
    title: say.say(guide.title),
    summary: say.say(guide.summary),
    sections: guide.sections.map((section) => ({
      heading: say.say(section.heading),
      paragraphs: section.paragraphs?.map((key) => say.say(key)),
      points: section.points?.map((key) => say.say(key)),
    })),
  };
}
