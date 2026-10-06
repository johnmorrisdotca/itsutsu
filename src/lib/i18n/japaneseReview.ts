import { JA_DRAFTED, type DraftedPhrase } from "./dictionaries/ja.drafted.constants";
import { JA_ALREADY_SAID } from "./dictionaries/ja.site.constants";
import { PHRASES, PHRASE_KEYS, type PhraseKey } from "./i18n.constants";
import { placeholdersIn } from "./i18n";

/**
 * The review sheet, built from the dictionaries themselves.
 *
 * John does not read Japanese. That makes a page he can hand to somebody who
 * does the difference between publishing text he has checked and publishing
 * text he has been told about — so the page has to be the text that actually
 * ships, not a copy of it somebody kept up to date. Building it from the same
 * modules the site renders from is what makes that true by construction, and
 * `japanese.coverage.test.ts` fails the build when the file on disk and this
 * function disagree.
 */

/** Where a phrase is met, and how often — which is the order to review in. */
const MET: readonly { prefix: string; seen: string; place: string }[] = [
  { prefix: "nav.", seen: "Every screen", place: "navigation bar" },
  { prefix: "account.", seen: "Every screen", place: "account menu, top right" },
  { prefix: "site.", seen: "Every screen", place: "footer" },
  { prefix: "install.", seen: "Phones and tablets, until dismissed", place: "the hint that offers the site as a home-screen app" },
  { prefix: "filter.", seen: "Most list pages", place: "filter bars on the record and players pages" },
  { prefix: "rules.", seen: "39 rules pages", place: "one per game" },
  { prefix: "setup.", seen: "Every new game", place: "the set-up screen: opening, rating and opponent" },
  { prefix: "xp.", seen: "After earning points", place: "the notice that drops in from the top of the page, a person's standing under their record, and the XP boards" },
  { prefix: "catalogue.", seen: "The games index, /games", place: "under every game and every family, in all three views" },
  // The draughts family's file, which is met on those games only; before `record.`, which would claim it.
  { prefix: "record.downloadPdn", seen: "Finished games of checkers and draughts", place: "beside Copy as text, in the move list under the replay" },
  { prefix: "record.", seen: "Finished games of go, Othello, gomoku, renju and Hex", place: "beside Copy as text, in the move list under the replay" },
  { prefix: "rivalry.", seen: "Two members' games", place: "the head-to-head scoreboard above a pair's record, and on a match before and after it" },
  { prefix: "feed.", seen: "The feed, /feed", place: "its heading, tabs, every line of activity and its empty states" },
];

function metBy(key: PhraseKey): { rank: number; seen: string; place: string } {
  const index = MET.findIndex((one) => key.startsWith(one.prefix));
  if (index === -1) return { rank: MET.length, seen: "—", place: "—" };
  const found = MET[index] as (typeof MET)[number];
  return { rank: index, seen: found.seen, place: found.place };
}

function inReadingOrder(keys: readonly PhraseKey[]): PhraseKey[] {
  return [...keys].sort((a, b) => metBy(a).rank - metBy(b).rank || a.localeCompare(b));
}

/** A cell that cannot break the table, whatever the phrase contains. */
function cell(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

/** Who has read a phrase: nobody, the reviewer agent, or a person who reads Japanese. */
export type ReviewState = "drafted" | "agent" | "person";

export function reviewState(row: DraftedPhrase): ReviewState {
  return row.review === undefined ? "drafted" : row.review.by;
}

/**
 * Whether a person still has something to do with this phrase: a decision only
 * John can make (an `ask` on a phrase nobody has read) or a native read the
 * reviewer recommended (an `ask` on a phrase the agent passed). A person's own
 * read ends it, whatever the note says.
 */
export function awaitsPerson(row: DraftedPhrase): boolean {
  return row.ask !== undefined && row.review?.by !== "person";
}

/** The Review column's words. */
export function reviewLabel(row: DraftedPhrase): string {
  const state = reviewState(row);
  if (state === "drafted") return row.ask === undefined ? "Drafted, unread" : "Question, unread";
  const who = state === "agent" ? "Agent" : "Person";
  return `${who} ${row.review?.on ?? ""}${awaitsPerson(row) ? ", native read wanted" : ""}`;
}

/**
 * One line of the sheet, and the places that line covers.
 *
 * A phrase key is a place on the site, not a word, so two keys legitimately
 * hold the same word: "Rules" is both a section of the bar and a column of the
 * record's filter, and both are 規則. That is right in the code and wrong on
 * the page — a reviewer reading the same row twice has been given nothing to
 * do the second time and has to work out whether they missed a difference.
 *
 * So rows are folded on what they actually show — the English, the Japanese
 * and the reading back — and the places they cover are joined into the one
 * cell that differs. Nothing is dropped: a word appearing in four places still
 * says all four, and the states and questions of its keys are joined the same
 * way (so one wording is never on the sheet twice, even in two states).
 */
type Row = { place: string; wording: string[]; review: string; ask: string; awaiting: boolean };

type Folded = { wording: string[]; places: string[]; reviews: string[]; asks: string[]; awaiting: boolean };

function fold(rows: Row[]): Folded[] {
  const byWording = new Map<string, Folded>();
  for (const row of rows) {
    /*
     * A separator that cannot occur in a cell, written as an escape rather
     * than as the character itself. As a literal byte it made git call this
     * whole file binary — no diffs, ever — which is a high price for one
     * invisible character.
     */
    const identity = row.wording.join("\u0000");
    const found = byWording.get(identity);
    if (found === undefined) {
      byWording.set(identity, {
        wording: row.wording,
        places: [row.place],
        reviews: [row.review],
        asks: row.ask === "" ? [] : [row.ask],
        awaiting: row.awaiting,
      });
      continue;
    }
    if (!found.places.includes(row.place)) found.places.push(row.place);
    if (!found.reviews.includes(row.review)) found.reviews.push(row.review);
    if (row.ask !== "" && !found.asks.includes(row.ask)) found.asks.push(row.ask);
    found.awaiting = found.awaiting || row.awaiting;
  }
  return [...byWording.values()];
}

/** How many phrases are in each state, for the line at the top of the sheet. */
export function reviewCounts(): { total: number; drafted: number; agent: number; person: number; waiting: number } {
  const counts = { total: 0, drafted: 0, agent: 0, person: 0, waiting: 0 };
  for (const key of PHRASE_KEYS) {
    const row = JA_DRAFTED[key];
    if (row === undefined) continue;
    counts.total += 1;
    counts[reviewState(row)] += 1;
    if (awaitsPerson(row)) counts.waiting += 1;
  }
  return counts;
}

export function japaneseReview(): string {
  const drafted = inReadingOrder(PHRASE_KEYS.filter((key) => JA_DRAFTED[key] !== undefined));
  const already = inReadingOrder(PHRASE_KEYS.filter((key) => JA_ALREADY_SAID[key] !== undefined));
  const placeheld = drafted.filter((key) => placeholdersIn(PHRASES[key]).length > 0);

  const draftedFolded = fold(
    drafted.map((key) => {
      const { seen, place } = metBy(key);
      const row = JA_DRAFTED[key] as DraftedPhrase;
      return {
        place: `${cell(seen)} — ${cell(place)}`,
        wording: [cell(PHRASES[key]), `**${cell(row.text)}**`, cell(row.back)],
        review: reviewLabel(row),
        ask: cell(row.ask ?? ""),
        awaiting: awaitsPerson(row),
      };
    }),
  );
  /* A question or a native read first: those are the lines a person has to do something about. */
  const waitingRows = draftedFolded
    .filter((one) => one.awaiting)
    .map((one) => [one.places.join("; "), ...one.wording, one.reviews.join("; "), one.asks.join("; "), ""]);
  const draftedRows = draftedFolded
    .filter((one) => !one.awaiting)
    .map((one) => [one.places.join("; "), ...one.wording, one.reviews.join("; "), ""]);
  const alreadyFolded = fold(
    already.map((key) => {
      const row = JA_ALREADY_SAID[key];
      return {
        place: cell(row?.where ?? ""),
        wording: [cell(PHRASES[key]), cell(row?.text ?? "")],
        review: "",
        ask: "",
        awaiting: false,
      };
    }),
  );
  const alreadyRows = alreadyFolded.map((one) => [...one.wording, one.places.join("; ")]);
  const counts = reviewCounts();

  const lines: string[] = [
    "# Japanese review sheet",
    "",
    "**Generated from the code. Do not edit this file by hand — edit**",
    "**`src/lib/i18n/dictionaries/` and regenerate, or the build will fail.**",
    "",
    "The site speaks English and Japanese. This sheet is **only the Japanese a**",
    "**machine wrote**, which is the only part that needs a reader.",
    "",
    `Phrases: ${counts.total}. Drafted and unread: ${counts.drafted}. Read by the reviewer agent: ${counts.agent}.`,
    `Read by a person who reads Japanese: ${counts.person}. Waiting for a decision or a native read: ${counts.waiting}`,
    "(these come first). **Review** says who has read a line and on what day. The terms",
    "the reviewer settled are in `docs/plans/en-ja-everywhere/TERMS.md`.",
    "",
    "Rows are in the order a reader meets them: the navigation bar, the account",
    "menu and the footer are on every screen, so they come first. If you only have",
    "time for the top of the table, the top of the table is the part that matters.",
    "",
    "**What it says back** is a literal reading of the Japanese returned to English.",
    "It is there so the site's owner, who does not read Japanese, can see for",
    "himself whether the meaning drifted. If that column does not match the English",
    "beside it, the Japanese is wrong whatever anybody thinks of its style.",
    "",
    `## 1. Waiting for a decision or a native read — start here (${waitingRows.length})`,
    "",
    "A **question** is a wording only the site's owner can choose between. A line the",
    "agent has read but marked for a native read is high-stakes text (children,",
    "consent, brands, legal): the agent's pass is not enough for it.",
    "",
    "| Where a reader meets it | English on the site | Japanese | What it says back | Review | What is asked | Correction |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  ];

  for (const cells of waitingRows) lines.push(`| ${cells.join(" | ")} |`);

  lines.push(
    "",
    `## 2. Written by a machine — please check these (${draftedRows.length})`,
    "",
    "| Where a reader meets it | English on the site | Japanese | What it says back | Review | Correction |",
    "| --- | --- | --- | --- | --- | --- |",
  );
  for (const cells of draftedRows) lines.push(`| ${cells.join(" | ")} |`);

  lines.push("");
  if (placeheld.length > 0) {
    lines.push(
      "`{game}`, `{name}`, `{names}` and `{country}` are filled in when the page is",
      "drawn — a game's name, a country. They have to survive a correction exactly as",
      "written, braces and spelling both, or the sentence loses the word it was about.",
      "",
    );
  }

  lines.push(
    `## 3. Already on the site — nothing to check (${alreadyRows.length})`,
    "",
    "These are **John's own words**, published on the English site as the kanji",
    'beside a heading. Nothing was translated: the kanji that sat next to "Rules"',
    "becomes the heading itself for a Japanese reader, because for that reader the",
    "English half was the redundant one. Listed for completeness, not for review.",
    "",
    "| English on the site | Japanese | Where it already appears |",
    "| --- | --- | --- |",
  );
  for (const cells of alreadyRows) lines.push(`| ${cells.join(" | ")} |`);

  lines.push(
    "",
    "## 4. The game names, and most of the furniture — nothing to check either",
    "",
    "Every game has carried its Japanese name since the day it was added, in the",
    "`kanji` field beside its English one. A Japanese reader is shown that name and",
    "nothing was translated to do it. The same goes for the panel headings, the tab",
    "strips, the buttons and the result words throughout the site: all of them were",
    'already written as an English word and its kanji — "Resign 投了", "Cancel 取消",',
    '"Black won 黒勝" — and a Japanese reader is simply shown the half that was',
    "always theirs.",
    "",
    "## What is still English, and why",
    "",
    "Each game's tagline, origin and rule bullets — the prose across the 39 rules",
    "pages — is still English for everybody. It is the largest body of writing on",
    "the site, it is argument rather than labelling, and it wants a translator",
    "rather than a machine. Long explanatory paragraphs elsewhere (the About page,",
    "the front page) are untranslated for the same reason.",
    "",
  );
  return lines.join("\n");
}
