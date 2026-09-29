"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { DEFAULT_APPEARANCE, STONE_SETS } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import { joinQuery, playPath, setUpPath } from "@/lib/gomoku/slugs";
import { PUZZLE_SPECS } from "@/lib/puzzles/puzzles.constants";
import { generatePuzzle, preparePuzzle, puzzleLoads } from "@/lib/puzzles/generate";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import type { Puzzle, PuzzleClock, PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { clockFor } from "@/lib/puzzles/puzzleClock";
import type { WordCount } from "@/lib/puzzles/gomoji/words.types";
import { freshSeedOf } from "@/lib/puzzles/gomoji/wordsSeed";

import { BlackAndWhiteSolve } from "./BlackAndWhiteSolve";
import { BridgesSolve } from "./BridgesSolve";
import { PictureLogicSolve } from "./PictureLogicSolve";
import { HiddenStonesSolve } from "./HiddenStonesSolve";
import { GomojiKanaSolve } from "./GomojiKanaSolve";
import { GomojiSolve } from "./GomojiSolve";
import { KumimojiParty } from "./KumimojiParty";
import type { OnlineOffer } from "@/lib/party/online/online.types";
import { KumimojiSolve } from "./KumimojiSolve";
import { KoushiSolve } from "./KoushiSolve";
import { NumberSolve } from "./NumberSolve";
import { PuzzleClockProvider } from "./PuzzleClockContext";
import type { TsunagiCheatsChoice, TsunagiExplosionsChoice, TsunagiFill, TsunagiMarks } from "./puzzles.constants";
import { TsunagiSolve } from "./TsunagiSolve";
import type { ResumedRun, SolveRace } from "./solveShared";
import type { KumimojiLanguage, KumimojiLength } from "@/lib/puzzles/kumimoji/kumimoji.types";

/**
 * Solving a puzzle: the whole of it, in the browser.
 *
 * The puzzle is made here from the seed in the address (`generatePuzzle`),
 * with its answer, and never asked of a server. Each kind has a solve of its
 * own — a grid of numbers, a grid of stones, a grid of black and white — sharing the clock, the
 * handing-in and the card at the end (`solveShared.tsx`). Nothing polls,
 * nothing is timed on a server, and a stranger's solve costs the site
 * nothing at all (John: "should cost me nothing, no server calculations").
 *
 * LOADED WITH `ssr: false` (`PuzzlePlayClient`), and that is what keeps the
 * promise: this component generates in render, and a server render of it
 * would be the server making the puzzle. The page shows "making your
 * puzzle" until the browser has.
 *
 * A seed nobody chose is drawn here and written into the address, so the
 * puzzle on the screen is the puzzle the address names: reload it, share it,
 * or come back tomorrow and the same puzzle is there.
 */
export function PuzzlePlay({
  kind,
  size,
  level,
  seed,
  hasAccount,
  race = null,
  checks = null,
  hints = false,
  strict = false,
  headStart = false,
  words = 1,
  gameLength = "short",
  language = "english",
  doubleSet = false,
  diagonals = false,
  players = 1,
  online,
  clock = "none",
  resumed = null,
  appearance = DEFAULT_APPEARANCE,
  tsunagi = null,
}: {
  /** Kumimoji's pass and play: two to eight round this device (`KumimojiParty`); 1, the solo game. */
  players?: number;
  /** Kumimoji's pass and play on several devices instead, where the reader has an account (`OnlineOffer`). */
  online?: OnlineOffer;
  /** The countdown chosen on the set-up (`puzzleClock.ts`), from the address; never a race's. */
  clock?: PuzzleClock;
  /** Whether Gomoji's Head start was chosen: keys greyed before the first guess (`headStart.ts`), easy only. */
  headStart?: boolean;
  /** How many words a Gomoji was asked for — a Futago's two (`futago.ts`) or a Yotsugo's four (`yotsugo.ts`): read only to draw a seed, which says it from then on. */
  words?: WordCount;
  gameLength?: KumimojiLength;
  language?: KumimojiLanguage;
  doubleSet?: boolean;
  /** Kumimoji's Diagonals: its diagonal runs of three or more are read too. */
  diagonals?: boolean;
  /** Tsunagi's levels already solved at this size on the account, whether it is played by colours or numbers, and with marbles along the lines or not. */
  tsunagi?: {
    known: Record<number, number>;
    bestSolves?: Record<number, string>;
    /** Levels solved only in a way that opens no block (explosions off). */
    closed?: number[];
    attempts?: Record<number, number>;
    marks: TsunagiMarks | null;
    fill?: TsunagiFill | null;
    explosions?: TsunagiExplosionsChoice | null;
    cheats?: TsunagiCheatsChoice | null;
  } | null;
  kind: PuzzleKind;
  size: number;
  level: PuzzleLevel;
  seed: number | null;
  /** How many times Check may be pressed, from the address; null for no limit. */
  checks?: number | null;
  /** Whether Hint was chosen for this puzzle, from the address. */
  hints?: boolean;
  /** Whether Gomoji's Strict was chosen: every letter found must be played again, a green in its place. */
  strict?: boolean;
  /** The run the member kept of this grid, opened where it was left. */
  resumed?: ResumedRun | null;
  /** Whether a solve can be paid: an account, not merely a session. */
  hasAccount: boolean;
  /** The race this solve is a seat of, with the givens the server kept, or null for a solve on one's own. */
  race?: (SolveRace & { givens: string }) | null;
  /** The reader's board: the board colour picker of a puzzle drawn on the board (`GomojiSolve`, `GomojiKanaSolve`, `KoushiSolve`), and the stone set a puzzle played with stones draws. */
  appearance?: Appearance;
}) {
  const router = useRouter();

  /* A seed nobody chose: draw one and put it in the address, so the puzzle is
     the address's. `replace`, so the back button does not return to a page
     that would draw a different one. */
  useEffect(() => {
    if (seed !== null) return;
    // A puzzle of fixed levels has no seed to draw: no level asked is the board of levels to choose one on.
    if (PUZZLE_SPECS[kind].fixedLevels === true) {
      router.replace(joinQuery(setUpPath(kind), `?size=${size}`));
      return;
    }
    router.replace(joinQuery(playPath(kind), puzzleQuery({ size, level, seed: freshSeedOf(PUZZLE_SPECS[kind].wordGrid === undefined ? 1 : words), checks, hints, strict, headStart, words, gameLength, language, doubleSet, diagonals, players, clock })));
  }, [seed, kind, size, level, checks, hints, strict, headStart, words, gameLength, language, doubleSet, diagonals, players, clock, router]);

  /* A kind whose words or levels load (every word puzzle, Tsunagi: `puzzleLoads`) waits for them, Kumimoji for its language's list; every other kind is ready at once. */
  const waits = puzzleLoads(kind);
  const loadedKey = `${kind}:${size}:${kind === "kumimoji" ? language : ""}`;
  const [loaded, setLoaded] = useState<string | null>(waits ? null : loadedKey);
  useEffect(() => {
    let live = true;
    void preparePuzzle(kind, size, language).then(() => live && setLoaded(loadedKey));
    return () => {
      live = false;
    };
  }, [kind, size, language, loadedKey]);
  const puzzle = useMemo(
    () => (seed === null || loaded !== loadedKey ? null : generatePuzzle(kind, size, level, seed, { gameLength, language, doubleSet, diagonals })),
    [kind, size, level, seed, loaded, loadedKey, gameLength, language, doubleSet, diagonals],
  );

  if (puzzle === null) {
    return (
      <section className="flex flex-col gap-4" data-testid="puzzle-play" data-kind={kind} data-ready="false">
        <div className="flex aspect-square w-full items-center justify-center rounded-md border border-rule text-sm text-muted" data-testid="puzzle-making">
          Making your puzzle…
        </div>
      </section>
    );
  }
  /* A race's puzzle is made again here from its seed; if this browser's
     generator makes a different grid from the one the server kept, the race
     was made by another version of the site and cannot honestly be played. */
  if (race !== null && race !== undefined && race.givens !== puzzle.givens) {
    return (
      <section className="flex flex-col gap-4" data-testid="puzzle-play" data-kind={kind} data-ready="true">
        <p className="text-sm text-muted" data-testid="puzzle-race-mismatch">
          This race was made by an earlier version of the site, and this browser makes a different puzzle from its
          number. It cannot be played; start another.
        </p>
      </section>
    );
  }
  /* Keyed on the puzzle, so a new seed is a new solve with nothing carried over. */
  const key = `${kind}-${size}-${level}-${seed}-${checks ?? "any"}-${strict}-${headStart}-${gameLength}-${language}-${doubleSet}-${diagonals}-${players}-${clock}`;
  // A race is its own contest and never on a countdown; a puzzle that offers none has none (`clockFor`).
  const timed = race === null ? clockFor(kind, clock) : "none";
  return <PuzzleClockProvider value={timed}>{solveOf(puzzle)}</PuzzleClockProvider>;

  function solveOf(puzzle: Puzzle) {
    // A race carries no Head start, as it carries no Strict: both seats play the one straight contest.
    const seat = race ?? null;
    const headStarted = seat === null && headStart;
    switch (kind) {
      case "hiddenStones":
        return <HiddenStonesSolve key={key} puzzle={puzzle} hasAccount={hasAccount} race={seat} checks={checks} hints={hints} resumed={race === null ? resumed : null} set={STONE_SETS[appearance.stoneSet]} />;
      case "blackAndWhite":
        return <BlackAndWhiteSolve key={key} puzzle={puzzle} hasAccount={hasAccount} race={seat} checks={checks} hints={hints} resumed={race === null ? resumed : null} set={STONE_SETS[appearance.stoneSet]} />;
      case "bridges":
        return <BridgesSolve key={key} puzzle={puzzle} hasAccount={hasAccount} race={seat} checks={checks} hints={hints} resumed={race === null ? resumed : null} />;
      case "pictureLogic":
        return <PictureLogicSolve key={key} puzzle={puzzle} hasAccount={hasAccount} race={seat} checks={checks} hints={hints} resumed={race === null ? resumed : null} />;
      case "gomoji":
      case "gomojiMot":
      case "gomojiWort":
      case "gomojiPop":
        return <GomojiSolve key={key} puzzle={puzzle} strict={strict} headStart={headStarted} hasAccount={hasAccount} race={seat} resumed={race === null ? resumed : null} appearance={appearance} />;
      case "tsunagi":
        return (
          <TsunagiSolve
            key={key}
            puzzle={puzzle}
            hasAccount={hasAccount}
            race={seat}
            resumed={race === null ? resumed : null}
            appearance={appearance}
            known={tsunagi?.known}
            attempts={tsunagi?.attempts}
            bestSolves={tsunagi?.bestSolves}
            marksChosen={tsunagi?.marks ?? null}
            fillChosen={tsunagi?.fill ?? null}
            closed={tsunagi?.closed}
            explosionsChosen={tsunagi?.explosions ?? null}
            cheatsChosen={tsunagi?.cheats ?? null}
          />
        );
      case "kumimoji":
        // Pass and play is local and never a race: a race's address carries no players.
        if (players > 1 && race === null) return <KumimojiParty key={key} puzzle={puzzle} players={players} hints={hints} appearance={appearance} language={language} online={online} />;
        return <KumimojiSolve key={key} puzzle={puzzle} hasAccount={hasAccount} race={seat} resumed={race === null ? resumed : null} appearance={appearance} language={language} hints={hints} />;
      case "gomojiKana":
        return <GomojiKanaSolve key={key} puzzle={puzzle} strict={strict} headStart={headStarted} hasAccount={hasAccount} race={seat} resumed={race === null ? resumed : null} appearance={appearance} />;
      case "koushi":
        return <KoushiSolve key={key} puzzle={puzzle} hasAccount={hasAccount} race={seat} resumed={race === null ? resumed : null} appearance={appearance} />;
      default:
        return <NumberSolve key={key} puzzle={puzzle} hasAccount={hasAccount} race={seat} checks={checks} hints={hints} resumed={race === null ? resumed : null} />;
    }
  }
}
