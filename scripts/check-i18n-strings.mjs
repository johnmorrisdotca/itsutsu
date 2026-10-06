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
  // ENJA-06, set-up screen, game screen and every ending
  { path: "src/lib/history", ticket: "ENJA-13" },
  /*
   * ENJA-07, puzzles. What is left of them is two kinds of file, named one by one now that the folders are done.
   *
   * The puzzle screens whose files the pictures' stamp hashes (`puzzleArtFingerprint.ts`): a puzzle board, table
   * or grid keeps a few English labels (a column, a stock, a foundation, a cage, a peg) that a translation must
   * not edit, since any edit makes every puzzle picture stale until `pnpm screenshots:puzzles` is run. They come
   * off the list in the change that re-takes the pictures.
   */
  // ENJA-10, pages: home, About, Learn, players, history, My account, feed, inbox, join
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
  /*
   * ENJA-13 also takes the puzzles' refusals: the reason a check gives for an answer it will not take, which
   * the route sends back as the body of the error (`puzzleCheck.ts` and each puzzle's `check.ts`), and the
   * races' (`puzzleRaces.ts`). A member reads them in a message the page shows; they are the API's words.
   */
  { path: "src/lib/puzzles/puzzleCheck.ts", ticket: "ENJA-13" },
  { path: "src/lib/puzzles/bridges/check.ts", ticket: "ENJA-13" },
  { path: "src/lib/puzzles/koushi/check.ts", ticket: "ENJA-13" },
  { path: "src/lib/puzzles/cube/check.ts", ticket: "ENJA-13" },
  { path: "src/lib/puzzles/freecell/check.ts", ticket: "ENJA-13" },
  { path: "src/lib/puzzles/solitaire/check.ts", ticket: "ENJA-13" },
  { path: "src/lib/puzzles/spider/check.ts", ticket: "ENJA-13" },
  { path: "src/lib/puzzles/meikyuu/check.ts", ticket: "ENJA-13" },
  { path: "src/lib/puzzles/pictureLogic/check.ts", ticket: "ENJA-13" },
  { path: "src/lib/puzzles/tobiishi/check.ts", ticket: "ENJA-13" },
  { path: "src/lib/puzzles/tsunagi/check.ts", ticket: "ENJA-13" },
  { path: "src/lib/puzzles/suido/check.ts", ticket: "ENJA-13" },
  { path: "src/lib/puzzles/pencil/akari.ts", ticket: "ENJA-13" },
  { path: "src/lib/puzzles/pencil/crossSums.ts", ticket: "ENJA-13" },
  { path: "src/lib/puzzles/pencil/hitori.ts", ticket: "ENJA-13" },
  { path: "src/lib/puzzles/pencil/loop.ts", ticket: "ENJA-13" },
  { path: "src/lib/puzzles/pencil/regions.ts", ticket: "ENJA-13" },
  { path: "src/lib/puzzles/pencil/shikaku.ts", ticket: "ENJA-13" },
  { path: "src/lib/puzzles/jirai/board.ts", ticket: "ENJA-13" },
  { path: "src/lib/puzzles/server/puzzleRaceChecks.ts", ticket: "ENJA-13" },
  { path: "src/lib/puzzles/server/puzzleRaces.ts", ticket: "ENJA-13" },
  /*
   * ENJA-13 also takes the party tables' refusals: the reason the site gives for a seat it will not offer, a move
   * it will not take or a table it will not open, which a route sends back as the body of the error and a page
   * shows in a message (`keptReport.ts`, `onlineSeats.ts`, `online.constants.ts`'s two notices for a table that has since been retired, and the three server files that apply them). They are the
   * API's words, as the puzzles' are; everything a party or card table says on its own screens is done (ENJA-08).
   */
  { path: "src/lib/party/kept/keptReport.ts", ticket: "ENJA-13" },
  { path: "src/lib/party/online/onlineSeats.ts", ticket: "ENJA-13" },
  { path: "src/lib/party/online/online.constants.ts", ticket: "ENJA-13" },
  { path: "src/lib/party/online/server/tableCreate.ts", ticket: "ENJA-13" },
  { path: "src/lib/party/online/server/tableMove.ts", ticket: "ENJA-13" },
  { path: "src/lib/party/online/server/tableSeating.ts", ticket: "ENJA-13" },
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
  ["src/components/auth/MemberRemoveModal.tsx", "the operator's window for removing a member, opened from the Admin members panel"],
  ["src/components/auth/MemberWordsModal.tsx", "the operator's window for giving a member their invitation words, opened from the Admin members panel"],
  ["src/components/auth/MemberAgeControl.tsx", "the operator's control for recording a member's age band, opened from the Admin members panel"],
  ["src/components/auth/MemberClaimModal.tsx", "the operator's window for claiming a kept record for a member, opened from the Admin members panel"],
  ["src/components/reports/ReportActions.tsx", "the operator's buttons on a reported problem"],
  ["src/lib/reports/reportsOperator.actions.ts", "the operator's handling of what members reported: the Admin page's own words, read by one person"],
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
  ["src/lib/clock/clockNames.constants.ts", "the preset clocks' names, each an English label beside its own kanji (無制限, 早碁, 速碁, 持ち時間) that a Japanese reader is shown instead (Speaker.pairName); each description is a phrase"],
  ["src/lib/rating/ratingNames.constants.ts", "the rating tiers' and pools' names, each an English label beside its own kanji (未定, 仮, 確定, 対人, 対コンピュータ, 総合) that a Japanese reader is shown instead (Speaker.pairName); each note is a phrase"],
  ["src/lib/rating/directory.sort.ts", "a sort spec's column labels and the name of the thing sorted, which `paging.ts` only checks are not empty and a sort button's English aria text reads; the visible headings are the table's own"],
  ["src/lib/rating/ladder.sort.ts", "a sort spec's column labels and the name of the thing sorted, as directory.sort.ts, and a note to the developer on why a column has no index"],
  ["src/lib/history/gameHistory.sort.ts", "a sort spec's column labels and the name of the thing sorted, as directory.sort.ts, and a note to the developer on why a column has no index"],
  ["src/lib/history/myFinished.sort.ts", "a sort spec's column label and the name of the thing sorted, as directory.sort.ts"],
  ["src/lib/gomoku/gomoku.constants.ts", "the colours', first moves', obstacle layouts', board sizes' and draw limits' names, each an English label beside its own kanji (黒, 黒先, 平盤, 十五路…) that a Japanese reader is shown instead (Speaker.pairName); what each does is a phrase"],
  ["src/lib/gomoku/advantage.constants.ts", "the advantage panel's names, each an English label beside its own kanji (石数, 互角, 必勝…) that a Japanese reader is shown instead (Speaker.pairName); every explanation is a phrase"],
  ["src/lib/gomoku/headStartNames.constants.ts", "a head start's names, each an English label beside its own kanji (先手, 置き石, 駒落ち) that a Japanese reader is shown instead (Speaker.pairName); every description, source and count is a phrase"],
  ["src/lib/gomoku/catalogueViewNames.constants.ts", "the catalogue's three views' names, each an English label beside its own kanji (系統, 一覧, 全種目) that a Japanese reader is shown instead (Speaker.pairName)"],
  ["src/lib/gomoku/analysis.constants.ts", "the English half of the threat reading's words; the Japanese is analysis.ja.constants.ts, read through analysisCopy.ts. The measured ladder's fingerprint hashes this file (ladderFingerprint.ts), so it is never edited to translate it"],
  ["src/lib/record/sgf.ts", "the text written INTO a downloaded SGF file: the format's own property values (Draw, Void) and the comments other programs read, in English like the format; the button that offers it is a phrase (record.downloadSgf)"],
  ["src/lib/record/sgf.constants.ts", "the SGF format's game-type names (Go, Othello, Hex, Freestyle, Standard, Renju…) and the developer's notes on why a game has no SGF number, never drawn on a page; the rules comment is written into the file in English like the format"],
  ["src/lib/record/pdn.ts", "the text written INTO a downloaded PDN file: the format's own tag names (Event, Site, Date, White, Black, Result, GameType) and the comment other programs read, in English like the format; the button that offers it is a phrase (record.downloadPdn)"],
  ["src/lib/history/gameHistory.constants.ts", "the finished game's results', outcomes' and verdicts' names, each an English label beside its own kanji (黒勝, 勝, 会心…) that a Japanese reader is shown instead (Speaker.pairName); the filters' words are phrases"],
  ["src/lib/history/retentionNames.constants.ts", "how long a finished game stays on a list: each an English label beside its own kanji (無期限, 一週間…) that a Japanese reader is shown instead (Speaker.pairName)"],
  ["src/components/history/resultNames.constants.ts", "the result card's headlines, each an English label beside its own kanji (勝ち, 負け, 引き分け) that a Japanese reader is shown instead (Speaker.pairName)"],
  ["src/lib/history/forfeitRows.ts", "the operator's repair tool for a game row written by a timeout: the reasons it gives for refusing a row are printed by its runner to whoever runs it, never drawn on a page"],
  ["src/components/board/Board.constants.ts", "the boards' paint: CSS gradients, class lists and sizes; the name of each surface, felt, stone set and view is a phrase (boardNames.ts)"],
  ["src/components/board/boardPaint.ts", "CSS for a swatch of a board's surface, never read as words"],
  ["src/components/board/boardWidth.constants.ts", "a note for the developer that the page-width gate reads off the element (`data-width-reason`); never drawn on a page"],
  ["src/components/games/cardKinds.constants.ts", "what a game can be won by, each an English label beside its own kanji (三目, 四目, 五目, 反転, 詰…) that a Japanese reader is shown instead (Paired)"],
  ["src/components/games/familyMarks.constants.ts", "the families' names as the keys that pick each family's picture (FamilyMark family=\"Pencil puzzles\"): names that are looked up, not words drawn; a family's Japanese name is its kanji"],
  ["src/lib/famous/famousGames.data.ts", "the names of players, events and places exactly as the sources record them, and the games' moves: a record, not the site's own sentences"],
  /*
   * THE PUZZLES' ENGLISH HALVES, as the games' above: each puzzle's words are a table of English beside a Japanese
   * overlay of the same shape (`copyTable.ts`) under src/lib/i18n/dictionaries/puzzles.ja.*.constants.ts. Where a
   * table sits in a file the pictures' stamp hashes (`puzzleArtFingerprint.ts`) its Japanese is laid over it from a
   * sibling (`cardWords.ts`, `mazeWords.ts`, `gridWords.ts`, `puzzleCopy.ts`). Held by
   * `puzzleCopyTables.coverage.test.ts` and `puzzles.coverage.test.ts` ("has Japanese copy"), which fail for a
   * sentence with no Japanese beside it or a Japanese line that answers nothing.
   */
  ["src/lib/puzzles/puzzles.constants.ts", "the English half of every puzzle's words (tagline, origin, rules, levels, clocks, sizes); the Japanese is puzzles.ja.*.constants.ts, held by puzzles.coverage.test.ts and puzzleCopyTables.coverage.test.ts"],
  ["src/lib/puzzles/pencil/pencil.constants.ts", "the English half of the pencil puzzles' lines under the board; the Japanese is puzzles.ja.pencil.constants.ts, held by puzzleCopyTables.coverage.test.ts"],
  ["src/lib/puzzles/jirai/jirai.constants.ts", "the English half of Jirai's levels, neighbours and size names; the Japanese is puzzles.ja.levels.constants.ts, held by puzzleCopyTables.coverage.test.ts"],
  ["src/lib/puzzles/meikyuu/look.constants.ts", "the English half of Meikyuu's colour chooser, with each colour's name beside its own kanji, which a Japanese reader is shown instead (Speaker.pairName); the Japanese is puzzles.ja.misc.constants.ts, held by puzzleCopyTables.coverage.test.ts"],
  ["src/lib/puzzles/kumimoji/wallpaper.constants.ts", "the English half of Kumimoji's wallpaper words; the Japanese is puzzles.ja.misc.constants.ts, held by puzzleCopyTables.coverage.test.ts"],
  ["src/lib/puzzles/kumimoji/shots.constants.ts", "the English half of the captions of Kumimoji's pictures; the Japanese is puzzles.ja.misc.constants.ts, held by puzzleCopyTables.coverage.test.ts"],
  ["src/lib/puzzles/gomoji/wordStyles.ts", "the English half of the three ways a Gomoji grid is drawn, a name and a sentence each; the Japanese is puzzles.ja.misc.constants.ts, held by puzzleCopyTables.coverage.test.ts"],
  ["src/lib/puzzles/server/puzzleRecord.ts", "a SQL fragment the database runs, not language"],
  ["src/components/puzzles/meikyuu.constants.ts", "the English half of Meikyuu's screen; the Japanese is puzzles.ja.meikyuuUi.constants.ts, laid over it by mazeWords.ts and held by screenWords.coverage.test.ts"],
  ["src/components/puzzles/suido.constants.ts", "the English half of Suido's screen; the Japanese is puzzles.ja.mazeUi.constants.ts, held by screenWords.coverage.test.ts"],
  ["src/components/puzzles/tobiishi.constants.ts", "the English half of Tobiishi's screen; the Japanese is puzzles.ja.mazeUi.constants.ts, held by screenWords.coverage.test.ts"],
  ["src/components/puzzles/cube.constants.ts", "the English half of the Cube's screen; the Japanese is puzzles.ja.mazeUi.constants.ts, held by screenWords.coverage.test.ts"],
  ["src/components/puzzles/jirai.constants.ts", "the English half of Jirai's lines under the board; the Japanese is puzzles.ja.grid.constants.ts, held by puzzleCopyTables.coverage.test.ts"],
  ["src/components/puzzles/pencil/pencil.constants.ts", "the English half of the pencil puzzles' lines under the board; the Japanese is puzzles.ja.grid.constants.ts, held by puzzleCopyTables.coverage.test.ts"],
  ["src/components/puzzles/solitaireOptions.constants.ts", "the English half of Solitaire's set-up choices; the Japanese is puzzles.ja.cards.constants.ts, held by screenWords.coverage.test.ts"],
  ["src/components/puzzles/puzzles.constants.ts", "class lists and the English half of the Tsunagi chips and the grid and card tables' lines; the Japanese is laid over it from puzzles.ja.*.constants.ts by mazeWords.ts, gridWords.ts and cardWords.ts. The pictures' stamp hashes this file, so it is never edited to translate it"],
  ["src/components/puzzles/mahjong.constants.ts", "the English half of Mahjong Solitaire's lines under the board; the Japanese is puzzles.ja.cards.constants.ts, laid over it by cardWords.ts. The pictures' stamp hashes this file, so it is never edited to translate it"],
  ["src/components/puzzles/kumimoji.constants.ts", "Tailwind class lists the scanner reads as words; no sentence is in it. The pictures' stamp hashes this file"],
  ["src/components/puzzles/paint.constants.ts", "CSS gradients, selectors and a developer's width reason, which read as words to the scanner; never drawn as text"],
  ["src/lib/houseki/housekiCopy.ts", "the five Houseki games' English names (Falling Triplets, Colour Chains, Stone Collapse, Gem Swap, Magnetic Blocks), each beside its own kanji (HOUSEKI_KANJI) that a Japanese reader is shown instead (Speaker.pairName); every sentence about a game is a phrase"],
  /*
   * THE PARTY, CARD AND CASUAL GAMES' ENGLISH HALVES (ENJA-08), as the games' and the puzzles' above: each is a table of English
   * beside a Japanese overlay of the same shape (`copyTable.ts`, read through `partyTable`) under src/lib/i18n/dictionaries/party.ja.*.
   */
  ["src/components/casual/casual.constants.ts", "the English half of the casual games' own screens' words (`CASUAL_COPY`); the Japanese is the `casual` overlay in party.ja.tables.constants.ts, read through casualWords.ts and held by partyCopyTables.coverage.test.ts"],
  ["src/lib/casual/casual.constants.ts", "the English half of the eight casual games' copy (`CASUAL_DISPLAY`: name, tagline, origin, rules, board advice); the Japanese is party.ja.casual.constants.ts, read through casualCopy (partyCopy.ts) and held by partyCopyJa.coverage.test.ts"],
  ["src/components/party/cards/cardTable.constants.ts", "the English half of the card tables' own screens' words (`CARD_TABLE_COPY`); the Japanese is the `cardTable` overlay in party.ja.screens.constants.ts, read through cardTableWords (partyWords.ts) and held by partyCopyTables.coverage.test.ts"],
  ["src/components/party/diceWar/diceWar.constants.ts", "the English half of Dice War's screen words (`DICE_WAR_COPY`); the Japanese is the `diceWar` overlay in party.ja.tables.constants.ts, held by partyCopyTables.coverage.test.ts"],
  ["src/components/party/gunjin/gunjin.constants.ts", "the English half of Gunjin's screen words (`GUNJIN_COPY`, its sides and placing rules); the Japanese is the `gunjin`, `gunjinSides` and `gunjinPlacing` overlays in party.ja.tables.constants.ts, held by partyCopyTables.coverage.test.ts"],
  ["src/components/party/hitotsu/hitotsu.constants.ts", "the English half of Hitotsu's screen words and house rules (`HITOTSU_COPY`, `HITOTSU_HOUSE_COPY`); the Japanese is the `hitotsu` and `hitotsuHouse` overlays in party.ja.tables.constants.ts, held by partyCopyTables.coverage.test.ts"],
  ["src/components/party/kept.constants.ts", "the English half of the kept-game pages' words (`KEPT_COPY`); the Japanese is the `kept` overlay in party.ja.screens.constants.ts, held by partyCopyTables.coverage.test.ts"],
  ["src/components/party/online/online.constants.ts", "the English half of the online tables' words (`ONLINE_COPY`); the Japanese is the `online` overlay in party.ja.screens.constants.ts, held by partyCopyTables.coverage.test.ts"],
  ["src/components/party/pachisi/pachisi.constants.ts", "the English half of Pachisi's screen words (`PACHISI_COPY`); the Japanese is the `pachisi` overlay in party.ja.tables.constants.ts, held by partyCopyTables.coverage.test.ts"],
  ["src/components/party/pairGo.constants.ts", "the English half of Pair Go's screen words (`PAIR_GO_COPY`); the Japanese is the `pairGo` overlay in party.ja.screens.constants.ts, held by partyCopyTables.coverage.test.ts"],
  ["src/components/party/party.constants.ts", "the English half of the party tables' shared screen words and of Dots and Boxes, Superghost, Mancala and Mexican Train (`PARTY_COPY`, `DOTS_COPY`, `GHOST_COPY`, `MANCALA_COPY`, `TRAIN_COPY`, the marbles); the Japanese is the matching overlays in party.ja.screens.constants.ts, held by partyCopyTables.coverage.test.ts. The party pictures' fingerprint hashes this file (partyArtFingerprint.ts), so it is never edited to translate it"],
  ["src/components/cards/Cards.constants.ts", "the English half of the card backs' names (`CARD_BACK_WORDS`), read through cardBackWords (partyWords.ts); the Japanese is the `cardBacks` overlay in party.ja.tables.constants.ts, held by partyCopyTables.coverage.test.ts. The puzzle and party pictures' fingerprints hash this file (puzzleArtFingerprint.ts, partyArtFingerprint.ts), so it is never edited to translate it"],
  ["src/components/party/partyBlocks.constants.ts", "the English half of Block Five for four's screen words (`PARTY_BLOCKS_COPY`); the Japanese is the `blocks` overlay in party.ja.screens.constants.ts, held by partyCopyTables.coverage.test.ts"],
  ["src/components/party/sugoroku/sugoroku.constants.ts", "the English half of the backgammon games' screen words (`SUGOROKU_COPY`); the Japanese is the `sugoroku` overlay in party.ja.tables.constants.ts, held by partyCopyTables.coverage.test.ts"],
  ["src/components/party/tenka/tenka.constants.ts", "the English half of Tenka's screen words and region names (`TENKA_COPY`, `TENKA_REGION_NAMES`, the neutral army's marble); the Japanese is the `tenka`, `tenkaRegions` and `tenkaNeutral` overlays in party.ja.tables.constants.ts, held by partyCopyTables.coverage.test.ts; territory and continent names are the package's own (tenkaWords.ts). The party pictures' fingerprint hashes this file (partyArtFingerprint.ts), so it is never edited to translate it"],
  ["src/components/party/yacht/yacht.constants.ts", "the English half of Yacht's screen words and score boxes (`YACHT_COPY`, `YACHT_BOX_WORDS`); the Japanese is the `yacht` and `yachtBoxes` overlays in party.ja.tables.constants.ts, held by partyCopyTables.coverage.test.ts"],
  ["src/lib/cardGames/cardGames.copy.ts", "the English half of the eleven card games' copy (name, tagline, origin, rules, board advice); the Japanese is party.ja.cards.constants.ts, read through partyCopy.ts and held by partyCopyJa.coverage.test.ts"],
  ["src/lib/party/gunjin/gunjin.constants.ts", "the English half of Gunjin's boards' names and notes (`GUNJIN_BOARDS`); the Japanese is the `gunjinBoards` overlay in party.ja.tables.constants.ts, held by partyCopyTables.coverage.test.ts"],
  ["src/lib/party/gunjin/gunjin.copy.ts", "the English half of Gunjin's copy (name, tagline, origin, rules, board advice); the Japanese is party.ja.games.constants.ts, read through partyCopy.ts and held by partyCopyJa.coverage.test.ts"],
  ["src/lib/party/gunjin/gunjinFlag.ts", "the two seat names ('Ann', 'Ben') of the game the browser specs set up by hand (`flagWithinReach`), never drawn as the site's words"],
  ["src/lib/party/hitotsu/hitotsu.copy.ts", "the English half of Hitotsu's copy (name, tagline, origin, rules, board advice); the Japanese is party.ja.games.constants.ts, read through partyCopy.ts and held by partyCopyJa.coverage.test.ts"],
  ["src/lib/party/mancala/mancala.constants.ts", "the names of Mancala's two rule sets, Kalah and Oware, which a reader of Japanese is shown in the same letters as the rules page writes them (a decision John is asked to review: katakana for both)"],
  ["src/lib/party/party.constants.ts", "the English half of the party games' copy (name, tagline, origin, rules, board advice) for Dots and Boxes, Superghost, Mancala, Tenka, Mexican Train, Yacht, Pachisi, Dice War and the race games; the Japanese is party.ja.games.constants.ts, read through partyCopy.ts and held by partyCopyJa.coverage.test.ts"],
  ["src/lib/party/partyTableWords.ts", "the English half of what every party game says of its table on its rules page (how a turn is made, the house rules, what the table has settled); the Japanese is party.ja.tableWords*.constants.ts, laid over it by partyRulesPage and held by partyCopyTables.coverage.test.ts"],
  ["src/lib/party/sugoroku/sugoroku.constants.ts", "the English half of the backgammon games' strength names and lines (`SUGOROKU_STRENGTH_NAMES`, `SUGOROKU_STRENGTH_LINES`); the Japanese is the `sugorokuStrengthNames` and `sugorokuStrengthLines` overlays in party.ja.tables.constants.ts, held by partyCopyTables.coverage.test.ts"],
  ["src/lib/party/sugoroku/sugoroku.copy.ts", "the English half of the seven backgammon games' copy; the Japanese is party.ja.sugoroku.constants.ts, read through partyCopy.ts and held by partyCopyJa.coverage.test.ts"],
  ["src/lib/party/sugoroku/sugorokuRulesPage.ts", "the English half of what the seven backgammon games say of their table on a rules page; the Japanese is `PARTY_TABLE_WORDS_JA_SUGOROKU` in party.ja.tableWordsCards.constants.ts, laid over it by partyRulesPage and held by partyCopyTables.coverage.test.ts"],
  ["src/components/ui/ui.constants.ts", "Tailwind class lists the scanner reads as words (`disabled:cursor-not-allowed`), and the developer's width reason that the page-width gate reads off an element; no sentence a member reads"],
  ["src/lib/famous/famous.constants.ts", "the source's own quoted terms that allow a famous game to be shown (`openBecause`), kept in the code so the reason is beside it and never drawn on a page; the credit's words are phrases (`chrome.famous.*`)"],
  ["src/lib/reports/reports.constants.ts", "the status labels an operator reads on the Admin page and the name a report from the operator is filed under; no member reads them (the member's window is `reports.*` phrases)"],
  ["src/lib/auth/inviteMember.ts", "the placeholder name (\"Guest\" and four characters) written onto a member's row until they choose one: a stored name, which is data and the same for every reader"],
  ["src/lib/auth/removeMember.ts", "the log line of what removing a member did (counts and the choice about names, never a name), written to the operator's own log"],
  ["src/lib/auth/zoneGuess.ts", "refusals of a request the site's own pages never make wrongly (a device writing a time zone it has not got); a developer reads them in the response, no member is shown them"],
  ["src/lib/learn/origins.ts", "the fourteen countries a game comes from, named the way a sentence names them in English (the United States, England) beside their Japanese names: data, not sentences"],
  ["src/lib/social/countryZones.constants.ts", "IANA time zone identifiers (Europe/Isle_of_Man), which read as words to the scanner: names of zones, not sentences"],
  ["src/lib/preferences/preferences.ts", "refusals of a preferences request the site's own forms never make wrongly (an unknown name or value); a developer reads them in the response, no member is shown them"],
  ["src/lib/site/site.constants.ts", "the Admin page's site panel: its groups, settings, blurbs and confirmations, read by the operator alone"],
  ["src/lib/site/site.ts", "refusals of a site setting the operator's panel sends wrongly, read by the operator alone"],
  ["src/lib/site/siteSettingsCopy.ts", "what the operator's copy-the-settings tool prints, to whoever runs it"],
  ["src/lib/site/siteSettingsWire.ts", "an HTTP header (Bearer) for the client of the Sumilabu settings service: code, not language"],
  ["src/lib/site/gameEmails.ts", "the Admin page's notes on why game emails cannot be switched on here, read by the operator alone"],
  ["src/lib/site/maintenance.ts", "the shutter page, served by the gate before anything can read the reader's language, which therefore says the same in English and in Japanese; and the refusal an API client is sent"],
  ["src/components/players/players.constants.ts", "Tailwind class lists the scanner reads as words; no sentence is in it (the table's own words are `players.*` phrases)"],
  ["src/components/players/WhoFilter.tsx", "the three kinds of player a list can be narrowed to, each an English label beside its own kanji (人, コンピュータ, 全員) that a Japanese reader is shown instead (Paired)"],
  ["src/app/me/me.tabs.ts", "the My account page's tabs, each an English label beside its own kanji (戦績, 経験, 自己紹介, 合言葉, 設定, 人) that a Japanese reader is shown instead (Tabs)"],
  ["src/app/about/about.chapters.ts", "the About page's tabs, each an English label beside its own kanji (由来, 入門, 対局, 種目, 来歴, 和, 番付, 棋士) that a Japanese reader is shown instead (Tabs)"],
  ["src/app/about/about.names.constants.ts", "Romanised readings of Japanese words and the made-up players of an example ladder: names, the same whoever is reading, not sentences"],
  ["src/app/players/players.tabs.ts", "the Players page's tabs, each an English label beside its own kanji (会員, 仲間, 番付, 名人, コンピュータ, 偲ぶ) that a Japanese reader is shown instead (Tabs)"],
  ["src/lib/ui/keyNames.constants.ts", "the names `KeyboardEvent.key` reports for Enter, Delete and Space, compared and never drawn"],
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
  ["src/lib/xp/xpAwardCopy.constants.ts", "what every XP award is called and why, in English, a `Record<XpEventType, …>`; its Japanese is in xpAwardCopy.ja.constants.ts; held complete by xp.coverage.test.ts"],
  ["src/lib/xp/xpAwardCopy.ja.constants.ts", "what every XP award is for and what its notice says in Japanese, whose `back` field is English reading the Japanese back for the review sheet; held complete by xp.coverage.test.ts"],
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
  ["Esc", "the name of the Escape key as it is printed on a keyboard, beside the button it presses (BoardFocus, BareBoard): a key's name, the same in every language"],
  ["Enter", "the name `KeyboardEvent.key` reports for the Enter key, compared and never drawn"],
  ["Escape", "the name `KeyboardEvent.key` reports for the Escape key, compared and never drawn"],
  ["Arrow(?:Left|Right|Up|Down)|Home|End", "the names `KeyboardEvent.key` reports for the arrow, Home and End keys, compared and never drawn"],
  ["SGF|PDN", "file-format names, the same in every language"],
  ["Google", "the sign-in provider's name"],
  ["Vercel|Neon", "hosting and database providers' names"],
  ["Wikipedia", "a site's name"],
  ["ItsYourTurn|GoldToken", "the other sites whose move lists can be pasted: names, as they write them"],
  ["Little Golem|PlayOK|Pente\\.org", "other game sites named on the About page: names, as they write them"],
  ["CC BY(?:-SA|-NC)?(?:\\s*4\\.0)?|CC0", "a Creative Commons licence identifier"],
  ["[a-h][1-9][0-9]?", "board coordinates such as e5 or h10"],
  ["ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Backspace", "the names `KeyboardEvent.key` reports for the arrows and Backspace, compared and never drawn (Enter, Delete and Space, which are also words on a button, are in src/lib/ui/keyNames.constants.ts)"],
  ["Futago|Yotsugo|Sakasa|Nige|Antiwordle|Absurdle", "the names of Gomoji's ways to play, and of the published games they are versions of: names, not sentences"],
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

/** A whole identifier, never prose: lower-kebab or dotted tokens, no spaces. A phrase key is dotted camelCase (`rivalry.neverGame.you`), so a later segment may carry capitals. */
const IDENTIFIER_SHAPED = /^[a-z][a-z0-9]*(?:[:._/-][a-zA-Z0-9]+)+$/;

/** Does what remains, once names are taken out, read as English prose? */
export function looksLikeEnglish(raw) {
  const trimmed = raw.trim();
  if (IDENTIFIER_SHAPED.test(trimmed)) return false;
  /* A list of utility classes ("has-[:checked]:ring-2 enabled:cursor-pointer"): every token carries a variant colon, a hyphen or a bracket, and a lone token a colon or a bracket. */
  const classTokens = trimmed.split(/\s+/);
  if (classTokens.every((token) => /^[a-z0-9!][a-z0-9:\-[\]\/_.%()#,]*$/.test(token) && (classTokens.length > 1 ? /[-:[]/ : /[:[]/).test(token))) return false;
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
