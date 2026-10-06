import Link from "@/components/ui/Link";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { PlayerName } from "@/components/players/PlayerName";
import { CardArrow } from "@/components/ui/CardArrow";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS, RAISED_LINK, STRETCHED_HOST } from "@/components/ui/ui.constants";
import { familyPath, joinQuery, matchPath, playPath, setUpPath } from "@/lib/gomoku/slugs";
import { clockText } from "@/lib/puzzles/clockText";
import { fixedLevelName, fixedLevelOf, levelsQueryOf } from "@/lib/puzzles/fixedLevel";
import { suidoSizeInAddress } from "@/lib/puzzles/suido/sizes";
import { keptRunAsked, puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import { PUZZLE_CLOCK_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import { levelLabel, puzzleName } from "@/lib/puzzles/puzzleCopy";
import { clockWord } from "@/lib/puzzles/puzzleClock";
import { sizeWordIn } from "@/lib/puzzles/sizeWord";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import type { runsOf } from "@/lib/puzzles/server/puzzleRuns";
import type { racesWaitingOn } from "@/lib/puzzles/server/puzzleRaces";

import { GroupHeading } from "./GroupHeading";
import { MY_GAMES_COPY, MY_PUZZLE_ROW } from "./mine.constants";

/**
 * THE PUZZLES A MEMBER HAS GOING, beside their games.
 *
 * John, 2026-09-24: "I started Numbers game, paused it, then clicked away...
 * why is it not showing up in my current games list?" A puzzle is kept when it
 * is paused or its page is left (`useKeptRun`), and this is where it waits:
 * the puzzle, its size and level, the time so far, and the way back to the
 * very grid, opened where it was left.
 *
 * In the panel every group of games has (`GroupHeading`, the game rows' card),
 * since John, 2026-09-25, found the tab in a plain box of its own. The runs are
 * read once by `MyGamesList`, which also counts them on the tab. An empty panel
 * keeps its heading and says so, with the way to a puzzle.
 */
export async function MyPuzzleRuns({ runs, races = [] }: { runs: Awaited<ReturnType<typeof runsOf>>; races?: Awaited<ReturnType<typeof racesWaitingOn>> }) {
  const say = await currentSpeaker();
  const copy = MY_GAMES_COPY.puzzlesGoing;
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="puzzles-going">
      <GroupHeading label={copy.label} kanji={copy.kanji} total={runs.length + races.length} waiting testId="puzzles-going" />
      <p className="text-xs text-muted">{copy.hint}</p>
      {runs.length + races.length === 0 ? (
        <p className="text-sm text-muted" data-testid="puzzles-going-empty">
          {MY_GAMES_COPY.empty.puzzles}{" "}
          <Link href={familyPath("numberPlace")} className="font-medium text-ink underline underline-offset-4">
            {say.say("pset.me.playOne")}
          </Link>
        </p>
      ) : null}
      <ul className="flex flex-col gap-1.5">
        {/* A race waiting on the reader: offered by name, or their seat not yet started. It opens the race's page, where the seat is taken or the clock started. */}
        {races.map((race) => {
          const kind = race.kind as PuzzleKind;
          const href = matchPath(kind, race.id);
          return (
            <li key={race.id} className={`${STRETCHED_HOST} ${MY_PUZZLE_ROW}`} data-testid="puzzle-race-waiting" data-kind={kind} data-race={race.id}>
              <Link href={href} data-card-link="" className="absolute inset-0 rounded-lg" aria-label={say.say("pset.mine.raceAt", { name: puzzleName(kind, say.locale) })} />
              <GameThumb variant={kind} size="small" />
              <span className="flex min-w-0 flex-1 basis-48 flex-col gap-0.5">
                <span className="truncate font-medium">
                  <GameName variant={kind} raised />
                </span>
                <span className="text-xs text-muted">
                  {sizeWordIn(race.size, kind, say)} · {fixedLevelName(kind, race.seed, say) ?? levelLabel(race.level as PuzzleLevel, say.locale)} · {say.say("pset.mine.raceAgainst")}
                  <PlayerName name={race.against.name} memberId={race.against.memberId} fallback={say.say("pset.mine.somebody")} className={RAISED_LINK} tagged={false} />{say.say("pset.mine.waitingOnYou")}
                </span>
              </span>
              <span className="ml-auto flex shrink-0 items-center gap-2">
                <Link href={href} className={`${BUTTON_BASE} ${BUTTON_QUIET} ${RAISED_LINK} shrink-0`} data-testid="puzzle-race-open">
                  {MY_GAMES_COPY.raceOpen} →
                </Link>
                <CardArrow />
              </span>
            </li>
          );
        })}
        {runs.map((run) => {
          const kind = run.kind as PuzzleKind;
          const level = run.level as PuzzleLevel;
          const asked = keptRunAsked(kind, run);
          const href = joinQuery(playPath(kind), puzzleQuery(asked));
          // A run of a fixed level is named by its number (Tsunagi's, and a Suido level's: `fixedLevelOf`), and has its board of levels to go back to.
          const fixed = fixedLevelOf(kind, run.seed);
          return (
            <li key={run.id} className={`${STRETCHED_HOST} ${MY_PUZZLE_ROW}`} data-testid="puzzle-going" data-kind={kind} data-seed={run.seed}>
              {/* The whole card carries on, as a game's row opens its game; the name above it leads to the puzzle. */}
              <Link href={href} data-card-link="" className="absolute inset-0 rounded-lg" aria-label={say.say("pset.mine.carryOn", { name: puzzleName(kind, say.locale) })} />
              <GameThumb variant={kind} size="small" />
              <span className="flex min-w-0 flex-1 basis-48 flex-col gap-0.5">
                <span className="truncate font-medium">
                  <GameName variant={kind} raised />
                </span>
                <span className="text-xs text-muted">
                  {/* A fixed level is named by its number, every other puzzle by its level. */}
                  {sizeWordIn(run.size, kind, say)} · {fixedLevelName(kind, run.seed, say) ?? levelLabel(level, say.locale)} · {say.say("pset.mine.soFar", { time: clockText(run.elapsedMs) })}
                  {run.checksAllowed !== null ? ` · ${say.count("pset.mine.checks", run.checksAllowed)}` : ""}
                  {asked.hints ? ` · ${say.say("pset.mine.hints")}` : ""}
                  {run.strict ? ` · ${say.say("pset.mine.strict")}` : ""}
                  {asked.headStart ? ` · ${say.say("pset.fast.headStart")}` : ""}
                  {/* A countdown says what it has left, the number that matters when it is picked up again. */}
                  {asked.clock === undefined || asked.clock === "none" ? "" : ` · ${say.say("pset.mine.countdownLeft", { countdown: clockWord(asked.clock, say), time: clockText(Math.max(0, (PUZZLE_CLOCK_DISPLAY[asked.clock].ms ?? 0) - run.elapsedMs)) })}`}
                </span>
              </span>
              <span className="ml-auto flex shrink-0 items-center gap-2">
                {fixed !== null ? (
                  <Link href={joinQuery(setUpPath(kind), kind === "tsunagi" ? levelsQueryOf(kind, run.size, run.seed) : `?size=${suidoSizeInAddress(run.size)}`)} className={`${RAISED_LINK} shrink-0 text-sm text-muted underline underline-offset-4`} data-testid="puzzle-going-levels">
                    {say.say("pset.mine.allLevels")}
                  </Link>
                ) : null}
                <Link href={href} className={`${BUTTON_BASE} ${BUTTON_QUIET} ${RAISED_LINK} shrink-0`} data-testid="puzzle-going-continue">
                  {MY_GAMES_COPY.continueGame} →
                </Link>
                <CardArrow />
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

