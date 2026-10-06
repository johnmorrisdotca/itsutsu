import { connection } from "next/server";
import Link from "@/components/ui/Link";

import { ASK_FOR_INVITE_PATH } from "@/components/auth/askForInvite.constants";
import { Paired } from "@/components/i18n/Paired";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import type { Speaker } from "@/lib/i18n/i18n";
import { PlayerName } from "@/components/players/PlayerName";
import { PANEL_CLASS, SECTION_TITLE, TABLE_SCROLL } from "@/components/ui/ui.constants";
import { currentMemberId, currentSession } from "@/lib/auth/currentSession";
import { joinQuery, mySolvePath, setUpPath, solvePath, standingsPath } from "@/lib/gomoku/slugs";
import { PUZZLE_CLOCK_DISPLAY, PUZZLE_CLOCK_LIST, PUZZLE_SPECS, levelsFor, offersClock } from "@/lib/puzzles/puzzles.constants";
import { clockName, levelNameOf } from "@/lib/puzzles/puzzleCopy";
import { sizeWordIn } from "@/lib/puzzles/sizeWord";
import type { PuzzleClock, PuzzleKind } from "@/lib/puzzles/puzzles.types";
import { type FastestBoard, fastestKey, fastestSolvesOf } from "@/lib/puzzles/server/puzzleSolves";
import { namesAndTagsOf } from "@/lib/xp/nameTagsOf";
import type { NameTag } from "@/lib/xp/nameTag.types";
import { PUZZLE_RECORD_SORTS, puzzleRecordHref } from "@/lib/puzzles/puzzleRecordAddress";

import { OneSolvePoints } from "./SolvePoints";
import { SolveTime } from "./SolveTime";
import { guessesText } from "@/lib/puzzles/gomoji/guessesTaken";
import { hadHeadStart } from "@/lib/puzzles/gomoji/headStart";

/**
 * The fastest solves of a puzzle, on its front door: the puzzle's ladder.
 *
 * Request time, in a component of its own with `connection()`, like the
 * game ladder — the page around it is prerendered. A stranger is shown the
 * shut state rather than a table with the names left out, as the ladder
 * does: reading about a puzzle is open, who is fastest at it is the playing
 * half of the site. An empty board is data — it shows its shape and says
 * nobody has solved this size yet, with the way in.
 */
export async function PuzzleFastest({ kind, title, whole = false }: { kind: PuzzleKind; title: string; whole?: boolean }) {
  await connection();
  const session = await currentSession();
  const say = await currentSpeaker();
  const heading = (
    <h2 className={SECTION_TITLE}>
      <Paired en={say.say("pset.fast.heading")} kanji="最速" kanjiClassName="normal-case tracking-normal" inReadersLanguage />
    </h2>
  );
  if (session === null) {
    return (
      <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="puzzle-fastest">
        {heading}
        <p className="text-sm text-muted" data-testid="puzzle-fastest-shut">
          {say.say("pset.fast.shut", { title })}
        </p>
        <p className="text-sm">
          <Link href="/join" className="font-semibold underline-offset-2 hover:underline">
            {say.say("points.board.haveInvite")}
          </Link>{" "}
          <Link href={ASK_FOR_INVITE_PATH} className="text-muted underline-offset-2 hover:underline">
            {say.say("points.board.noInvite")}
          </Link>
        </p>
      </section>
    );
  }
  const [board, me] = await Promise.all([fastestSolvesOf(kind), currentMemberId()]);
  const { names, tags } = await namesAndTagsOf([...board.values()].flatMap((row) => row.fastest.map((solve) => solve.memberId)));
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="puzzle-fastest">
      {heading}
      <FastestTable kind={kind} board={board} names={names} tags={tags} whole={whole} me={me} say={say} />
      {whole ? null : (
        <p className="text-sm">
          <Link href={standingsPath(kind)} className="font-semibold underline-offset-2 hover:underline" data-testid="puzzle-fastest-all">
            {say.say("pset.fast.every")}
          </Link>
        </p>
      )}
    </section>
  );
}

/**
 * THE TABLE: a group per size and level, its fastest solves ranked under it
 * in columns — rank, player, time, the guesses a word took, the points, and
 * the way into the replay. John, 2026-09-26, on Gomoji's standings: "put the
 * times in a column perhaps. and guesses in another column. more tabular.
 * Also the points they got for that game would be good. Also, I can't view
 * the games that were played!" Every puzzle's table is this one, so they all
 * read alike; the guesses column is drawn only for a word.
 *
 * NOTHING ON IT IS A DEAD END (John, the same day: "No way to view played
 * games"). A time opens that solve (`SolveTime`), and so do its points and its
 * Replay; a name opens the player; and a size and level opens every solve at
 * it, fastest first, in the puzzle's record — the whole of the list these
 * three are the head of. An empty size keeps its row, with the way in.
 */
export function FastestTable({
  kind,
  board,
  names,
  tags,
  whole,
  me,
  say,
}: {
  kind: PuzzleKind;
  board: FastestBoard;
  names: Map<string, string>;
  /** The flag, badge and level beside each name, read with the names. */
  tags: ReadonlyMap<string, NameTag>;
  whole: boolean;
  me: string | null;
  say: Speaker;
}) {
  const spec = PUZZLE_SPECS[kind];
  const words = spec.helps === false;
  const columns = words ? 6 : 5;
  const rowsOn = (clock: PuzzleClock) =>
    spec.sizes.flatMap((size) => levelsFor(kind, size).map((level) => ({ size, level, clock, key: fastestKey(size, level, clock), at: board.get(fastestKey(size, level, clock)) })));
  // A size the set-up no longer offers keeps its row while somebody holds a time at it, and is not offered as empty.
  const rows = rowsOn("none").filter((row) => spec.offered.includes(row.size) || row.at !== undefined);
  /*
   * EACH COUNTDOWN IS A TABLE OF ITS OWN (`puzzleClock.ts`): a Rabbit's minute
   * and a solve with no clock are not one race. After the untimed rows, each
   * clock's rows that anybody has solved on; on the standings page a clock
   * nobody has solved on yet keeps one empty row, with the way in, so the shape
   * of what is kept is there before the first time is.
   */
  const clocks = offersClock(kind) ? PUZZLE_CLOCK_LIST.filter((clock) => clock !== "none") : [];
  const timed = clocks.flatMap((clock) => rowsOn(clock).filter((row) => row.at !== undefined));
  const nobodyOn = whole ? clocks.filter((clock) => !timed.some((row) => row.clock === clock)) : [];
  const shown = whole ? [...rows, ...timed] : [...rows, ...timed].filter((row) => row.at !== undefined).slice(0, 4);
  if (shown.length === 0) {
    return (
      <p className="text-sm text-muted" data-testid="puzzle-fastest-nobody">
        {say.say("pset.fast.nobody")}{say.pairsWithKanji ? " " : ""}
        <Link href={setUpPath(kind)} className="font-semibold text-ink underline-offset-2 hover:underline">
          {say.say("pset.fast.beFirst")}
        </Link>
      </p>
    );
  }
  /*
   * FITS THE COLUMN IT IS IN, not the screen. On a desktop the front door puts
   * this in a side column under 300px wide, where six columns overran it: names
   * broke over two lines and Replay fell off the edge (John, 2026-09-26, "renders
   * badly in Desktop"). So the table asks its own width (`@container`): narrow, it
   * drops Replay — the time and the points already open the same solve — and
   * tightens its spacing; wide, as on the standings page, it has all six.
   */
  const cell = "py-1 pr-2 @sm:pr-3";
  const replay = "hidden @sm:table-cell";
  return (
    <div className={`${TABLE_SCROLL} @container`}>
      <table className="w-full text-sm" data-testid="puzzle-fastest-table" data-words={words ? "true" : "false"}>
        <thead className="text-[0.62rem] font-semibold tracking-normal text-muted uppercase @sm:tracking-[0.12em]">
          <tr>
            <th className={`${cell} w-6 text-right`}>#</th>
            <th className={`${cell} w-full text-left`}>{say.say("points.board.player")}</th>
            <th className={`${cell} text-right`}>{say.say("pset.col.time")}</th>
            {words ? <th className={`${cell} text-right`}>{say.say(spec.lattice === true ? "pset.col.swaps" : spec.cards === true ? "pset.col.moves" : "pset.col.guesses")}</th> : null}
            <th className={`${cell} text-right`}>{say.say("pset.col.points")}</th>
            <th className={`${replay} py-1 text-right`}>
              <span className="sr-only">{say.say("pset.col.replay")}</span>
            </th>
          </tr>
        </thead>
        {shown.map((row) => {
          const label = (
            <>
              {sizeWordIn(row.size, kind, say)} <span className="text-muted">{levelNameOf(row.level, say.locale)}</span>
              {row.clock === "none" ? null : <ClockMark clock={row.clock} />}
            </>
          );
          return (
            <tbody key={row.key} data-testid="puzzle-fastest-row" data-size={row.size} data-level={row.level} data-clock={row.clock}>
              <tr className="border-t border-rule-strong">
                <th colSpan={columns} scope="rowgroup" className="pt-2 pb-1 text-left text-xs font-semibold">
                  {row.at === undefined ? (
                    label
                  ) : (
                    <Link
                      href={puzzleRecordHref(kind, { size: row.size, level: row.level, clock: row.clock, sort: PUZZLE_RECORD_SORTS.fastest })}
                      className="underline-offset-2 hover:underline"
                      title={say.say("pset.fast.everySolve")}
                      data-testid="puzzle-fastest-every"
                    >
                      {label} <span className="font-normal text-muted">{say.say("pset.fast.everySolveLink")}</span>
                    </Link>
                  )}
                </th>
              </tr>
              {row.at === undefined || row.at.fastest.length === 0 ? (
                <tr className="border-t border-rule">
                  <td colSpan={columns} className="py-1 text-muted">
                    <Link href={setUpPath(kind)} className="underline-offset-2 hover:underline">
                      {say.say("pset.fast.nobodyYet")}
                    </Link>
                  </td>
                </tr>
              ) : (
                row.at.fastest.map((solve, index) => {
                  const mine = solve.memberId === me;
                  const help = [
                    solve.hintsUsed !== null && solve.hintsUsed > 0 ? (hadHeadStart(kind, row.level, solve.hintsUsed) ? say.say("pset.fast.headStart") : say.say("pset.fast.hints")) : null,
                    solve.checksAllowed !== null ? say.count("puzzle.count.check", solve.checksAllowed) : null,
                  ].filter((part) => part !== null);
                  return (
                    <tr key={solve.id} className="border-t border-rule align-baseline" data-testid="puzzle-fastest-rank" data-solve={solve.id} data-member={solve.memberId}>
                      <td className={`${cell} text-right text-muted tabular-nums`}>{index + 1}</td>
                      <td className={`${cell} whitespace-nowrap`}>
                        <PlayerName name={names.get(solve.memberId) ?? ""} memberId={solve.memberId} fallback={say.say("points.board.aMember")} tag={tags.get(solve.memberId)} />
                        {help.length === 0 ? null : (
                          <span className="block text-xs text-muted" data-testid="puzzle-fastest-help">
                            {help.join(" · ")}
                          </span>
                        )}
                      </td>
                      <td className={`${cell} text-right whitespace-nowrap`}>
                        <SolveTime kind={kind} solveId={solve.id} elapsedMs={solve.elapsedMs} mine={mine} testId="puzzle-fastest-time" />
                      </td>
                      {/* A word's time says half of how it went; the guesses it needed say the rest (John: "like 3/6 guesses"). */}
                      {words ? (
                        <td className={`${cell} text-right text-muted tabular-nums whitespace-nowrap`} data-testid="puzzle-fastest-guesses">
                          {solve.guesses === null ? "–" : guessesText(solve.guesses)}
                        </td>
                      ) : null}
                      <td className={`${cell} text-right whitespace-nowrap`}>
                        <OneSolvePoints kind={kind} solveId={solve.id} points={solve.points} mine={mine} testId="puzzle-fastest-points" />
                      </td>
                      <td className={`${replay} py-1 text-right whitespace-nowrap`}>
                        <Link
                          href={mine ? mySolvePath(kind, solve.id) : solvePath(kind, solve.id)}
                          className="text-xs underline-offset-2 hover:underline"
                          title={say.say("pset.fast.watchAgain")}
                          data-testid="puzzle-fastest-replay"
                        >
                          {say.say("pset.fast.replay")}
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          );
        })}
        {nobodyOn.map((clock) => (
          <tbody key={clock} data-testid="puzzle-fastest-row" data-clock={clock}>
            <tr className="border-t border-rule-strong">
              <th colSpan={columns} scope="rowgroup" className="pt-2 pb-1 text-left text-xs font-semibold">
                {say.say("pset.fast.anySize")} <ClockMark clock={clock} />
              </th>
            </tr>
            <tr className="border-t border-rule">
              <td colSpan={columns} className="py-1 text-muted">
                <Link href={joinQuery(setUpPath(kind), `?clock=${clock}`)} className="underline-offset-2 hover:underline" data-testid="puzzle-fastest-clock-first">
                  {say.say("pset.fast.nobodyOnClock", { clock: clockName(clock, say.locale) })}
                </Link>
              </td>
            </tr>
          </tbody>
        ))}
      </table>
    </div>
  );
}

/** The countdown a group of the table was solved on: its animal, its kanji and its time. */
function ClockMark({ clock }: { clock: PuzzleClock }) {
  const shown = PUZZLE_CLOCK_DISPLAY[clock];
  return (
    <span className="font-normal text-muted" data-testid="puzzle-fastest-clock">
      {" "}· <Paired en={shown.label} kanji={shown.kanji} kanjiClassName="" /> {shown.time}
    </span>
  );
}
