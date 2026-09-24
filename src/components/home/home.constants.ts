import { ABOUT_CHAPTERS } from "@/app/about/about.chapters";

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
  label: string;
  note: string;
  /** Behind the invite: a stranger is told so beside the link rather than finding the door. */
  membersOnly?: boolean;
};

/** Somebody meeting these games, or this kind of site, for the first time. */
export const START_NEW: readonly StartLink[] = [
  { href: "/games", label: "Browse the games", note: "every game with its rules, a picture of its board, and where it came from" },
  { href: "/learn", label: "Read a guide", note: "the shapes that win and the mistakes everybody makes once" },
  { href: "/about", label: "Read the story", note: "why the site exists, and how it counts" },
];

/** Somebody who has played these games before, here or on the older sites. */
export const START_RETURNING: readonly StartLink[] = [
  {
    href: "/games/new",
    label: "Start a game",
    note: "pick the game, the board and the opponent: a person or a program",
    membersOnly: true,
  },
  {
    href: `/about?view=${ABOUT_CHAPTERS.roots}`,
    label: "Where the games came from",
    note: "a thousand years of five in a row, Othello, and the famous openings",
  },
  {
    href: `/about?view=${ABOUT_CHAPTERS.programs}`,
    label: "Meet the programs",
    note: "five graded computer players and two specialists, and how they were measured",
  },
];
