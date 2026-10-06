#!/usr/bin/env node
/**
 * ENGLISH TYPED OUTSIDE THE PHRASE TABLE.
 *
 * John, 2026-10-06: "we should make sure all apps are EN/JP support." Every
 * word a member reads has to come from `PHRASES` (`src/lib/i18n/`) through a
 * `Speaker`, or from a table of copy per language that sits beside the data it
 * describes. This is what keeps that true: a new sentence typed straight into
 * a component fails the build, so the site cannot grow English faster than it
 * is translated. Ported from UmaKuma's `check-i18n-strings.mjs`, where it
 * started with nothing pending.
 *
 * Itsutsu starts with a great deal pending, because the site was written in
 * English first. `PENDING_PATHS` lists each folder or file that still holds
 * English, with the ENJA ticket that takes it off (docs/plans/en-ja-everywhere/).
 * It is a ratchet and it only turns one way:
 *
 *   - a flagged string anywhere NOT pending fails the build;
 *   - a pending path with no flagged string left fails the build too, so a
 *     finished area has to come off the list;
 *   - a pending path that no longer exists fails it for the same reason;
 *   - `inlineEnglish.coverage.test.ts` fails if the list grows past the one
 *     recorded there.
 *
 * Every run prints how many strings each pending path still holds, so the size
 * of the gap is a number in front of whoever is working near it.
 *
 * WHAT IT LOOKS FOR, in source under `src/` (never a test, never the phrase
 * catalogue itself):
 *   1. `jsx-text`     a JSX text node: `<p>Save changes</p>`
 *   2. `attr:<name>`  a string attribute that reads as prose: `title="Close"`
 *   3. `literal`      any other string literal that reads as prose: a ternary's
 *                     branches, an object's value, an array of rule bullets,
 *                     an API error's text
 *
 * None of these can be told from code by a type checker, since
 * `"rounded-xl border-line"` and `"Save changes"` are both string literals. So
 * this leans on what a person skims with: prose carries function words (the,
 * a, is, you...) that identifiers and Tailwind classes never do, and a short
 * capitalised phrase with no hyphen reads as copy rather than a token. It is a
 * sweep, not a parser. Where it is wrong the answer is an allowance below with
 * its reason, not a smarter and slower check.
 *
 * AND THREE PATTERNS THAT ARE NOT ENGLISH BUT KEEP A READER FROM THEIR LANGUAGE
 * (ENJA-04, dates, numbers and counts), read from the code with comments taken out:
 *   4. `locale`      `.toLocaleString(`, `.toLocaleDateString(` or `.toLocaleTimeString(`,
 *                    with an "en-US", an "en-GB", `undefined` or nothing. Node and a
 *                    browser spell a date and a number differently, so a page drawn by
 *                    both is a hydration fault, and a locale typed here is one reader's.
 *                    A date is `Speaker.day` or `ui/when.ts`, a number `Speaker.number`.
 *   5. `plural`      a count made plural by hand: `n === 1 ? "game" : "games"`,
 *                    `n === 1 ? "" : "s"`, `+ "s"`. Japanese has no plural but counts
 *                    with a counter word (3局, 5人, 2回), so the count is a phrase with
 *                    `{count}` in two forms and `Speaker.count` picks one.
 *   6. `no-locale`   `countText(n)` with no locale: the figure is marked in English.
 *                    English and Japanese mark thousands alike, so nothing is wrong on
 *                    the page yet; the locale is what a third language will need.
 * They count against a pending path like a sentence does: a path comes off the list
 * only when it holds none of the six.
 *
 * It reads files and nothing else: no database, no network, no timing. The
 * counts are the same on every machine.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Folders and files this gate cannot enforce yet, each with the ticket that
 * takes it off (docs/plans/en-ja-everywhere/). Folder level wherever a folder
 * is one ticket's, so a file renamed inside it breaks nothing.
 *
 * The first entry that matches a file takes it, so a file named under one
 * ticket inside a folder named under another goes to the earlier one: keep the
 * specific entries above the general ones.
 *
 * ONLY EVER SHORTER. Taking a path off is the proof an area is done; adding
 * one is a decision the test refuses.
 */
export const PENDING_PATHS = [
  // ENJA-05, game copy tables: every game's rules, tagline, openings, bots and family names. Each folder here holds only what is left of it: the games', openings', bots' and families' own words are done, beside their Japanese.
  { path: "src/lib/gomoku", ticket: "ENJA-05" },
  { path: "src/lib/famous", ticket: "ENJA-05" },
  { path: "src/app/games", ticket: "ENJA-05" },
  // ENJA-06, set-up screen, game screen and every ending
  { path: "src/components/live", ticket: "ENJA-06" },
  { path: "src/components/game", ticket: "ENJA-06" },
  { path: "src/components/games", ticket: "ENJA-06" },
  { path: "src/components/history", ticket: "ENJA-06" },
  { path: "src/components/board", ticket: "ENJA-06" },
  { path: "src/components/play", ticket: "ENJA-06" },
  { path: "src/lib/history", ticket: "ENJA-06" },
  { path: "src/lib/record", ticket: "ENJA-06" },
  { path: "src/lib/rating", ticket: "ENJA-06" },
  { path: "src/lib/clock", ticket: "ENJA-06" },
  // ENJA-07, puzzles (folders, so a renamed puzzle file breaks nothing)
  { path: "src/lib/puzzles", ticket: "ENJA-07" },
  { path: "src/components/puzzles", ticket: "ENJA-07" },
  // ENJA-08, party and card games
  { path: "src/lib/party", ticket: "ENJA-08" },
  { path: "src/components/party", ticket: "ENJA-08" },
  { path: "src/lib/cardGames", ticket: "ENJA-08" },
  { path: "src/components/cards", ticket: "ENJA-08" },
  { path: "src/lib/casual", ticket: "ENJA-08" },
  { path: "src/components/casual", ticket: "ENJA-08" },
  // ENJA-10, pages: home, About, Learn, players, history, My account, feed, inbox, join
  { path: "src/app/about", ticket: "ENJA-10" },
  { path: "src/components/about", ticket: "ENJA-10" },
  { path: "src/lib/learn", ticket: "ENJA-10" },
  { path: "src/app/learn", ticket: "ENJA-10" },
  { path: "src/app/page.tsx", ticket: "ENJA-10" },
  { path: "src/app/players", ticket: "ENJA-10" },
  { path: "src/components/players", ticket: "ENJA-10" },
  { path: "src/components/mine", ticket: "ENJA-10" },
  { path: "src/components/home", ticket: "ENJA-10" },
  { path: "src/components/layout", ticket: "ENJA-10" },
  { path: "src/components/auth", ticket: "ENJA-10" },
  { path: "src/components/inbox", ticket: "ENJA-10" },
  { path: "src/components/messages", ticket: "ENJA-10" },
  { path: "src/components/ui", ticket: "ENJA-10" },
  { path: "src/components/offline", ticket: "ENJA-10" },
  { path: "src/components/embed", ticket: "ENJA-10" },
  { path: "src/components/famous", ticket: "ENJA-10" },
  { path: "src/components/reports", ticket: "ENJA-10" },
  { path: "src/lib/site", ticket: "ENJA-10" },
  { path: "src/lib/version.ts", ticket: "ENJA-10" },
  { path: "src/lib/auth", ticket: "ENJA-10" },
  { path: "src/lib/social", ticket: "ENJA-10" },
  { path: "src/lib/messages", ticket: "ENJA-10" },
  { path: "src/lib/preferences", ticket: "ENJA-10" },
  { path: "src/lib/reports", ticket: "ENJA-10" },
  { path: "src/lib/feed", ticket: "ENJA-10" },
  { path: "src/lib/thanks", ticket: "ENJA-10" },
  { path: "src/app/join", ticket: "ENJA-10" },
  { path: "src/app/champions", ticket: "ENJA-10" },
  { path: "src/app/me", ticket: "ENJA-10" },
  { path: "src/app/stop", ticket: "ENJA-10" },
  { path: "src/app/thanks", ticket: "ENJA-10" },
  { path: "src/app/releases", ticket: "ENJA-10" },
  { path: "src/app/famous", ticket: "ENJA-10" },
  { path: "src/app/dice", ticket: "ENJA-10" },
  { path: "src/app/play", ticket: "ENJA-10" },
  { path: "src/app/history", ticket: "ENJA-10" },
  { path: "src/app/not-found.tsx", ticket: "ENJA-10" },
  { path: "src/app/layout.tsx", ticket: "ENJA-10" },
  { path: "src/app/manifest.ts", ticket: "ENJA-10" },
  // ENJA-11, Privacy and Terms (with a native read)
  { path: "src/app/privacy", ticket: "ENJA-11" },
  { path: "src/app/terms", ticket: "ENJA-11" },
  // ENJA-12, emails
  { path: "src/lib/mail", ticket: "ENJA-12" },
  // ENJA-13, API errors a person can see
  { path: "src/app/api", ticket: "ENJA-13" },
  { path: "src/proxy.ts", ticket: "ENJA-13" },
  { path: "src/lib/phrase", ticket: "ENJA-13" },
  { path: "src/lib/api", ticket: "ENJA-13" },
];

/**
 * English that is allowed without a phrase, written down so a name added
 * without a reason is not mistaken for a miss.
 */

/** Whole subtrees this gate never looks inside, each with why. */
export const EXCLUDED_PATHS = [
  ["src/lib/i18n", "the phrase catalogue and the dictionaries are where the words are kept"],
  ["src/app/admin", "the operator's own pages: English by decision, read by one person (UmaKuma keeps its admin the same way)"],
  ["src/components/admin", "the operator's own pages, as src/app/admin"],
  ["src/app/api/admin", "the operator's own routes, as src/app/admin"],
  ["src/lib/sumilabu", "clients of the Sumilabu board: the messages go to a developer's terminal and logs, never to a member"],
  ["src/lib/sim", "the simulated-journey report an operator reads after a run"],
  ["src/app/backlog", "the features board is the operator's alone (the page is shut to members, `currentAdmin`)"],
  ["src/components/backlog", "the features board, as src/app/backlog"],
  ["src/lib/backlog", "the features board, as src/app/backlog"],
  ["src/lib/auth/operatorLog.constants.ts", "the operator's own log of what the operator did"],
  ["src/lib/auth/claimRecord.constants.ts", "refusals shown to the operator when claiming a kept record for a member"],
  ["src/components/reports/AdminReports.tsx", "the operator's list of problems members reported"],
  ["src/lib/testMode", "switches for the browser suite"],
  ["src/lib/legacy", "names and records copied from other sites, kept exactly as those sites wrote them (the games' names there are the source's own, see gameAliases)"],
  ["src/lib/bots/botHonesty.ts", "a measuring tool's report to the developer running it"],
  ["src/lib/bots/botMix.ts", "a measuring tool's report to the developer running it"],
  ["src/lib/bots/botMixRun.ts", "a measuring tool's report to the developer running it"],
  ["src/lib/bots/botSeriesGame.ts", "a measuring tool's report to the developer running it"],
  ["src/lib/bots/stallMeasure.ts", "a measuring tool's report to the developer running it"],
  ["src/lib/gomoku/ladderStrengthSource.ts", "writes a generated file's header comment; nobody reads it as the site's text"],
];

/**
 * File-name shapes that hold data nobody wrote as sentences, each with why.
 * `COPY_DATA_FILES` are the two exceptions: tables whose strings ARE the site's
 * words about a game, so they stay in scope.
 */
export const EXCLUDED_NAMES = [
  [/(?:^|\/)Admin[A-Z]\w*\.tsx$|(?:^|\/)admin\.constants\.ts$/, "the operator's own panels, wherever their files sit: English by decision, as src/app/admin"],
  [/\.data\.tsx?$/, "tables of boards, word lists, slugs, art stamps and records written by a machine or copied from a source: content, not the site's own sentences"],
];
export const COPY_DATA_FILES = new Set(["src/lib/gomoku/families.data.ts", "src/lib/famous/famousGames.data.ts"]);

/**
 * Individual files this gate would flag and should not, each with why. Only
 * names, codes and text no member reads belong here. A ticket
 * adds to it when an area it finishes holds a file like that.
 */
export const ALLOWED_FILES = new Map([
  ["src/lib/app/appleLaunch.ts", "CSS media queries that pick an iPhone's launch picture by screen size; code, not language"],
  ["src/lib/xp/xpSubjects.constants.ts", "notes to the developer wiring an award about what its subject is (\"the game id\"); never drawn on a page"],
  ["src/lib/xp/backfillXp.constants.ts", "why the one-off backfill does not replay an award, printed in full by its runner to whoever runs it; never drawn on a page"],
  ["src/lib/xp/importedRecipients.ts", "why the payer's runner refuses a record, printed to the operator who runs it; never drawn on a page"],
  ["src/lib/xp/xpBoard.sort.ts", "a sort spec's column labels and notes, which `paging.ts` only checks are not empty; the board's headings are phrases"],
  ["src/lib/xp/xpHistory.sort.ts", "a sort spec's column label, as xpBoard.sort.ts"],
  ["src/lib/points/ladderSql.ts", "a SQL fragment the database runs, not language"],
  /*
   * THE ENGLISH HALF OF A PAIR. A game's own words are a table of English beside
   * a sibling table of Japanese (`Record<…>` each), so the English row is not an
   * English sentence left out of the phrase table: it is one language of two. The
   * Japanese lives under src/lib/i18n/dictionaries/ and is held by
   * `variants.coverage.test.ts` and `gameCopyJa.coverage.test.ts`, which fail for a
   * game, opening, computer player, family or shelf with no Japanese beside it.
   */
  ["src/lib/gomoku/variants.constants.ts", "the English half of every game's words; the Japanese is variants.ja.*.constants.ts, held by variants.coverage.test.ts"],
  ["src/lib/gomoku/openings.constants.ts", "the English half of the openings, handicap switches and attribution; the Japanese is openings.ja.constants.ts and attribution.ja.constants.ts, held by variants.coverage.test.ts and gameCopyJa.coverage.test.ts"],
  ["src/lib/gomoku/opponent.constants.ts", "the English half of the graded computer players' profiles; the Japanese is bots.ja.constants.ts. The measured ladder's fingerprint hashes this file (ladderFingerprint.ts), so it is never edited to translate it"],
  ["src/lib/gomoku/opponentSpecialists.constants.ts", "the English half of the specialist computer players' profiles; the Japanese is bots.ja.constants.ts, held by gameCopyJa.coverage.test.ts"],
  ["src/lib/gomoku/families.data.ts", "the English half of the families' blurbs; the Japanese is families.ja.constants.ts, held by gameCopyJa.coverage.test.ts (a family's Japanese name is its kanji)"],
  ["src/lib/gomoku/familyShelves.ts", "the English half of the reasons a game is also shelved elsewhere; the Japanese is families.ja.constants.ts, held by gameCopyJa.coverage.test.ts"],
  ["src/lib/bots/bots.constants.ts", "the English half of the computer players' bios; the Japanese is bots.ja.constants.ts, held by gameCopyJa.coverage.test.ts"],
  ["src/lib/bots/botNames.ts", "country names that key a flag lookup, the same strings a member types into their profile: names, not sentences"],
  ["src/lib/catalogue/openSource.ts", "the names of this site's own open-source packages (Narabe, Kazu, Hitotsu…): names, not sentences"],
  ["src/lib/pieces/pieceColours.ts", "colour names, each an English label beside its own kanji (深紅, 朱, 琥珀…), which a Japanese reader is shown instead of the label (Speaker.pairName); and the one CSS gradient string"],
  ["src/lib/catalogue/gameSettings.ts", "language and word-list names, each an English label beside its own name in Japanese (英語, 仏語, 独語, かな, 日常, ポップ) that a Japanese reader is shown instead"],
  ["src/lib/catalogue/gamesTabs.ts", "the catalogue's tab names, each an English label beside its own kanji (学び, 名局, 賽) that a Japanese reader is shown instead"],
  ["src/lib/famous/famousGames.data.ts", "the names of players, events and places exactly as the sources record them, and the games' moves: a record, not the site's own sentences"],
]);

/**
 * Tables of copy that belong to data, written once per language BESIDE the data
 * they describe (AGENTS.md, "Every Word Goes Through The Phrase Table"): each is
 * typed `Record<…>` over both languages or sits next to its Japanese sibling,
 * so a row with no Japanese is a compile error, and a coverage test holds both
 * halves complete. The English in them IS the site's English; it is not left
 * out of the gate for being unread. It is here because a table of a hundred
 * level names or seventy-three awards is data with words in it, and moving it
 * into the phrase catalogue would only make a second copy of the data.
 * Each path says what the table is and where its Japanese is.
 */
export const COPY_TABLES = new Map([
  ["src/lib/xp/xpAwardCopy.constants.ts", "what every XP award is called and why, English and Japanese side by side, a `Record<XpEventType, …>` each; held complete by xp.coverage.test.ts"],
  ["src/lib/xp/levelNames.constants.ts", "the hundred level names in English; the Japanese row for each is in levelNames.ja.constants.ts, held to the same hundred by levelNames.test.ts"],
  ["src/lib/xp/levelNames.ja.constants.ts", "the hundred level names in Japanese, whose `back` field is English reading the Japanese back for the review sheet; held to the same hundred by levelNames.test.ts"],
]);

/**
 * Text that is code in a string: SQL a query runs. Matched whole, because a
 * query's AND and IN read as function words.
 */
const CODE_IN_A_STRING = /\b(?:SELECT|INSERT INTO|UPDATE|DELETE FROM|WHERE|ORDER BY|GROUP BY|LEFT JOIN|CREATE TABLE)\b|^\s*(?:AND|OR)\s/;

/**
 * Bare terms a page may draw without a phrase: a brand, a name nobody
 * translates, a notation. Matched as whole words and removed before the prose
 * check. Each with why.
 */
export const ALLOWED_TERMS = [
  ["Itsutsu", "the site's own name, which is a name rather than a phrase (AGENTS.md: \"the brand is not a phrase\")"],
  ["XP", "the point currency, a bare acronym everywhere it is drawn"],
  ["Escape", "the name `KeyboardEvent.key` reports for the Escape key, compared and never drawn"],
  ["SGF|PDN", "file-format names, the same in every language"],
  ["Google", "the sign-in provider's name"],
  ["Vercel|Neon", "hosting and database providers' names"],
  ["Wikipedia", "a site's name"],
  ["CC BY(?:-SA|-NC)?(?:\\s*4\\.0)?|CC0", "a Creative Commons licence identifier"],
  ["[a-h][1-9][0-9]?", "board coordinates such as e5 or h10"],
];

/** The repository this script sits in, whatever directory it is run from. */
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

const ALLOWED_PATTERN = new RegExp(`\\b(?:${ALLOWED_TERMS.map(([term]) => term).join("|")})\\b`, "g");

/** Words whose presence is a strong tell that a string is prose, not code. */
const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "you", "your", "yours", "we", "us", "our", "they", "them", "their", "it's", "its",
  "to", "for", "with", "from", "by", "as", "of", "in", "on", "at", "into", "onto",
  "this", "that", "these", "those", "and", "or", "but", "not", "no", "yes",
  "can", "cannot", "can't", "will", "won't", "would", "could", "should", "may", "might", "must",
  "do", "does", "did", "don't", "doesn't", "didn't", "have", "has", "had", "hasn't", "haven't",
  "if", "when", "while", "whenever", "because", "so", "than", "then",
  "what", "who", "how", "why", "which", "there", "here", "still", "already", "again",
  "please", "let's", "let", "never", "always", "keep", "keeps", "kept",
]);

/** A whole identifier, never prose: lower-kebab or dotted tokens, no spaces. */
const IDENTIFIER_SHAPED = /^[a-z][a-z0-9]*(?:[:._/-][a-z0-9]+)+$/;

/** Does what remains, once names are taken out, read as English prose? */
export function looksLikeEnglish(raw) {
  const trimmed = raw.trim();
  if (IDENTIFIER_SHAPED.test(trimmed)) return false;
  /* A path, an address, a selector or a media query is never a sentence. */
  if (/^(?:https?:|\/|\.\/|\.\.\/|@\/|#|[a-z-]+:\/\/)/.test(trimmed) && !/\s/.test(trimmed)) return false;
  const stripped = raw.replace(ALLOWED_PATTERN, " ").replace(/\{[^}]*\}/g, " ").replace(/\$\{[^}]*\}/g, " ");
  const words = stripped.match(/[A-Za-z][A-Za-z']*/g);
  if (!words || words.length === 0) return false;

  const lower = words.map((word) => word.toLowerCase());
  const stopwordHits = lower.filter((word) => STOPWORDS.has(word)).length;
  const contentWords = lower.filter((word) => !STOPWORDS.has(word) && word.length >= 3);
  if (stopwordHits >= 1 && words.length >= 2 && contentWords.length >= 1) return true;

  /* A short phrase with no function word: "Save", "Display name", "Not connected".
     Capitalised only, and with a lower-case letter in it, so "GET" and "UTF" are
     not copy. */
  if (/^[A-Z][a-zA-Z]*(?:['-][a-zA-Z]+)*(?:\s+[A-Za-z][a-zA-Z']*)*[.!?,]?$/.test(stripped.trim())) {
    return words.some((word) => word.length >= 3 && /[a-z]/.test(word));
  }
  return false;
}

/**
 * Walks a source file once and reports each string literal and each JSX text,
 * comments and regular expressions skipped. `isTsx` allows an apostrophe in
 * JSX text to fail to open a string: a quote that does not close on its own
 * line is not a string.
 */
export function tokens(source, isTsx) {
  const found = [];
  let line = 1;
  let index = 0;
  let lastSignificant = "";
  const length = source.length;
  const advance = (count = 1) => {
    for (let step = 0; step < count; step += 1) {
      if (source[index] === "\n") line += 1;
      index += 1;
    }
  };
  const regexAllowedAfter = new Set(["", "(", ",", "=", ":", "[", "!", "&", "|", "?", "{", "}", ";", "<", ">", "+", "-", "*", "%", "~", "^"]);

  while (index < length) {
    const here = source[index];
    const next = source[index + 1];

    if (here === "/" && next === "/") {
      while (index < length && source[index] !== "\n") index += 1;
      continue;
    }
    if (here === "/" && next === "*") {
      advance(2);
      while (index < length && !(source[index] === "*" && source[index + 1] === "/")) advance();
      advance(2);
      continue;
    }
    if (here === "/" && regexAllowedAfter.has(lastSignificant) && !isTsx) {
      /* A regular expression literal: skip to its closing slash on this line. */
      let probe = index + 1;
      let inClass = false;
      while (probe < length && source[probe] !== "\n") {
        if (source[probe] === "\\") probe += 2;
        else if (source[probe] === "[") {
          inClass = true;
          probe += 1;
        } else if (source[probe] === "]") {
          inClass = false;
          probe += 1;
        } else if (source[probe] === "/" && !inClass) break;
        else probe += 1;
      }
      if (source[probe] === "/") {
        index = probe + 1;
        lastSignificant = ")";
        continue;
      }
    }
    if (here === '"' || here === "'") {
      let probe = index + 1;
      let text = "";
      while (probe < length && source[probe] !== here && source[probe] !== "\n") {
        if (source[probe] === "\\") {
          text += source[probe + 1] ?? "";
          probe += 2;
        } else {
          text += source[probe];
          probe += 1;
        }
      }
      if (source[probe] === here) {
        const before = source.slice(Math.max(0, index - 40), index);
        const after = source.slice(probe + 1, probe + 8);
        found.push({ kind: "string", text, line, before, after, quote: here });
        index = probe + 1;
        lastSignificant = here;
        continue;
      }
      /* An apostrophe in prose, or a quote that never closes: not a string. */
      index += 1;
      continue;
    }
    if (here === "`") {
      const startLine = line;
      const before = source.slice(Math.max(0, index - 40), index);
      let probe = index + 1;
      let text = "";
      let depth = 0;
      while (probe < length) {
        const c = source[probe];
        if (c === "\\" && depth === 0) {
          text += source[probe + 1] ?? "";
          probe += 2;
          continue;
        }
        if (depth === 0 && c === "`") break;
        if (depth === 0 && c === "$" && source[probe + 1] === "{") {
          depth = 1;
          text += "{x}";
          probe += 2;
          continue;
        }
        if (depth > 0) {
          if (c === "{") depth += 1;
          else if (c === "}") depth -= 1;
          probe += 1;
          continue;
        }
        text += c;
        probe += 1;
      }
      const consumed = source.slice(index, probe + 1);
      found.push({ kind: "string", text, line: startLine, before, after: source.slice(probe + 1, probe + 8), quote: "`" });
      line += consumed.split("\n").length - 1;
      index = probe + 1;
      lastSignificant = "`";
      continue;
    }
    if (here === "\n") line += 1;
    if (!/\s/.test(here)) lastSignificant = here;
    index += 1;
  }
  return found;
}

/** JSX text nodes of a .tsx file, comments and string literals blanked out first so `>` and `<` inside them do not fool the pattern. */
export function jsxTexts(source) {
  let blanked = "";
  let index = 0;
  while (index < source.length) {
    const here = source[index];
    const next = source[index + 1];
    if (here === "/" && next === "/" && source[index - 1] !== ":") {
      while (index < source.length && source[index] !== "\n") index += 1;
      continue;
    }
    if (here === "/" && next === "*") {
      index += 2;
      while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) {
        if (source[index] === "\n") blanked += "\n";
        index += 1;
      }
      index += 2;
      continue;
    }
    blanked += here;
    index += 1;
  }
  const found = [];
  const pattern = /(?<![{}=])>([^<>{}\n]*[A-Za-z][^<>{}\n]*)</g;
  for (const match of blanked.matchAll(pattern)) {
    const text = (match[1] ?? "").trim();
    if (!text || /&&|\|\||===|!==|=>|\(\)|\[\]|;/.test(text)) continue;
    found.push({ text, line: blanked.slice(0, match.index ?? 0).split("\n").length });
  }
  return found;
}

/** Attribute names whose string is never something a member reads. */
const NON_TEXT_ATTRS = /^(?:className|class|href|src|srcSet|id|key|name|type|role|rel|target|d|points|viewBox|fill|stroke|style|htmlFor|autoComplete|inputMode|method|action|data-.+|aria-(?:labelledby|describedby|controls|live|haspopup|current|orientation|sort|autocomplete)|testId|slug|lang|hrefLang|dir|loading|decoding|sizes|media|content|property|crossOrigin|accept|pattern|mode|variant|size|tone|kind|as|align|justify)$/;

/** Calls whose argument is for a developer, not a reader. */
const DEV_CALL = /(?:new\s+Error|console\.\w+|throw|assert\w*|invariant|describe|it|test|expect|import|require|\.test|\.match|\.replace|\.split|\.startsWith|\.endsWith|\.includes|\.indexOf|new\s+RegExp|new\s+URL|\.getItem|\.setItem|\.removeItem|\.get|\.set|\.has|\.delete|\.append|searchParams\.\w+|headers\.\w+|cookies\.\w+|revalidateTag|revalidatePath|redirect|notFound)\s*\(\s*$/;

/**
 * The source with its comments blanked, character for character, so a line
 * number is still a line somebody can open. Strings and template literals are
 * kept (and skipped over, so a `//` in a URL starts no comment): the patterns
 * below read the very literals a plural is made of.
 *
 * @param {string} source
 */
export function withoutComments(source) {
  let out = "";
  let index = 0;
  const blank = (text) => text.replace(/[^\n]/g, " ");
  while (index < source.length) {
    const here = source[index];
    const next = source[index + 1];
    if (here === "/" && next === "/") {
      const end = source.indexOf("\n", index);
      const stop = end === -1 ? source.length : end;
      out += blank(source.slice(index, stop));
      index = stop;
      continue;
    }
    if (here === "/" && next === "*") {
      const end = source.indexOf("*/", index + 2);
      const stop = end === -1 ? source.length : end + 2;
      out += blank(source.slice(index, stop));
      index = stop;
      continue;
    }
    if (here === '"' || here === "'") {
      let probe = index + 1;
      while (probe < source.length && source[probe] !== here && source[probe] !== "\n") probe += source[probe] === "\\" ? 2 : 1;
      out += source.slice(index, probe + 1);
      index = probe + 1;
      continue;
    }
    if (here === "`") {
      /* A template literal: its text, and the code inside each `${ }`, which may hold strings of its own. */
      let probe = index + 1;
      let depth = 0;
      while (probe < source.length) {
        const c = source[probe];
        if (depth === 0 && c === "`") break;
        if (c === "\\") {
          probe += 2;
          continue;
        }
        if (depth === 0 && c === "$" && source[probe + 1] === "{") {
          depth = 1;
          probe += 2;
          continue;
        }
        if (depth > 0) {
          if (c === "{") depth += 1;
          else if (c === "}") depth -= 1;
        }
        probe += 1;
      }
      out += source.slice(index, probe + 1);
      index = probe + 1;
      continue;
    }
    out += here;
    index += 1;
  }
  return out;
}

/**
 * A comparison against 1 that picks a piece of text: the shape every hand-built
 * plural has. `=== 1`, `!== 1`, `> 1`, `<= 1`, then `?` and a string whose first
 * character is a letter, a digit or nothing at all ("" for the singular).
 */
const PLURAL_BRANCH = /[!=]==?\s*1\s*\?\s*(?:"(?:[A-Za-z0-9]|")|'(?:[A-Za-z0-9]|')|`(?:[A-Za-z0-9]|`|\$\{))/g;
/** The same ternary the other way round, for the singular's suffix: `n > 1 ? "s" : ""`. */
const PLURAL_SUFFIX_BRANCH = /[<>]=?\s*1\s*\?\s*(?:["'](?:s|es)["']\s*:\s*["']["']|["']["']\s*:\s*["'](?:s|es)["'])/g;
/** `if (n === 1) return "a card";` and its block form. */
const PLURAL_RETURN = /[!=]==?\s*1\)\s*(?:return\s+|\{\s*return\s+)["'`][A-Za-z0-9]/g;
/** `noun + "s"`, the oldest one. */
const PLURAL_SUFFIX = /\+\s*["']s["']/g;
/** A date or a number formatted by the runtime's own locale, or one typed in. */
const LOCALE_CALL = /\.toLocale(?:Date|Time)?String\s*\(/g;

/** The index just past the `)` that closes the call whose `(` is at `open`, and its top-level argument count. */
function callArguments(code, open) {
  let depth = 0;
  let args = 0;
  let sawAny = false;
  for (let index = open; index < code.length; index += 1) {
    const c = code[index];
    if (c === '"' || c === "'" || c === "`") {
      const quote = c;
      index += 1;
      while (index < code.length && code[index] !== quote) index += code[index] === "\\" ? 2 : 1;
      sawAny = true;
      continue;
    }
    if (c === "(" || c === "[" || c === "{") depth += 1;
    else if (c === ")" || c === "]" || c === "}") {
      depth -= 1;
      if (depth === 0) return { end: index + 1, args: sawAny ? args + 1 : 0 };
    } else if (c === "," && depth === 1) args += 1;
    else if (depth >= 1 && !/\s/.test(c)) sawAny = true;
  }
  return { end: code.length, args: 0 };
}

/**
 * The patterns of ENJA-04 in one file: a locale typed or taken from the runtime,
 * a plural made by hand, and a figure counted with no locale. Pure, for the test.
 *
 * @param {string} source
 * @returns {{ line: number; kind: string; snippet: string }[]}
 */
export function formatPatternsIn(source) {
  const code = withoutComments(source);
  const lineOf = (at) => code.slice(0, at).split("\n").length;
  const snippetAt = (at) => code.slice(code.lastIndexOf("\n", at) + 1, code.indexOf("\n", at) === -1 ? undefined : code.indexOf("\n", at)).trim().slice(0, 120);
  const found = [];
  const add = (kind, at) => found.push({ line: lineOf(at), kind, snippet: snippetAt(at) });
  for (const match of code.matchAll(LOCALE_CALL)) add("locale", match.index);
  for (const pattern of [PLURAL_BRANCH, PLURAL_SUFFIX_BRANCH, PLURAL_RETURN, PLURAL_SUFFIX]) for (const match of code.matchAll(pattern)) add("plural", match.index);
  for (const match of code.matchAll(/(?<![\w.])countText\(/g)) {
    const before = code.slice(code.lastIndexOf("\n", match.index) + 1, match.index);
    if (/(?:function|import|export)\s*(?:\{[^}]*)?$/.test(before)) continue;
    if (callArguments(code, match.index + match[0].length - 1).args === 1) add("no-locale", match.index);
  }
  /* One report per line and kind: a line with two plurals is one thing to fix. */
  const seen = new Set();
  return found.filter((item) => {
    const key = `${item.line}:${item.kind}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function flaggedIn(relPath, source) {
  const isTsx = relPath.endsWith(".tsx");
  const flagged = [];
  for (const token of tokens(source, isTsx)) {
    const { text, before, after } = token;
    if (!text.trim() || CODE_IN_A_STRING.test(text) || !looksLikeEnglish(text)) continue;
    const trimmedBefore = before.trimEnd();
    /* An import or re-export specifier. */
    if (/(?:\bfrom|\bimport|\brequire\(|\bimport\()\s*$/.test(trimmedBefore)) continue;
    /* An object key (`{ "a b": 1 }`, `, "a b": 1`), not a ternary branch. */
    if (/^\s*:/.test(after) && /[{,]\s*$/.test(trimmedBefore)) continue;
    if (/^\s*\]\s*:/.test(after) && /\[\s*$/.test(trimmedBefore)) continue;
    /* An argument for a developer. */
    if (DEV_CALL.test(trimmedBefore)) continue;
    /* An attribute: judged by its name. */
    const attribute = /([A-Za-z][\w:-]*)=\{?\s*$/.exec(trimmedBefore);
    if (attribute) {
      if (NON_TEXT_ATTRS.test(attribute[1])) continue;
      flagged.push({ line: token.line, kind: `attr:${attribute[1]}`, snippet: text });
      continue;
    }
    flagged.push({ line: token.line, kind: "literal", snippet: text });
  }
  if (isTsx) {
    for (const jsx of jsxTexts(source)) {
      if (looksLikeEnglish(jsx.text)) flagged.push({ line: jsx.line, kind: "jsx-text", snippet: jsx.text });
    }
  }
  for (const item of formatPatternsIn(source)) flagged.push(item);
  return flagged;
}

function walk(dirPath, out) {
  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    const entryPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(entryPath, out);
    } else if (entry.isFile() && /\.tsx?$/.test(entry.name) && !/\.(?:test|play\.test|coverage\.test)\.tsx?$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
      out.push(entryPath);
    }
  }
}

/** The kinds that are a pattern in the code and not a sentence in English. */
export const PATTERN_KINDS = new Set(["locale", "plural", "no-locale"]);

const under = (relPath, folder) => relPath === folder || relPath.startsWith(`${folder}/`);

/**
 * Every flagged string under `root`'s `src`, by file.
 *
 * @param {string} [root]
 * @returns {{ scanned: number; byFile: Map<string, { line: number; kind: string; snippet: string }[]> }}
 */
export function scan(root = repoRoot) {
  /** @type {string[]} */
  const files = [];
  walk(join(root, "src"), files);
  /** @type {Map<string, { line: number; kind: string; snippet: string }[]>} */
  const byFile = new Map();
  for (const absPath of files) {
    const relPath = relative(root, absPath).split("\\").join("/");
    if (EXCLUDED_PATHS.some(([path]) => under(relPath, path))) continue;
    if (ALLOWED_FILES.has(relPath) || COPY_TABLES.has(relPath)) continue;
    if (!COPY_DATA_FILES.has(relPath) && EXCLUDED_NAMES.some(([pattern]) => pattern.test(relPath))) continue;
    const list = flaggedIn(relPath, readFileSync(absPath, "utf8"));
    if (list.length > 0) byFile.set(relPath, list);
  }
  return { scanned: files.length, byFile };
}

/**
 * @param {string} relPath
 * @param {{ path: string; ticket: string }[]} [pending]
 * The pending entry that covers a file, if any. The first matching entry wins,
 * so a file listed under one ticket inside a folder listed under another goes
 * to the earlier one.
 */
export function pendingFor(relPath, pending = PENDING_PATHS) {
  return pending.find((entry) => under(relPath, entry.path));
}

/**
 * Judges a scan against the pending list. Pure, so the test can ask it
 * questions with a list of its own.
 *
 * @param {{ byFile: Map<string, { line: number; kind: string; snippet: string }[]> }} result
 * @param {{ path: string; ticket: string }[]} [pending]
 * @param {(path: string) => boolean} [exists]  Said of each pending path; defaults to "it does".
 */
export function judge(result, pending = PENDING_PATHS, exists = () => true) {
  /** @type {{ file: string; line: number; kind: string; snippet: string }[]} */
  const violations = [];
  const counts = new Map(pending.map((entry) => [entry.path, 0]));
  /** How many of each pending path's count are the ENJA-04 patterns and not sentences. */
  const patterns = new Map(pending.map((entry) => [entry.path, 0]));
  for (const [file, list] of result.byFile) {
    const entry = pendingFor(file, pending);
    if (entry) {
      counts.set(entry.path, (counts.get(entry.path) ?? 0) + list.length);
      patterns.set(entry.path, (patterns.get(entry.path) ?? 0) + list.filter((item) => PATTERN_KINDS.has(item.kind)).length);
    } else for (const item of list) violations.push({ file, ...item });
  }
  const finished = pending.filter((entry) => (counts.get(entry.path) ?? 0) === 0);
  const missing = pending.filter((entry) => !exists(entry.path));
  return { violations, counts, patterns, finished, missing };
}

function main() {
  const result = scan();
  const verdict = judge(result, PENDING_PATHS, (path) => existsSync(join(repoRoot, path)));

  let total = 0;
  let patternTotal = 0;
  if (PENDING_PATHS.length > 0) {
    console.log("i18n string check: English still pending, not enforced (PENDING_PATHS):");
    for (const entry of PENDING_PATHS) {
      const count = verdict.counts.get(entry.path) ?? 0;
      const pattern = verdict.patterns.get(entry.path) ?? 0;
      total += count;
      patternTotal += pattern;
      console.log(`  ${String(count).padStart(5)}  ${entry.path}  (${entry.ticket})${pattern > 0 ? `  [${pattern} of them hand-built plural, locale or no-locale count]` : ""}`);
    }
    console.log(`  ${String(total).padStart(5)}  in all, in ${PENDING_PATHS.length} pending path(s), ${patternTotal} of them plural, locale or no-locale count patterns\n`);
  }

  let failed = false;
  if (verdict.violations.length > 0) {
    failed = true;
    console.error(`i18n string check failed: ${verdict.violations.length} English string(s) outside the phrase table.\n`);
    const byFile = new Map();
    for (const v of verdict.violations) {
      if (!byFile.has(v.file)) byFile.set(v.file, []);
      byFile.get(v.file).push(v);
    }
    for (const [file, list] of [...byFile.entries()].sort()) {
      console.error(file);
      for (const v of list.sort((a, b) => a.line - b.line)) console.error(`  ${v.line}: [${v.kind}] ${v.snippet.trim().slice(0, 120)}`);
    }
    console.error(
      "\nMove this text into PHRASES (src/lib/i18n/phrases.<area>.constants.ts) with its Japanese in the dictionaries, and read it\n" +
        "with speaker.say(key). A name, a brand or a code is an allowance in ALLOWED_TERMS or ALLOWED_FILES in this script, with a reason.\n" +
        "Do not add the path to PENDING_PATHS: that list only shrinks.",
    );
  }
  for (const entry of verdict.finished) {
    failed = true;
    console.error(`\nPENDING_PATHS entry "${entry.path}" (${entry.ticket}) holds no English any more: take it off the list.`);
  }
  for (const entry of verdict.missing) {
    failed = true;
    console.error(`\nPENDING_PATHS entry "${entry.path}" (${entry.ticket}) no longer exists: take it off the list.`);
  }
  if (failed) process.exit(1);
  console.log(`i18n string check passed: ${result.scanned} source files scanned, ${total} string(s) pending in ${PENDING_PATHS.length} path(s).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
