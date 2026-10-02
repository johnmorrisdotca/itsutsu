"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { DEFAULT_APPEARANCE, STONE_SETS } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import { joinQuery, playPath, setUpPath } from "@/lib/gomoku/slugs";
import { PUZZLE_KINDS, PUZZLE_SPECS } from "@/lib/puzzles/puzzles.constants";
import { generatePuzzle, preparePuzzle, puzzleLoads } from "@/lib/puzzles/generate";
import { puzzleAsked, puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import type { Puzzle, PuzzleClock, PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { clockFor } from "@/lib/puzzles/puzzleClock";
import { furtherRun, runOnDevice } from "./runsOnDevice";
import type { WordCount } from "@/lib/puzzles/gomoji/words.types";
import { freshSeedOf } from "@/lib/puzzles/gomoji/wordsSeed";
import { freshDodgeSeed } from "@/lib/puzzles/gomoji/dodgeSeed";
import { freshBackwardsSeed } from "@/lib/puzzles/gomoji/backwardsSeed";
import { freshSolitaireSeed } from "@/lib/puzzles/solitaire/generate";
import { freshMahjongSeed } from "@/lib/puzzles/mahjong/generate";
import { freshSuidoSeed } from "@/lib/puzzles/suido/seed";
import type { Kind as SuidoKind } from "@johnmorrisdotca/suido";
import type { MahjongBonusRule } from "@johnmorrisdotca/jarajara";

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
import { MahjongSolve } from "./MahjongSolve";
import { MahjongTableGame } from "./MahjongTableGame";
import { NumberSolve } from "./NumberSolve";
import { FreeCellSolve } from "./FreeCellSolve";
import { SolitaireSolve } from "./SolitaireSolve";
import { CubeSolve } from "./CubeSolve";
import { SuidoSolve } from "./SuidoSolve";
import { SpiderSolve } from "./SpiderSolve";
import { PuzzleClockProvider } from "./PuzzleClockContext";
import { PuzzleNewGame } from "./PuzzleNewGame";
import { WinSlotProvider } from "./PuzzleWinSlot";
import type { TsunagiCheatsChoice, TsunagiExplosionsChoice, TsunagiFill, TsunagiMarks } from "./puzzles.constants";
import { TsunagiSolve } from "./TsunagiSolve";
import type { ResumedRun, SolveRace } from "./solveShared";
import type { KumimojiLanguage, KumimojiLength } from "@/lib/puzzles/kumimoji/kumimoji.types";

/** The solves that draw Give up and New game themselves, in their controls row (`PatienceControls`, `CubeSolve`). */
const HAS_OWN_ENDING_ROW: ReadonlySet<PuzzleKind> = new Set([PUZZLE_KINDS.solitaire, PUZZLE_KINDS.freecell, PUZZLE_KINDS.spider, PUZZLE_KINDS.cube]);

type PuzzlePlayProps = Parameters<typeof PuzzlePlayDrawn>[0] & {
  /** The query the server drew this page for (`puzzleQuery`), to tell a page kept for another address from this one. */
  drawnFor?: string;
};

/**
 * A PAGE KEPT FOR ANOTHER ADDRESS. Offline, the keeper answers a puzzle asked
 * for at an address it never kept with the same puzzle's page kept at another
 * (public/sw.js): another seed, or another size, level or choice from the
 * set-up. So what the address asks is read here, in the browser, and played in
 * place of what the page was drawn with — a new puzzle chosen on a set-up with
 * no connection is the puzzle chosen. The run the page was drawn with is
 * another puzzle's, and is left out. Online the server draws every page for its
 * own address, the two agree, and nothing changes.
 */
export function PuzzlePlay({ drawnFor, ...drawn }: PuzzlePlayProps) {
  /* The router's address, never `window.location`: it moves in the same render as the page's props, where the window's moves a moment after. */
  const params = useSearchParams();
  const here = drawnFor === undefined ? null : puzzleAsked(drawn.kind, Object.fromEntries(params));
  if (here === null || puzzleQuery(here) === drawnFor) return <PuzzlePlayDrawn {...drawn} />;
  return (
    <PuzzlePlayDrawn
      {...drawn}
      size={here.size}
      level={here.level}
      seed={here.seed}
      checks={here.checks ?? null}
      hints={here.hints === true}
      strict={here.strict === true}
      headStart={here.headStart === true}
      words={here.words ?? 1}
      gameLength={here.gameLength ?? "short"}
      language={here.language ?? "english"}
      doubleSet={here.doubleSet === true}
      diagonals={here.diagonals === true}
      players={here.players ?? 1}
      clock={here.clock ?? "none"}
      bonus={here.bonus ?? "group"}
      pipes={here.pipes ?? "drains"}
      anyDeal={here.anyDeal === true}
      resumed={null}
    />
  );
}

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
function PuzzlePlayDrawn({
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
  bonus = "group",
  pipes = "drains",
  clock = "none",
  anyDeal = false,
  dodge = false,
  backwards = false,
  resumed = null,
  appearance = DEFAULT_APPEARANCE,
  tsunagi = null,
  suido = null,
}: {
  /** Kumimoji's pass and play: two to eight round this device (`KumimojiParty`); 1, the solo game. */
  players?: number;
  /** Kumimoji's pass and play on several devices instead, where the reader has an account (`OnlineOffer`). */
  online?: OnlineOffer;
  /** Mahjong's flowers and seasons, from the address: read only to draw a seed, which says it from then on (`bonusRuleOfSeed`). */
  bonus?: MahjongBonusRule;
  /** Suido's kind of board, from the address: read only to draw a seed, which says it from then on (`suidoKindOfSeed`). */
  pipes?: SuidoKind;
  /** The countdown chosen on the set-up (`puzzleClock.ts`), from the address; never a race's. */
  clock?: PuzzleClock;
  /** Solitaire's any deal, read only to draw a seed, which says it from then on (`solitaire/generate.ts`). */
  anyDeal?: boolean;
  /** Whether Gomoji's Head start was chosen: keys greyed before the first guess (`headStart.ts`), easy only. */
  headStart?: boolean;
  /** How many words a Gomoji was asked for — a Futago's two (`futago.ts`) or a Yotsugo's four (`yotsugo.ts`): read only to draw a seed, which says it from then on. */
  words?: WordCount;
  /** Whether a Gomoji's Nige was asked for, the word that dodges (`dodge.ts`): read only to draw a seed, which says it from then on. */
  dodge?: boolean;
  /** Whether a Gomoji's Sakasa was asked for, played backwards (`backwards.ts`): read only to draw a seed, which says it from then on. */
  backwards?: boolean;
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
  /** Suido's levels already solved at this size on the account, each with its best time and the solve it was; for a level only. */
  suido?: { known: Record<number, number>; bestSolves?: Record<number, string> } | null;
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
    // A Solitaire's seed is drawn in the block its kind of deal is dealt from (`freshSolitaireSeed`), a Mahjong's by its flowers' rule.
    const drawn = kind === "solitaire" ? freshSolitaireSeed(anyDeal) : kind === "mahjong" ? freshMahjongSeed(bonus) : kind === "suido" ? freshSuidoSeed(pipes) : dodge ? freshDodgeSeed() : backwards ? freshBackwardsSeed() : freshSeedOf(PUZZLE_SPECS[kind].wordGrid === undefined ? 1 : words);
    router.replace(joinQuery(playPath(kind), puzzleQuery({ size, level, seed: drawn, checks, hints, strict, headStart, words, dodge, backwards, gameLength, language, doubleSet, diagonals, players, clock, bonus, pipes })));
  }, [seed, kind, size, level, checks, hints, strict, headStart, words, dodge, backwards, gameLength, language, doubleSet, diagonals, players, clock, anyDeal, bonus, pipes, router]);

  /* A kind whose words or levels load (every word puzzle, Tsunagi: `puzzleLoads`) waits for them, Kumimoji for its language's list; every other kind is ready at once. */
  const waits = puzzleLoads(kind, seed);
  // A Suido level is read from its size's levels; a board made from a seed has none to wait for, so the two are different keys.
  const loadedKey = `${kind}:${size}:${kind === "kumimoji" ? language : ""}${waits && kind === "suido" ? ":levels" : ""}`;
  const [loaded, setLoaded] = useState<string | null>(waits ? null : loadedKey);
  useEffect(() => {
    let live = true;
    void preparePuzzle(kind, size, language, seed).then(() => live && setLoaded(loadedKey));
    return () => {
      live = false;
    };
  }, [kind, size, language, seed, loadedKey]);
  const puzzle = useMemo(
    () => (seed === null || loaded !== loadedKey ? null : generatePuzzle(kind, size, level, seed, { gameLength, language, doubleSet, diagonals })),
    [kind, size, level, seed, loaded, loadedKey, gameLength, language, doubleSet, diagonals],
  );

  /* The run this device kept of this puzzle, if any (`runsOnDevice.ts`): opened in place of the account's when played further, as it is when it was left offline. */
  const deviceRun = useMemo(() => (puzzle === null ? null : runOnDevice({ ...puzzle, clock: clockFor(kind, clock) })), [puzzle, kind, clock]);

  /*
   * A SEED THAT NAMES ANOTHER: a winnable Solitaire's seed is the first deal
   * from it the solver wins, which may be a later one (`solitaire/generate.ts`),
   * and so is every FreeCell's and Spider's (`nextWinnableTry`).
   * The address is put right, so a reload, a share or Continue names the deal
   * on the table. Every other kind makes its puzzle at its own seed, and
   * nothing happens.
   */
  useEffect(() => {
    if (puzzle === null || seed === null || puzzle.seed === seed || race !== null) return;
    router.replace(`${playPath(kind)}${puzzleQuery({ size, level, seed: puzzle.seed, checks, hints, strict, headStart, words, gameLength, language, doubleSet, diagonals, players, clock })}`);
  }, [puzzle, seed, race, kind, size, level, checks, hints, strict, headStart, words, gameLength, language, doubleSet, diagonals, players, clock, router]);

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
  /* Keyed on the puzzle, so a new seed is a new solve with nothing carried over — on the puzzle's own seed, so
     the address being put right to name it (a winnable Solitaire's, above) is not a new solve. */
  const key = `${kind}-${size}-${level}-${puzzle.seed}-${checks ?? "any"}-${strict}-${headStart}-${gameLength}-${language}-${doubleSet}-${diagonals}-${players}-${clock}`;
  // A race is its own contest and never on a countdown; a puzzle that offers none has none (`clockFor`).
  const timed = race === null ? clockFor(kind, clock) : "none";
  // The place over the board a win's cover is drawn, joining each kind's board to the card at its end (`PuzzleWinSlot`).
  return (
    <PuzzleClockProvider value={timed}>
      <WinSlotProvider>
        {solveOf(puzzle)}
        {/* New game under every solve that has no row of its own (the four that do draw it beside Give up). */}
        {race === null && !HAS_OWN_ENDING_ROW.has(kind) ? <PuzzleNewGame kind={kind} /> : null}
      </WinSlotProvider>
    </PuzzleClockProvider>
  );

  function solveOf(puzzle: Puzzle) {
    const opened = furtherRun(resumed, deviceRun);
    // A race carries no Head start, as it carries no Strict: both seats play the one straight contest.
    const seat = race ?? null;
    const headStarted = seat === null && headStart;
    switch (kind) {
      case "hiddenStones":
        return <HiddenStonesSolve key={key} puzzle={puzzle} hasAccount={hasAccount} race={seat} checks={checks} hints={hints} resumed={race === null ? opened : null} set={STONE_SETS[appearance.stoneSet]} />;
      case "blackAndWhite":
        return <BlackAndWhiteSolve key={key} puzzle={puzzle} hasAccount={hasAccount} race={seat} checks={checks} hints={hints} resumed={race === null ? opened : null} set={STONE_SETS[appearance.stoneSet]} />;
      case "solitaire":
        return <SolitaireSolve key={key} puzzle={puzzle} hasAccount={hasAccount} race={seat} resumed={race === null ? opened : null} appearance={appearance} />;
      case "freecell":
        return <FreeCellSolve key={key} puzzle={puzzle} hasAccount={hasAccount} race={seat} resumed={race === null ? opened : null} appearance={appearance} />;
      case "spider":
        return <SpiderSolve key={key} puzzle={puzzle} hasAccount={hasAccount} race={seat} resumed={race === null ? opened : null} appearance={appearance} />;
      case "bridges":
        return <BridgesSolve key={key} puzzle={puzzle} hasAccount={hasAccount} race={seat} checks={checks} hints={hints} resumed={race === null ? opened : null} />;
      case "pictureLogic":
        return <PictureLogicSolve key={key} puzzle={puzzle} hasAccount={hasAccount} race={seat} checks={checks} hints={hints} resumed={race === null ? opened : null} />;
      case "gomoji":
      case "gomojiMot":
      case "gomojiWort":
      case "gomojiPop":
        return <GomojiSolve key={key} puzzle={puzzle} strict={strict} headStart={headStarted} hasAccount={hasAccount} race={seat} resumed={race === null ? opened : null} appearance={appearance} />;
      case "tsunagi":
        return (
          <TsunagiSolve
            key={key}
            puzzle={puzzle}
            hasAccount={hasAccount}
            race={seat}
            resumed={race === null ? opened : null}
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
        return <KumimojiSolve key={key} puzzle={puzzle} hasAccount={hasAccount} race={seat} resumed={race === null ? opened : null} appearance={appearance} language={language} hints={hints} />;
      case "gomojiKana":
        return <GomojiKanaSolve key={key} puzzle={puzzle} strict={strict} headStart={headStarted} hasAccount={hasAccount} race={seat} resumed={race === null ? opened : null} appearance={appearance} />;
      case "mahjong":
        // A table round this device is local and never a race, as Kumimoji's pass and play is.
        if (players > 1 && race === null) return <MahjongTableGame key={key} puzzle={puzzle} players={players} appearance={appearance} />;
        return <MahjongSolve key={key} puzzle={puzzle} hasAccount={hasAccount} race={seat} resumed={race === null ? opened : null} hints={hints} appearance={appearance} />;
      case "suido":
        return <SuidoSolve key={key} puzzle={puzzle} hasAccount={hasAccount} race={seat} resumed={race === null ? opened : null} hints={hints} known={suido?.known} bestSolves={suido?.bestSolves} />;
      case "cube":
        return <CubeSolve key={key} puzzle={puzzle} hasAccount={hasAccount} race={seat} resumed={race === null ? opened : null} appearance={appearance} />;
      case "koushi":
        return <KoushiSolve key={key} puzzle={puzzle} hasAccount={hasAccount} race={seat} resumed={race === null ? opened : null} appearance={appearance} />;
      default:
        return <NumberSolve key={key} puzzle={puzzle} hasAccount={hasAccount} race={seat} checks={checks} hints={hints} resumed={race === null ? opened : null} />;
    }
  }
}

