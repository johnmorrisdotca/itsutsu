import type { ReactNode } from "react";

import type { Speaker } from "@/lib/i18n/i18n";
import type { Locale } from "@/lib/i18n/i18n.types";
import { SITE_NAME } from "@/lib/i18n/siteName";

import { ABOUT_CHAPTERS, type AboutChapter } from "./about.chapters";

import { botsSection } from "./about.bots";
import { catalogueSection } from "./about.games";
import { goSection } from "./about.go";
import { chartsSection } from "./about.charts";
import { engineSection } from "./about.engine";
import { storyFigures } from "./about.figures";
import { rich } from "./about.links";
import { connectFourSection, openingsSection, ratingsSection, sitesSection } from "./about.more";
import { notationSection } from "./about.notation";
import { boardSection, peopleSection, pictureSection, replaySection } from "./about.play";
import { betaSection, howItWorksSection } from "./about.start";
import { wordsSection } from "./about.words";
import { xpSection } from "./about.xp";

export type AboutSection = {
  /** What the section is called to the code (its place in the order); the reader sees `title`. */
  id: string;
  title: string;
  kanji: string;
  /**
   * Which chapter of the page this belongs in. Declared, never inferred from
   * the title — see `about.chapters.ts`, and the gate that holds every
   * section to having one.
   */
  chapter: AboutChapter;
  paragraphs: ReactNode[];
  /** A picture to print after the paragraph with that index. */
  figures?: Record<number, ReactNode>;
};

/**
 * The story of the site, in sections. Dates are given where they are settled
 * and hedged where the record is thin; a game that is a thousand years old
 * has a thousand years of people arguing about where it came from.
 *
 * Every word of it is a phrase (`about.*`), so each section is built for the reader's language.
 */
function baseSections(say: Speaker): AboutSection[] {
  const figures = storyFigures(say);
  return [
    {
      id: "where",
      title: say.say("about.where.title"),
      chapter: ABOUT_CHAPTERS.story,
      kanji: "由来",
      paragraphs: [rich(say, "about.where.a"), rich(say, "about.where.b"), rich(say, "about.where.c")],
    },
    {
      id: "stones",
      title: say.say("about.stones.title"),
      chapter: ABOUT_CHAPTERS.roots,
      kanji: "五つの石",
      paragraphs: [rich(say, "about.stones.a"), rich(say, "about.stones.b"), rich(say, "about.stones.c"), rich(say, "about.stones.d")],
      figures: { 0: figures.origins, 1: figures.hogetsu, 2: figures.penteCapture },
    },
    {
      id: "japan",
      title: say.say("about.japan.title"),
      chapter: ABOUT_CHAPTERS.japan,
      kanji: "和",
      paragraphs: [rich(say, "about.japan.a", { reading: SITE_NAME.toLowerCase() }, { name: <span className="font-mincho">五つ</span> }), rich(say, "about.japan.b"), rich(say, "about.japan.c")],
    },
    {
      id: "othello",
      title: say.say("about.othello.title"),
      chapter: ABOUT_CHAPTERS.roots,
      kanji: "オセロ",
      paragraphs: [rich(say, "about.othello.a"), rich(say, "about.othello.b"), rich(say, "about.othello.c")],
      figures: { 0: figures.otheloStart, 2: figures.solved },
    },
    {
      id: "ladders",
      title: say.say("about.ladders.title"),
      chapter: ABOUT_CHAPTERS.numbers,
      kanji: "番付",
      paragraphs: [rich(say, "about.ladders.a"), rich(say, "about.ladders.b"), rich(say, "about.ladders.c")],
    },
  ];
}

/**
 * The story in reading order: origins, what is actually on the shelf, the
 * openings and the solved game, the heritage, the go board everything here is
 * furnished from, Othello, the numbers, how a move is written down, the
 * players that are not people, and the elders.
 *
 * Built once for each language and kept: the sections do not change from one request to the next.
 */
const kept = new Map<Locale, AboutSection[]>();

export function aboutSections(say: Speaker): AboutSection[] {
  const known = kept.get(say.locale);
  if (known !== undefined) return known;
  const out: AboutSection[] = [];
  for (const section of baseSections(say)) {
    out.push(section);
    // What is actually here, straight after why it exists: the reader has just
    // been told what the site is for and the next question is what is in it.
    if (section.id === "where") {
      out.push(howItWorksSection(say), betaSection(say), boardSection(say), replaySection(say), pictureSection(say), peopleSection(say), catalogueSection(say), chartsSection(say));
    }
    if (section.id === "stones") out.push(openingsSection(say), connectFourSection(say));
    // Go follows the heritage: it is the board and the stones every game here is drawn on.
    if (section.id === "japan") out.push(goSection(say), wordsSection(say));
    // The computer players close the site's own half, after the numbers that
    // rate them and the notation their games are written down in.
    if (section.id === "ladders") out.push(ratingsSection(say), xpSection(say), notationSection(say), botsSection(say), engineSection(say));
  }
  out.push(sitesSection(say));
  kept.set(say.locale, out);
  return out;
}
