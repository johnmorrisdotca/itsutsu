import { ABOUT_CHAPTERS } from "@/app/about/about.chapters";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";

/**
 * WHERE THE FRONT PAGE SENDS PEOPLE, written once for its sections.
 *
 * The front page is the one page a stranger can always reach, so every
 * address here was chosen for somebody without an invite first: the
 * catalogue, a game's own pages, the guides and the story are all open to
 * them. A link that leads a stranger to the door instead says so in its own
 * words, rather than looking like a page and turning out to be a gate.
 */

/** A line of "where to start", for one kind of visitor. */
export type StartLink = {
  href: string;
  /** A phrase: what the way in is called, which is the link's text. */
  label: PhraseKey;
  /** A phrase: the whole line, with `{label}` where the link stands and what the way in offers after it. */
  line: PhraseKey;
  /** The line said to somebody with no invite, where the way in is behind it (`membersOnly`). */
  lineInvite?: PhraseKey;
  /** Behind the invite: a stranger is told so beside the link rather than finding the door. */
  membersOnly?: boolean;
};

/** Somebody meeting these games, or this kind of site, for the first time. */
export const START_NEW: readonly StartLink[] = [
  { href: "/games", label: "home.start.browse", line: "home.start.browseLine" },
  { href: "/learn", label: "home.start.guide", line: "home.start.guideLine" },
  { href: "/about", label: "home.start.story", line: "home.start.storyLine" },
];

/** Somebody who has played these games before, here or on the older sites. */
export const START_RETURNING: readonly StartLink[] = [
  {
    href: "/games/new",
    label: "home.start.begin",
    line: "home.start.beginLine",
    lineInvite: "home.start.beginLineInvite",
    membersOnly: true,
  },
  {
    href: `/about/${ABOUT_CHAPTERS.roots}`,
    label: "home.start.roots",
    line: "home.start.rootsLine",
  },
  {
    href: `/about/${ABOUT_CHAPTERS.programs}`,
    label: "home.start.bots",
    line: "home.start.botsLine",
  },
];
