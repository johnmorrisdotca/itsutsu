import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PHRASES } from "@/lib/i18n/i18n.constants";

// What a comment is, where a game is named, and what a control is: shared with gamePictures.coverage.test.ts.
import { PAIRED_NAME, code, inside, insideControl, isGameName, namesPrinted } from "./sourceScan";

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

/**
 * The components every other file goes through, and nothing else: a game's
 * name, a count of games, a record — and a puzzle's time, a member's points at
 * a puzzle and an IP figure, which print their number in a plain branch too,
 * for the one honest exception each of them owns.
 */
const OWNERS = new Set(["GameName.tsx", "GameCount.tsx", "PlayerRecord.tsx", "SolveTime.tsx", "SolvePoints.tsx", "IpFigure.tsx"]);

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(path));
    else if (entry.name.endsWith(".tsx") && !OWNERS.has(entry.name)) out.push(path);
  }
  return out;
}

const FILES = ROOTS.flatMap(filesUnder).map((path) => ({
  path,
  source: code(readFileSync(path, "utf8")),
}));

function clickable(source: string, at: number): boolean {
  return inside("Link", source, at) || inside("a ", source, at);
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
     * The About page's two counts of the catalogue, and they are the same
     * fact as GameList's: how many rule sets this site has, read from the
     * catalogue rather than typed, which is what `about.coverage.test.ts`
     * exists to force. There is no set of played games behind either number,
     * and both sentences link to /games, which is the whole catalogue —
     * every game the number counted, which is the promise this rule is about.
     */
    "src/app/about/about.games.tsx": "counts rule sets, not matches",
    "src/app/about/about.more.tsx": "counts rule sets, not matches",
    // Getting started and the catalogue's charts count games and families the
    // same way, and link to /games, the whole catalogue those counts were read from.
    "src/app/about/about.start.tsx": "counts rule sets, not matches",
    "src/app/about/about.charts.tsx": "counts rule sets, not matches",
    // "a match of two, four or six games": the sizes a paired match may be set up at, read from MATCH_SIZES.
    "src/app/about/about.play.tsx": "names the sizes a paired match allows, not games played",
    /*
     * The measured round robin on the About page, for exactly the reason
     * `LadderStrength.tsx` below carries: those games were played in memory,
     * on somebody's own CPU, and no row was written anywhere — deliberately,
     * because driving them through the site would be thousands of paid
     * function calls to learn what a laptop settles for nothing. "Twenty
     * games a pairing" counts games that cannot be opened, so a link would
     * be a promise this site is unable to keep. Both say where the figures
     * came from instead.
     */
    "src/components/about/MeasuredGrades.tsx": "played in memory, kept nowhere",
    "src/app/about/about.bots.tsx": "played in memory, kept nowhere",
    // The graph beside that table, drawn from the same round robin.
    "src/components/about/GradeLadderGraph.tsx": "played in memory, kept nowhere",
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
     * The measured ladder, and it is the "counted elsewhere" exception with
     * the elsewhere being MEMORY. `ladder.match.test.ts` plays the grades
     * against each other in process, on somebody's own CPU, and writes no row
     * anywhere — that is the whole point of it, and AGENTS.md says why: the
     * same games driven through the site would be thousands of paid function
     * calls to learn what a laptop settles for nothing. So "20 games a
     * pairing" counts games that were never kept and cannot be opened, and a
     * link would be a promise this site is unable to keep. The panel says
     * where the number came from instead.
     */
    "src/components/players/LadderStrength.tsx": "played in memory, kept nowhere",
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

/**
 * A PUZZLE'S TIME IS THE WAY INTO THAT SOLVE, AND A SCORE IS THE WAY INTO WHAT
 * IT WAS MADE OF.
 *
 * John, 2026-09-26, on a puzzle's standings — a points leaderboard, and the
 * fastest times such as "5x5 easy 2:41 John M.": "No way to view played
 * games.. clicking a name takes us to profile and no links to the Game Played
 * History viewer." Every time on that page was printed as plain text, and so
 * was every points figure, on a page whose whole subject is those numbers. The
 * checks above could not see it: a time is not a count of games, and a sum of
 * points is neither a record nor a table of them.
 *
 * So, the same rule in its own terms:
 *
 *  - A time printed with `clockText(` is inside a link, or goes through
 *    `SolveTime`, which opens that solve.
 *  - A points or IP figure — `{x.points}`, `{x.ip}`, or `thousands(` of one —
 *    is inside a link, or goes through `SolvePoints` (a member's points at a
 *    puzzle, to the solves they were made of) or `IpFigure` (IP, to the games
 *    it was won in).
 *
 * Or the file is named below, with the reason a link there would lead nowhere
 * new. Attribute positions (`data-ip={row.ip}`) are not figures on the page.
 */
const PUZZLE_TIME = /clockText\(/g;

const POINTS_FIGURE =
  /(.)\{\s*\+?\s*[A-Za-z_$][\w$?.]*\.(?:points|ip)(?:\.toLocaleString\([^)]*\))?\s*\}|(.)thousands\(\s*[A-Za-z_$][\w$?.]*\.(?:points|ip)\s*\)/g;

const TIME_EXCEPTIONS: Record<string, string> = {
  // The puzzle being played: its running clock and the line that says it is solved. The solve IS the page.
  "src/components/puzzles/solveShared.tsx": "the clock of the puzzle in front of the reader, and its own finishing line",
  // One finished puzzle's own page: its time is a fact about the page the reader is on.
  "src/components/puzzles/PuzzleSolvePage.tsx": "the solve's own page: a link would lead where the reader already is",
  // A race's page saying how each seat finished it: the race is the page, and each seat's solve is on its solver's list.
  "src/components/puzzles/PuzzleRacePage.tsx": "the race's own page, telling its own seats' times",
  // Time spent so far on a puzzle not finished: there is no solve yet to open, and the row resumes the puzzle.
  "src/components/mine/MyPuzzleRuns.tsx": "time so far on an unfinished puzzle: nothing finished to open",
  // The whole row is the link to this solve (a stretched card link), so its time already leads there.
  "src/components/mine/MyPuzzleSolves.tsx": "the row itself opens this solve, time and all",
};

const POINTS_EXCEPTIONS: Record<string, string> = {
  // The whole row is the link to this solve (a stretched card link), so its score already leads there.
  "src/components/mine/MyPuzzleSolves.tsx": "the row itself opens this solve, points and all",
  // A member's points at the top of the record narrowed to them: the sum of the page the reader is on, its rows marked.
  "src/components/puzzles/PuzzleRecordPage.tsx": "the sum of the page the reader is on, its counted rows marked",
  // An XP award in the reader's own ledger of XP: experience, not a score of games or solves, and the row is the award.
  "src/components/mine/MyXp.tsx": "an XP award in the XP ledger itself, not a score of games",
};

function figuresIn(source: string, pattern: RegExp): number[] {
  return [...source.matchAll(pattern)]
    // An attribute (`data-ip={row.ip}`) and a template string's `${…}` are not figures on the page.
    .filter((match) => !["=", "$"].includes(match[1] ?? match[2] ?? ""))
    // Past the one character a pattern captures before the figure, when it captures one.
    .map((match) => match.index + (match[1] ?? match[2] ?? "").length);
}

describe("a puzzle's time and a score lead to what they were made of", () => {
  it("nobody prints a puzzle's time with nothing behind it", () => {
    const offenders = FILES.filter((file) =>
      figuresIn(file.source, PUZZLE_TIME).some((at) => !clickable(file.source, at)),
    )
      .map((file) => file.path)
      .filter((path) => TIME_EXCEPTIONS[path] === undefined);
    expect(offenders, "print a solve's time through SolveTime, which opens that solve — or name the file above with why it cannot").toEqual([]);
  });

  it("nobody prints a points or IP figure with nothing behind it", () => {
    const offenders = FILES.filter((file) =>
      figuresIn(file.source, POINTS_FIGURE).some((at) => !clickable(file.source, at)),
    )
      .map((file) => file.path)
      .filter((path) => POINTS_EXCEPTIONS[path] === undefined);
    expect(offenders, "print it through SolvePoints or IpFigure, which lead to what it was made of — or name the file above with why it cannot").toEqual([]);
  });

  it("still finds times and figures to check, so a passing run means something", () => {
    // If the patterns stop matching, every file is compliant at once.
    expect(FILES.filter((file) => figuresIn(file.source, PUZZLE_TIME).length > 0).length).toBeGreaterThan(2);
    expect(FILES.filter((file) => figuresIn(file.source, POINTS_FIGURE).length > 0).length).toBeGreaterThan(2);
  });

  it("the boards that print times and scores print them through the components that link them", () => {
    // The page John was on, and the panels of it every puzzle's front door draws.
    const read = (path: string) => readFileSync(path, "utf8");
    expect(read("src/components/puzzles/PuzzleFastest.tsx")).toContain("<SolveTime");
    // Gomoji's table (every puzzle's): a solve's own points open that solve, and so does its Replay.
    expect(read("src/components/puzzles/PuzzleFastest.tsx")).toContain("<OneSolvePoints");
    expect(read("src/components/puzzles/PuzzleFastest.tsx")).toContain("puzzle-fastest-replay");
    expect(read("src/components/puzzles/RecordSolvesTable.tsx")).toContain("<OneSolvePoints");
    expect(read("src/components/puzzles/PuzzlePoints.tsx")).toContain("<SolvePoints");
    expect(read("src/components/points/IpBoard.tsx")).toContain("<IpFigure");
    expect(read("src/components/feed/FeedNewsLine.tsx")).toContain("<SolveTime");
  });

  it("every exception is a file that still exists", () => {
    const known = new Set(FILES.map((file) => file.path));
    expect([...Object.keys(TIME_EXCEPTIONS), ...Object.keys(POINTS_EXCEPTIONS)].filter((path) => !known.has(path))).toEqual([]);
  });

  it("SolveTime opens the solve, SolvePoints the member's solves, and IpFigure the games that paid", () => {
    const time = readFileSync("src/components/puzzles/SolveTime.tsx", "utf8");
    expect(time).toContain("solvePath(");
    expect(time).toContain("mySolvePath(");
    const points = readFileSync("src/components/puzzles/SolvePoints.tsx", "utf8");
    expect(points).toMatch(/puzzleRecordHref\(kind, \{ member: memberId, month \}\)/);
    expect(points).toContain("mySolvePath(kind, solveId) : solvePath(kind, solveId)");
    const ip = readFileSync("src/components/points/IpFigure.tsx", "utf8");
    expect(ip).toContain('ip: "paid"');
    expect(ip).toContain("puzzleRecordHref(");
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
      [...file.source.matchAll(/\bfunction (GameName|GameCount|PlayerName|SolveTime|SolvePoints|IpFigure)\s*\(/g)].some(
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
