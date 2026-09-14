import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PHRASES } from "@/lib/i18n/i18n.constants";

/**
 * Nothing is a dead end, and this is what keeps it that way.
 *
 * Two rules, in John's words:
 *
 *   "If you see a name of a game, it's clickable."
 *   "If you see a W/L/T record, each number you see should be clickable —
 *    when it's for this site."
 *
 * And the principle under both: any number that refers to games is a filter
 * somebody already ran. The page had those games in its hands in order to
 * count them; printing the total and dropping the query makes the reader
 * rebuild by hand the question the page has just answered.
 *
 * This exists because both rules were stated, agreed to, and then broken again
 * on the next page somebody wrote — four pages named a game in plain words and
 * three printed a record as a string. A rule that lives only in a review is a
 * rule that holds until the reviewer is busy. So it lives here, and a page
 * that forgets it fails the build.
 *
 * Crude on purpose: it reads the source and looks for the shapes that went
 * wrong. Anything cleverer would need the components rendered, and this is a
 * rule about what the source asks for rather than about pixels.
 *
 * The exceptions are listed by name with their reason, and that is the point
 * of them. A rule with unexplained holes rots; a rule whose three holes each
 * say why they are holes can be argued with.
 */

const ROOTS = ["src/components", "src/app"];

/** The two components every other file goes through, and nothing else. */
const OWNERS = new Set(["GameName.tsx", "GameCount.tsx", "PlayerRecord.tsx"]);

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(path));
    else if (entry.name.endsWith(".tsx") && !OWNERS.has(entry.name)) out.push(path);
  }
  return out;
}

/**
 * The file with its comments blanked out, character for character.
 *
 * EVERY CHECK BELOW READS THIS RATHER THAN THE FILE, and it was a hole rather
 * than a nicety: `GamePicker.tsx` explains its own exception in prose that
 * quotes the idiom — "this one goes through `<Paired en={copy.label}>` as a
 * prop" — so the widened matcher found the SENTENCE ABOUT a game name and
 * reported the file. A gate that reads the explanation of the rule as a breach
 * of it is a gate people delete. Worse in the other direction: the same file's
 * prose mentions "an <a> inside the <label>" with no closing tag, which is
 * enough to make a tag-counting check believe every name after it sits inside
 * a form control.
 *
 * Blanked rather than removed, so every offset is still an offset into the
 * real file and the line a failure names is the line somebody has to open.
 * `//` is only a comment where the character before it is not a word
 * character or a colon — `https://` is an address, not a comment.
 */
function code(source: string): string {
  const blank = (text: string) => text.replace(/[^\n]/g, " ");
  return source
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^\w:])\/\/[^\n]*/g, (match, lead: string) => lead + blank(match.slice(lead.length)));
}

const FILES = ROOTS.flatMap(filesUnder).map((path) => ({
  path,
  source: code(readFileSync(path, "utf8")),
}));

/**
 * Whether what is printed here is already inside something clickable.
 *
 * The rule is that a game's name leads to that game, not that it goes through
 * one component: the family line under a game links its siblings to their own
 * ladders, and the learn page links a guide's games to their rules, and both
 * are the rule kept rather than broken. So this looks for an open link around
 * the name rather than for an import.
 *
 * Bounded to what a tag and its attributes can span, so a link four elements
 * earlier cannot vouch for a name that is nowhere near it.
 */
function inside(tag: string, source: string, at: number): boolean {
  const before = source.slice(Math.max(0, at - 400), at);
  const open = before.lastIndexOf(`<${tag}`);
  if (open === -1) return false;
  return open > before.lastIndexOf(`</${tag}>`);
}

function clickable(source: string, at: number): boolean {
  return inside("Link", source, at) || inside("a ", source, at);
}

/**
 * Whether this sits inside a form control — an element a link cannot live in.
 *
 * UNBOUNDED, unlike `inside` above, and the difference is the argument rather
 * than a convenience. A LINK has to wrap the name closely to be that name's
 * link, so four hundred characters is the whole of what could honestly vouch
 * for it. "I am inside a `<label>`" is not a claim about nearness: it is true
 * however much markup and prose intervenes, and in `GamePicker` the label
 * opens forty lines and two measured arguments above the name it is for.
 *
 * `<label>` and `<button>` join `<option>` for the reason the rule already
 * gave `<option>`: choosing one IS the way to that game, which is the same
 * promise kept another way, and an `<a>` inside either would swallow the click
 * that chooses.
 *
 * Walked as a depth rather than counted as two totals, because a SELF-CLOSING
 * control closes itself: `ProfileForm.tsx` writes `<option … />` for a list a
 * datalist fills, and a pair of totals would read that as one more open tag
 * than close and then believe every name after it in the file sits inside a
 * select. One stray tag quietly exempting the rest of a file is the shape of
 * hole this whole gate is about.
 */
const CONTROL_TAG = /<(\/?)(option|label|button)\b([^>]*)>/g;

function insideControl(source: string, at: number): boolean {
  let depth = 0;
  for (const match of source.slice(0, at).matchAll(CONTROL_TAG)) {
    const [, closing, , attributes] = match;
    if (closing === "/") depth -= 1;
    else if (!attributes.trimEnd().endsWith("/")) depth += 1;
  }
  return depth > 0;
}

/**
 * Which local names in a file hold a GAME's display copy, at one position.
 *
 * Read backwards from where the name is printed to the nearest binding of it,
 * because `copy` is not one thing: `GameBrowser.tsx` uses that name for a
 * game's row and then for an OPENING's forty lines later, and a file-wide
 * list of names would demand a link to a game for the name of an opening.
 * A gate that cries wolf is one people learn to edit rather than obey.
 *
 * Two ways a binding is a game, and no third:
 *
 *   - assigned from `RULE_VARIANT_DISPLAY[…]`, which is the table of games.
 *     Assigned from any other `…_DISPLAY[…]` it is something else — an
 *     opening, a status, a tier — and not this rule's business.
 *   - bound as a callback parameter over a list, AND read for its `.variant`
 *     somewhere in the file. A row carrying a variant key beside its label is
 *     a game however the list was typed, which is what the /games cards hand
 *     `GameCards` and what no chain of `.filter`s could be followed through.
 */
function isGameName(source: string, expression: string, at: number): boolean {
  if (/^variantLabel\(/.test(expression)) return true;
  if (/^RULE_VARIANT_DISPLAY\[/.test(expression)) return true;
  const held = /^([A-Za-z_$][\w$]*)\.label$/.exec(expression)?.[1];
  if (held === undefined) return false;
  const before = source.slice(0, at);
  let table: string | null = null;
  let assignedAt = -1;
  for (const match of before.matchAll(new RegExp(`\\b${held}\\s*=\\s*([A-Za-z_$][\\w$]*)\\s*\\[`, "g"))) {
    table = match[1];
    assignedAt = match.index;
  }
  let paramAt = -1;
  for (const match of before.matchAll(new RegExp(`[(,]\\s*${held}\\s*(?:,|\\)|=>|:)`, "g"))) {
    paramAt = match.index;
  }
  if (paramAt > assignedAt) return new RegExp(`\\b${held}\\.variant\\b`).test(source);
  return table === "RULE_VARIANT_DISPLAY";
}

/**
 * Every place a file prints a game's name into the page.
 *
 * `${...}` is left out on purpose. A name inside a template string is a name
 * inside a SENTENCE — a hover note, a page title, a line of advice — and a
 * link cannot live in a string. Those are the exception the rule always had:
 * "a game named inside a sentence of copy is not a link and cannot be."
 *
 * THE THIRD PATTERN IS THE ONE THE SITE ACTUALLY USES NOW, and adding it is
 * this gate catching up with its own subject rather than covering a new case.
 * `<Paired en={…} kanji={…}>` is how a name and its kanji are written since
 * there were two languages — the /games cards do it, the game picker does it,
 * the champions table does it — and a name handed over as a PROP was invisible
 * to a matcher looking for a name in a text position. So the gate held for the
 * idiom the site was leaving and saw nothing of the one it had moved to: it
 * would have passed a page that named forty games through `Paired` outside a
 * link, which is exactly the fault it exists to fail.
 *
 * `Paired` is also the RIGHT thing to gate on rather than a convenient one. It
 * pairs a word with its kanji, which is a LABEL position by construction — the
 * name of something, in a heading, a cell or a card. The sibling idiom this
 * deliberately does NOT add is the bare `{copy.label}` of a variant binding:
 * in JSX that form is indistinguishable from prose, and eight of the thirteen
 * places it appears are sentences — "games of {copy.label} between two named
 * members" — so matching it would mean exempting whole files for reasons that
 * have nothing to do with the rule.
 */
const PAIRED_NAME = /<Paired\b[^>]{0,240}?\ben=\{\s*([^{}]{1,80}?)\s*\}/g;

function namesPrinted(source: string): number[] {
  const patterns = [
    /(?<!\$)\{\s*variantLabel\(/g,
    /(?<!\$)\{\s*RULE_VARIANT_DISPLAY\[[^\]]+\]\.label\s*\}/g,
  ];
  const found: number[] = [];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) found.push(match.index);
  }
  for (const match of source.matchAll(PAIRED_NAME)) {
    if (isGameName(source, match[1], match.index)) found.push(match.index);
  }
  return found;
}

/**
 * Files where a game's name is printed as a CHOICE, by name with the reason.
 *
 * The same argument as `<option>`, `<label>` and `<button>` above, for a chooser
 * whose markup is none of those: a name inside it is what you pick, and a link
 * on it would take the reader away from the thing they are in the middle of.
 * Named by file rather than widened into a pattern, so a list that is not a
 * chooser cannot borrow the exception.
 */
const CHOOSERS: Record<string, string> = {
  /*
   * The games browser over the practice board. The widened matcher found its
   * forty names and the first answer was to link them — which made each one a
   * way off the board in the middle of choosing, with nothing set kept. Picking
   * is the Play button; reading about the focused game is the openings heading,
   * which does go through `GameName`.
   */
  "src/components/game/GameBrowser.tsx": "a chooser over the board: the name is what you pick, not a way out",
};

describe("a game's name is the way into that game", () => {
  it("every chooser exception is a file that still exists", () => {
    const known = new Set(FILES.map((file) => file.path));
    expect(Object.keys(CHOOSERS).filter((path) => !known.has(path))).toEqual([]);
  });

  it("has files to check, so a passing run means something", () => {
    // A glob that quietly matched nothing would pass every case below.
    expect(FILES.length).toBeGreaterThan(40);
  });

  it("finds the names that are printed, so the check below is not vacuous", () => {
    // If the patterns ever stop matching, every file becomes compliant at once.
    expect(FILES.filter((file) => namesPrinted(file.source).length > 0).length).toBeGreaterThan(3);
  });

  it("sees a name written through Paired, which is how the site writes them now", () => {
    /*
     * The vacuity guard for the pattern this gate was blind to, kept separate
     * from the one above so that the OLD idiom disappearing cannot hide the new
     * one disappearing too. Both counts were non-zero when this was written —
     * five `Paired` names across five files — and a nought here means the
     * matcher has stopped seeing the way the site names a game.
     */
    const paired = FILES.filter((file) =>
      [...file.source.matchAll(PAIRED_NAME)].some((match) =>
        isGameName(file.source, match[1], match.index),
      ),
    );
    expect(paired.length, "a game's name through <Paired en={…}> is still matched").toBeGreaterThan(0);
  });

  it("nobody prints a game's name with nothing behind it", () => {
    /*
     * Five pages did exactly this — the waiting room, a member's own games,
     * the local game card, a kept game's line and a finished match's heading.
     * Each named a game, in the ordinary way a page names a game, and led
     * nowhere at all.
     */
    const offenders = FILES.filter((file) =>
      namesPrinted(file.source).some(
        (at) =>
          !clickable(file.source, at) &&
          // A value in a select, a radio's own label, a button. None of the
          // three can hold a link, and choosing one is itself the way to that
          // game — the same promise kept another way. See `insideControl`.
          !insideControl(file.source, at) &&
          /*
           * THE PAGE'S OWN TITLE, on a page that leads to the game anyway.
           *
           * /games/<slug>/standings names its game in an `<h1>`, which is the
           * "page title" AGENTS.md already lists beside a hover note and a line
           * of advice as something that is not a link and cannot be: a reader is
           * inside that game's address, so the name is what they are looking at
           * rather than somewhere to go. The `gamePath(` is what keeps this from
           * being a blanket hole — the breadcrumb one line above the heading
           * links up to the game, on every facet page, and a page that names a
           * game in its heading and offers no way to it is still caught.
           */
          !(inside("h1", file.source, at) && file.source.includes("gamePath(")),
      ),
    )
      .map((file) => file.path)
      .filter((path) => CHOOSERS[path] === undefined);

    expect(offenders, "render the name through GameName, which links it").toEqual([]);
  });
});

/**
 * A bare count of games, printed as a member access with nothing behind it.
 *
 * `.(games|played)` catches the two names this codebase gives a plain count.
 * `ratedGames` is a third, and a regex technicality let it through: a
 * player's page printed `player.ratedGames` and `player.computer.ratedGames`
 * — the pools' own rated-game counts — as bare `<span>`s, and neither matched.
 * `ratedGames` is not named `games`, and the second one is a TWO-dot chain a
 * single-dot pattern cannot reach. The `ratedGames` branch below allows one
 * extra `.segment` for exactly that nesting, kept as its OWN alternative
 * rather than folded into `(games|played)` so it cannot also start matching
 * an unrelated two-dot chain — `data.player.played` on the embed widget is a
 * real count this rule deliberately leaves unlinked (see EXCEPTIONS above),
 * and folding the extra segment into the shared branch would have caught it
 * by accident.
 */
const BARE_COUNT =
  /\{\s*[A-Za-z_$][\w$]*\.(games|played)\s*\}|\{\s*[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)?\.ratedGames\s*\}/g;

describe("a count of games is the way into those games", () => {
  it("nobody prints a record as a string", () => {
    /*
     * `recordText` returns "7W · 4L · 1D" — one string, and therefore one
     * thing to click at most, which is not what the rule asks for. It is
     * still right for the plain-text listing, which is text and has no links
     * in it at all, and that lives in lib rather than here.
     */
    const offenders = FILES.filter((file) => /recordText\(/.test(file.source)).map(
      (file) => file.path,
    );
    expect(
      offenders,
      "use RecordFigure from PlayerRecord.tsx, which links each number",
    ).toEqual([]);
  });

  /**
   * A number of games printed as words, with nothing behind it.
   *
   * The hole this closes was found by sweeping rather than by the gate: the
   * games index printed "12 played · last Kyu vs Dan" as ONE link, to the last
   * game. So the twelve led to one of them — the count answering a different
   * question from the one it asks, on a page every visitor sees. It slipped
   * through because the checks above look for a RECORD, and a lone count
   * beside the word "played" is neither a `recordText` call nor a table.
   *
   * The exceptions are the interesting part, and most of them are not
   * loopholes but a map of what this site cannot yet answer.
   */
  const EXCEPTIONS: Record<string, string> = {
    // Counts of GAMES THE SITE HAS, not games anybody played. "Forty games in
    // ten families" is a fact about the catalogue. This was the exception for
    // /games/all, which is now the plain-list VIEW of /games and lives here.
    "src/components/games/GameList.tsx": "counts rule sets, not matches",
    /*
     * GameCatalogue.tsx USED TO BE HERE, for the family line's count of every
     * match played in a family — a set no page can show, since /history
     * filters by one game. That line moved into a phrase in `GameStats.tsx`,
     * and its exception moved with it to PHRASE_EXCEPTIONS below, reason and
     * all. An exception left on a file that no longer prints the count is a
     * hole nobody knows is open, so it went.
     */
    // A suggestion in an autocomplete, which is the <option> case wearing
    // different markup: choosing it IS the way to those games.
    "src/components/game/PlayerNameInput.tsx": "a picker's own suggestion",
    // The total of the filter the reader is already looking at. A link would
    // lead to the page they are on.
    "src/components/history/Pager.tsx": "the count of the page you are already on",
    /*
     * THE SAME SENTENCE AS THE PAGER'S, in the control that replaces it.
     *
     * "40 of 3,493 shown" is the pager's "Page 2 of 175 · 3,493 games" said for
     * a reader who is scrolling instead of pressing Next, and it is exempt for
     * exactly the reason above and no other: every game it counts is already on
     * this page or one scroll below it, so the only honest destination for a
     * link would be the address the reader is at.
     *
     * Worth saying that this gate FOUND the line rather than the line being
     * written with an exception in mind. It is here because the reason survived
     * being asked for.
     */
    "src/components/history/LiveRecord.tsx": "the count of the page you are already on, scrolled",
    // An embed on somebody else's site. It is a picture of a record, and a
    // link out of it goes somewhere the reader did not ask to be sent.
    "src/components/embed/EmbedStats.tsx": "an embed on another site",
    // Counted on another site. There is no game here to open — the one
    // exception the rule has always had.
    "src/components/players/LegacySource.tsx": "counted elsewhere",
    /*
     * The gift line, and the reason it stays. `fetchTimeGiftRecord` counts
     * every game a gift was made in, FINISHED OR NOT — a fact about somebody's
     * conduct rather than about the record — while /history is finished games
     * by definition. So a link would show fewer games than the number beside
     * it, which is the fault this rule exists to stop, wearing a link. The gap
     * is in what "the record" means, not in the filters.
     *
     * Its neighbour used to sit here for a weaker reason and no longer does:
     * "the 12 games you judged" now links, because `verdict` was added.
     */
    "src/components/players/ItsutsuRecord.tsx": "the gift count includes unfinished games; the record is finished ones",
  };

  it("nobody prints a number of games as words, with nothing behind it", () => {
    /*
     * Attribute positions and names are skipped, or the check is noise: a
     * `key={game.id} game={…}` is not a count, and "Every game of {page.title}
     * played here" is a game's NAME inside a link that already keeps the rule.
     * A gate that cries wolf is one people learn to edit rather than obey.
     */
    const bare = /(.)\{([^{}]{1,40})\}\s*(played|games?)\b/g;
    const offenders = FILES.filter((file) =>
      [...file.source.matchAll(bare)].some(
        (match) =>
          match[1] !== "=" &&
          !/\.(title|name|label|id)\b/.test(match[2]) &&
          // Already the way into those games, however it was written. The rule
          // is that the number leads somewhere, not that it goes through one
          // component — the same reading the game-name check takes.
          !clickable(file.source, match.index) &&
          !inside("GameCount", file.source, match.index),
      ),
    )
      .map((file) => file.path)
      .filter((path) => EXCEPTIONS[path] === undefined);

    expect(
      offenders,
      "a count of games goes through GameCount — or name it above with the reason it cannot",
    ).toEqual([]);
  });

  it("every exception is a file that still exists", () => {
    // An exception left behind after its file is renamed is a hole nobody
    // knows is open.
    const known = new Set(FILES.map((file) => file.path));
    expect(Object.keys(EXCEPTIONS).filter((path) => !known.has(path))).toEqual([]);
  });

  it("every table of records says whose games it is counting", () => {
    /*
     * `of` is how a record says which set of games its numbers came from —
     * whose, which game, which ladder — and a count cannot link without it.
     * Leaving it off is the quiet way to opt out of the rule, so it is
     * required at every call site rather than defaulted to nothing.
     *
     * `of={{ here: false }}` is a valid answer. It says the figures were
     * counted on another site and there is nothing here to open, which is the
     * one honest reason a count does not link.
     */
    const call = /<Record(Cells|Line)\b[\s\S]{0,400}?\/>/g;
    const missing = FILES.flatMap((file) =>
      (file.source.match(call) ?? [])
        .filter((snippet) => !/\bof=\{/.test(snippet))
        .map(() => file.path),
    );
    expect(
      [...new Set(missing)],
      "pass of={{ player, variant, pool, rated }} — or of={{ here: false }} and say why",
    ).toEqual([]);
  });

  it("nobody prints a bare count of games", () => {
    /*
     * The shape the two checks above do not see, and the one that got past
     * them: not a record and not a table, just a number that happens to BE a
     * pile of games. The champions table printed its Games column — the rated
     * games each ladder is made of — as plain text for as long as that page
     * has existed, under a guard written to stop exactly this.
     *
     * `{x.games}` and `{x.played}` and nothing else, because those are the two
     * names this codebase gives a count of games. `{x.games.map(` is an array
     * of variants rather than a count, so the closing brace is part of the
     * pattern.
     *
     * IT NOW HAS ONE NAMED EXCEPTION, and adding it was the honest move rather
     * than the convenient one. The catalogue's family line — every match played
     * of anything in a family — has always been a count this site cannot link,
     * for the reason written against it in EXCEPTIONS above: /history filters
     * by ONE game and there is no page that shows a family's matches. It
     * escaped this check for as long as it existed only because it was written
     * `{playedIn(family.games)}`, a call rather than a field, which this
     * pattern does not see. Moving the sum into the row that carries it made
     * the same number read `{family.played}` and the check fired — correctly,
     * on a count that was always in its scope.
     *
     * So the choice was to rename the field until the regex looked away, or to
     * say out loud that this one cannot link and why. A gate routed around is
     * one of the four failures AGENTS.md names by shape; an exception with its
     * reason beside it is a rule that can be argued with.
     */
    /*
     * Empty since the games index's figures strip: the family line no longer
     * prints `{family.played}` in JSX but says it through a phrase, and the
     * phrase check below names it with the same reason.
     */
    const BARE_EXCEPTIONS: Record<string, string> = {};
    const counts = BARE_COUNT;
    const offenders = FILES.filter((file) =>
      [...file.source.matchAll(counts)].some(
        (match) =>
          !clickable(file.source, match.index) &&
          !inside("GameCount", file.source, match.index) &&
          // The exception this rule already had, for the same reason: an
          // <option> cannot hold a link. A name suggestion says how many games
          // that name has played so you can tell two people apart, and
          // choosing it is what you do with it.
          !inside("option", file.source, match.index),
      ),
    )
      .map((file) => file.path)
      .filter((path) => BARE_EXCEPTIONS[path] === undefined);

    expect(offenders, "render it through GameCount, which links it to those games").toEqual([]);
  });

  it("finds bare counts at all, so the check above is not vacuous", () => {
    // Every count going through GameCount is the goal; a pattern that stopped
    // matching anything would make this rule pass by seeing nothing.
    const counts = BARE_COUNT;
    const seen = FILES.filter((file) => [...file.source.matchAll(counts)].length > 0);
    expect(seen.length, "the pattern still matches the shape it is about").toBeGreaterThan(0);
  });
});

/**
 * A count of games SAID THROUGH A PHRASE, which none of the checks above can see.
 *
 * Every check above reads JSX for a number printed beside the word "games" or
 * "played". Since the site speaks two languages, those words live in PHRASES
 * and the page holds only a key — `say.say("catalogue.playedMany")` — so a
 * count worded "{count} games played" and filled with plain text would pass
 * every one of them while leading nowhere. The games index was the first page
 * to say a count this way, and the gate had to learn to read it before it
 * shipped rather than after.
 *
 * So: every phrase whose English puts a COUNT beside "game", "games" or
 * "played" must be said with a `<GameCount` right after its key — the link
 * filling the placeholder — or be named below with the reason it cannot link.
 * The placeholder is matched by name, because "Every game of {game} played
 * here" puts a game's NAME there, and that sentence is a hover note.
 */
const COUNTED_PHRASE = /\{(?:count|played|games|total)\}\s+(?:games?|played)\b/;

/** How far after a key its link has to be: the call, its values, and the opening of the count. */
const PHRASE_REACH = 600;

const PHRASE_EXCEPTIONS: Record<string, string> = {
  /*
   * The family line on the games index. It counts the matches of every game in
   * a family, and /history filters by ONE game, so no page shows that set — a
   * link would open a different set from the number it sits under. The same
   * reason this file has always given the family line, moved with the line
   * from JSX into a phrase.
   */
  "catalogue.familyPlayedOne": "a family's matches: /history filters by one game, so no page can show the set this counts",
  "catalogue.familyPlayedMany": "a family's matches: /history filters by one game, so no page can show the set this counts",
};

describe("a count of games said through a phrase is still the way into those games", () => {
  const counted = (Object.entries(PHRASES) as [string, string][])
    .filter(([, english]) => COUNTED_PHRASE.test(english))
    .map(([key]) => key);

  it("finds phrases that count games, so the check below is not vacuous", () => {
    expect(counted.length, "no phrase counts games any more — or the pattern stopped seeing them").toBeGreaterThan(0);
    expect(counted.filter((key) => PHRASE_EXCEPTIONS[key] === undefined).length).toBeGreaterThan(0);
  });

  it("says each of them beside the link that fills its count", () => {
    const offenders: string[] = [];
    for (const key of counted) {
      if (PHRASE_EXCEPTIONS[key] !== undefined) continue;
      for (const file of FILES) {
        for (let at = file.source.indexOf(`"${key}"`); at !== -1; at = file.source.indexOf(`"${key}"`, at + 1)) {
          if (!file.source.slice(at, at + PHRASE_REACH).includes("<GameCount")) offenders.push(`${file.path}: ${key}`);
        }
      }
    }
    expect(offenders, "fill the count with <GameCount> — or name the phrase above with why it cannot link").toEqual([]);
  });

  it("names no exception that is not a phrase counting games", () => {
    // An exception left behind after its phrase is reworded is a hole nobody knows is open.
    expect(Object.keys(PHRASE_EXCEPTIONS).filter((key) => !counted.includes(key))).toEqual([]);
  });
});

describe("the components the rules are kept in", () => {
  it("GameName links, and says plainly when a game is not ours", () => {
    const source = readFileSync("src/components/games/GameName.tsx", "utf8");
    /*
     * To the GAME, at /games/<slug>. It was `rulesPath` while the rules page
     * was the front door, and moving this assertion is the point rather than
     * an accommodation: this gate decides where every game's name on the site
     * leads, so it has to name the destination that is actually the front
     * door. A game is one address with its rules underneath it now.
     */
    expect(source).toContain("gamePath");
    // The exception has to look like an exception, or the rule is a lie.
    expect(source).toContain("game-not-here");
  });

  it("nobody writes a second GameName, GameCount or PlayerName of their own", () => {
    /*
     * A COPY OF THE OWNER IS THE ONE WAY PAST EVERY CHECK ABOVE, and it is not
     * a hypothetical: `LegacySource.tsx` had its own `GameName`, twenty lines
     * that did everything the shared one does and linked to `rulesPath`. It was
     * right when the rules page was the front door, and it stopped being right
     * the moment the address move pointed every other name at /games/<slug> —
     * so one page went on sending readers to the old door with nothing failing.
     *
     * Nothing else could have found it. Every check above asks whether a name
     * is inside a link, and a local component that renders a `<Link>` passes
     * them all; the assertions below read `GameName.tsx` and would never open
     * the copy. The rule those assertions enforce — where a game's name leads —
     * is only worth enforcing in one place if there IS only one place.
     */
    const shadows = FILES.filter((file) =>
      [...file.source.matchAll(/\bfunction (GameName|GameCount|PlayerName)\s*\(/g)].some(
        // Its own file is where it is SUPPOSED to be. `OWNERS` already keeps
        // GameName.tsx and GameCount.tsx out of `FILES`; PlayerName.tsx is in
        // them, because it prints names and counts like any other page.
        (match) => !file.path.endsWith(`/${match[1]}.tsx`),
      ),
    ).map((file) => file.path);
    expect(
      shadows,
      "import GameName / GameCount / PlayerName rather than writing another one",
    ).toEqual([]);
  });

  it("GameCount carries the filter that was counted", () => {
    const source = readFileSync("src/components/games/GameCount.tsx", "utf8");
    for (const filter of ["player", "outcome", "pool", "rated", "variant"]) {
      expect(source, `a count must be able to say ${filter}`).toContain(filter);
    }
  });
});
