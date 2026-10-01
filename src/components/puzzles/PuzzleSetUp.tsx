"use client";

import Link from "@/components/ui/Link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import { useFeltChoice } from "@/components/board/useFeltChoice";
import { START_PRESS } from "@/components/live/live.constants";
import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP, SET_UP_OPTIONS_AND_PLAY, SET_UP_PLAY_COLUMN } from "@/components/live/picker.constants";
import { PressLabel } from "@/components/ui/PressLabel";
import { PANEL_CLASS, PLAY_BUTTON } from "@/components/ui/ui.constants";
import { GAME_SETTINGS, settingQuery } from "@/lib/catalogue/gameSettings";
import { joinQuery, playPath, setUpPath } from "@/lib/gomoku/slugs";
import { generatePuzzle, preparePuzzle } from "@/lib/puzzles/generate";
import { WORD_STYLE_DISPLAY, WORD_STYLE_LIST } from "@/lib/puzzles/gomoji/wordStyles";
import { offersHeadStart } from "@/lib/puzzles/gomoji/headStart";
import { type PuzzleAsked, puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import type { WordCount } from "@/lib/puzzles/gomoji/words.types";
import { freshSeedOf } from "@/lib/puzzles/gomoji/wordsSeed";
import { freshDodgeSeed, offersDodge } from "@/lib/puzzles/gomoji/dodgeSeed";
import { freshBackwardsSeed } from "@/lib/puzzles/gomoji/backwardsSeed";
import type { GomojiWay } from "@/lib/puzzles/gomoji/words.types";
import { freshSolitaireSeed } from "@/lib/puzzles/solitaire/generate";
import { freshMahjongSeed } from "@/lib/puzzles/mahjong/generate";
import { freshSuidoSeed } from "@/lib/puzzles/suido/seed";
import { PUZZLE_CHECK_ALLOWANCES, PUZZLE_DISPLAY, PUZZLE_LEVEL_DISPLAY, PUZZLE_SPECS, checkAllowanceWords, levelBlurb, levelsFor } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleClock, PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import { SetUpSection } from "@/components/live/SetUpSection";

import { PuzzleBoardAndSizes, PuzzleSizes } from "./PuzzleBoardAndSizes";
import { WordSettingChips } from "./WordSettingChips";
import { FutagoChips } from "./FutagoChips";
import { PlayWayChips } from "./PlayWayChips";
import { HeadStartChips } from "./HeadStartChips";
import { PuzzleClockChips } from "./PuzzleClockChips";
import { KumimojiPartyResume } from "./KumimojiPartyScreens";
import { KumimojiSetUpOptions } from "./KumimojiSetUpOptions";
import { SolitaireSetUpOptions } from "./SolitaireSetUpOptions";
import { useSolitaireScoring } from "./useSolitaireScoring";
import { sizeWord } from "./puzzles.constants";
import { MahjongSetUpOptions, useMahjongChoice } from "./MahjongSetUpOptions";
import { SuidoSetUpOptions, useSuidoChoice } from "./SuidoSetUpOptions";
import { MahjongTableResume } from "./MahjongTableSeats";
import { useKumimojiChoice } from "./useKumimojiChoice";
import { SetUpResume } from "./SetUpResume";
import { useWordStyle } from "./WordStyleContext";


/**
 * Setting a puzzle up, at /games/<slug>/new: a size, the options, and Play.
 *
 * The same address a game is set up at, and the same shape — tiles for the
 * one choice that has a picture, chips for the one that has not — with
 * everything a game asks left out: no seats, no clock, no opponent, because
 * a puzzle has none. Nothing is written when Play alone is pressed; the address
 * it leads to holds the whole of the choice, and the browser makes the
 * puzzle when it gets there.
 */
export function PuzzleSetUp({
  kind,
  hasAccount,
  framed = true,
  sized,
  appearance = DEFAULT_APPEARANCE,
  asked,
  resumeHref = null,
  onKind,
}: {
  kind: PuzzleKind;
  /** A race is between two members, so a session with no account is told so rather than offered one. */
  hasAccount: boolean;
  framed?: boolean;
  /**
   * The size, when the caller holds it and draws the size tiles itself — the
   * set-up screen puts them beside the puzzle's picture, the way it puts a
   * game's boards beside the board (`PuzzleHere`). Left out, this draws them.
   */
  sized?: { size: number; onSize: (size: number) => void };
  /** The reader's board, for a puzzle drawn on the board itself: its colour is chosen under the preview (`PuzzleBoardPreview`). */
  appearance?: Appearance;
  /** What the address asked for (`puzzleAsked`): the choice this screen opens on, so a reload keeps what was chosen. */
  asked?: PuzzleAsked;
  /** The reader's puzzle of this kind already going, if any: offered first, above Start (`SetUpResume`). */
  resumeHref?: string | null;
  /**
   * A word game's language or word list chosen (`WordSettingChips`): another
   * kind of the same game. Left out, the game's own set-up opens that
   * setting's address, keeping what else was chosen.
   */
  onKind?: (kind: PuzzleKind) => void;
}) {
  const hydrated = useHydrated();
  const router = useRouter();
  const spec = PUZZLE_SPECS[kind];
  const copy = PUZZLE_DISPLAY[kind];
  const [ownSize, setOwnSize] = useState(asked?.size ?? spec.defaultSize);
  // A size another language had and this one has not (kana stops at five) is this one's usual size, until one it has is chosen.
  const size = sized?.size ?? (spec.sizes.includes(ownSize) ? ownSize : spec.defaultSize);
  const [chosenLevel, setLevel] = useState<PuzzleLevel>(asked?.level ?? spec.defaultLevel);
  /* The level asked for, unless this size cannot be made at it (a 4×4 Hidden
     Stones is easy only): then the first it can, and the choice comes back
     when a size that has it is chosen again. */
  const sizeLevels = levelsFor(kind, size);
  const level = sizeLevels.includes(chosenLevel) ? chosenLevel : sizeLevels[0]!;
  const [checks, setChecks] = useState<number | null>(asked?.checks ?? null);
  // Hint, off unless chosen: see `useHints`. Not carried into a race, which allows none.
  const [hints, setHints] = useState(asked?.hints ?? false);
  // Gomoji's Strict, off unless chosen, at any level; like Hint, not carried into a race.
  const [strict, setStrict] = useState(asked?.strict ?? false);
  // Gomoji's Head start, off unless chosen, easy only; like Strict, not carried into a race.
  const [headStart, setHeadStart] = useState(asked?.headStart ?? false);
  // A Gomoji's Futago, two words at once (`futago.ts`), off unless chosen; unlike Strict it is carried into a race, whose seed says it.
  const [words, setWords] = useState<WordCount>(asked?.words ?? 1);
  // Only a word puzzle hides several words; every other kind is asked for as one.
  const count: WordCount = spec.wordGrid === undefined ? 1 : words;
  /*
   * How a Gomoji's one word is played: found, its Nige (`dodge.ts`) or its
   * Sakasa (`backwards.ts`), found unless chosen. One word only, so choosing
   * either is choosing one word, and two or four is choosing it off; unlike
   * Strict, it is carried into a race, whose seed says it.
   */
  const [way, setWay] = useState<GomojiWay>(asked?.dodge === true ? "dodge" : asked?.backwards === true ? "backwards" : "find");
  const played: GomojiWay = offersDodge(kind) && count === 1 ? way : "find";
  const dodging = played === "dodge";
  const turned = played === "backwards";
  // The countdown (`PuzzleClockChips`), none unless chosen; like Strict, not carried into a race.
  const [clock, setClock] = useState<PuzzleClock>(asked?.clock ?? "none");
  const kumimoji = useKumimojiChoice(asked, size, kind === "kumimoji");
  // Solitaire's kind of deal (in the address) and how the score is kept (in this browser): `SolitaireSetUpOptions`.
  const [anyDeal, setAnyDeal] = useState(asked?.anyDeal === true);
  const [scoring, setScoring] = useSolitaireScoring();
  const mahjong = useMahjongChoice(asked);
  const suido = useSuidoChoice(asked);
  const { language, gameLength, doubleSet, diagonals } = kumimoji;
  // How many play is Kumimoji's choice or Mahjong's; the flowers' rule is Mahjong's alone.
  const players = kind === "mahjong" ? mahjong.players : kumimoji.players;
  const bonus = kind === "mahjong" ? mahjong.bonus : undefined;
  // Suido's kind of board is in the address until a seed says it; every other puzzle has none to say.
  const pipes = kind === "suido" ? suido.pipes : undefined;
  /*
   * WHAT IS CHOSEN IS IN THE ADDRESS, so a reload opens on it. John,
   * 2026-09-26: "selected Board Size is not preserved on reload" — the choice
   * lived only in this component, and a reload began again at the default.
   * The address already said what a set-up opens on (`puzzleAsked`); now each
   * choice writes it back, with the browser's own `replaceState` — no request,
   * no render on the server, and no new entry in the history for Back to walk
   * through. The first render writes nothing: an address nobody changed stays
   * as it was typed.
   */
  const shownSize = sized === undefined ? size : null;
  const query = puzzleQuery({ size: shownSize ?? spec.defaultSize, level, seed: null, checks, hints, strict, headStart: headStart && offersHeadStart(kind, level) && played === "find", words: count, dodge: dodging, backwards: turned, gameLength, language, doubleSet, diagonals, players, clock, bonus, pipes, anyDeal: kind === "solitaire" && anyDeal });
  const opened = useRef(query);
  useEffect(() => {
    if (query === opened.current && window.location.search === "") return;
    // A Gomoji's language and list stay in the address beside the rest (`settingQuery`).
    const here = joinQuery(query, settingQuery(kind));
    if (window.location.search !== here) window.history.replaceState(window.history.state, "", `${window.location.pathname}${here}`);
  }, [query, kind]);
  const { style, setStyle } = useWordStyle();
  /* Another language or list on the game's own set-up: its address, with the size, level and the rest carried over where it has them. */
  const openSetting = (next: PuzzleKind) => {
    const nextSpec = PUZZLE_SPECS[next];
    const carried = puzzleQuery({ size: nextSpec.sizes.includes(size) ? size : nextSpec.defaultSize, level, seed: null, checks, hints, strict, headStart: headStart && offersHeadStart(next, level), words: count, clock });
    router.replace(joinQuery(setUpPath(next), carried), { scroll: false });
  };
  const [racing, setRacing] = useState<"" | "making" | string>("");
  // The board's colour, chosen under the preview and kept on the account, as on a game's set-up (`useFeltChoice`).
  const { felt, chooseFelt } = useFeltChoice(appearance);

  /*
   * A race: this browser makes the puzzle, posts it whole, and the site
   * answers with the race's address — the host is taken there, where the
   * guest's seat link waits to be sent. Nothing is generated on a server.
   */
  const race = async () => {
    setRacing("making");
    try {
      await preparePuzzle(kind, size, language);
      // A race is on a deal both seats can win: a Solitaire's is always a winnable one, whatever is chosen for playing alone.
      const made = generatePuzzle(kind, size, level, kind === "solitaire" ? freshSolitaireSeed(false) : kind === "mahjong" ? freshMahjongSeed(mahjong.bonus) : kind === "suido" ? freshSuidoSeed(suido.pipes) : dodging ? freshDodgeSeed() : turned ? freshBackwardsSeed() : freshSeedOf(count), { gameLength, language, doubleSet, diagonals });
      const answered = await fetch("/api/puzzles/races", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, size, level, seed: made.seed, givens: made.givens, solution: made.solution, checksAllowed: checks, gameLength, language, doubleSet, diagonals }),
      });
      const body = (await answered.json().catch(() => null)) as { at?: string; error?: string } | null;
      if (!answered.ok || body?.at === undefined) {
        setRacing(body?.error ?? "The site could not make the race.");
        return;
      }
      router.push(body.at);
    } catch {
      setRacing("The site could not be reached.");
    }
  };

  return (
    // Unframed inside the set-up screen's own panel, which already is one: a box in a box is what the page-shape rules forbid.
    <section className={`${framed ? PANEL_CLASS : ""} flex flex-col gap-5`} data-testid="puzzle-set-up" {...readyMark(hydrated)}>
      {/*
        THE BOARD AND ITS SIZES SIDE BY SIDE, as a game's set-up draws them
        (`GameAndBoardChooser`): the live preview at the size and level chosen,
        and, where the puzzle is drawn on the board itself, its colours under
        it. John, 2026-09-25: "we aren't showing the Preview Board. Show the
        Preview Board too. And the Board colour options."
      */}
      {sized === undefined ? (
        <PuzzleBoardAndSizes kind={kind} size={size} onSize={setOwnSize} level={level} appearance={{ ...appearance, felt }} onFelt={chooseFelt} words={count} />
      ) : null}

      {/*
        THE PUZZLE'S OWN SETTINGS, UNDER A HEADING, BELOW THE CHOICE OF PUZZLE —
        where a game's opponent and rules are. John, 2026-09-24: "Numbers
        introduced Difficulty which takes up space that the others didn't.
        Probably should just go with the rest of customization / settings later
        below." What each size is for goes here too: it was a paragraph under
        the size tiles, and made that column a different height for every puzzle.
      */}
      {/*
        OPTIONS ON THE LEFT, THE TWO PLAY BUTTONS BIG ON THE RIGHT, from a
        tablet up; one column on a phone, the buttons under the options. John,
        2026-09-25: "we have the 3 rows of options... and 2 rows of Play
        buttons... and the RHS is empty. LHS could be options... and RHS could
        be LARGER play buttons." Then, the same day, finding the buttons
        centred in that column rather than starting at its top: "probably best
        to always TOP ALIGN TOP RIGHT the PLAY buttons" — `SET_UP_PLAY_COLUMN`,
        shared rather than a class typed here, so the alignment is decided once.
      */}
      <div className={SET_UP_OPTIONS_AND_PLAY}>
      <SetUpSection title="Options" kanji="設定" testId="puzzle-settings">
        {/* A word game's language and word list come first, with a line of their own in place of the board's (`WordSettingChips`). */}
        {GAME_SETTINGS[kind] === undefined ? (
          <p className="text-xs text-muted" data-testid="puzzle-size-note">
            {copy.board}
          </p>
        ) : (
          <WordSettingChips kind={kind} onKind={onKind ?? openSetting} />
        )}
        {kind === "kumimoji" ? (
          <KumimojiSetUpOptions size={size} hints={hints} setHints={setHints} {...kumimoji} />
        ) : null}
        {kind === "solitaire" ? <SolitaireSetUpOptions anyDeal={anyDeal} setAnyDeal={setAnyDeal} scoring={scoring} setScoring={setScoring} /> : null}
        {kind === "mahjong" ? <MahjongSetUpOptions {...mahjong} /> : null}
        {kind === "suido" ? <SuidoSetUpOptions {...suido} /> : null}
        {/* One level is no choice: its chip is not drawn, and the line under it says what the game is. */}
        {spec.levels.length < 2 ? null : (
        <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap" role="radiogroup" aria-label="Level">
          {spec.levels.map((each) => (
            <button
              key={each}
              type="button"
              role="radio"
              aria-checked={level === each}
              className={`${PICK_WORD_CHIP} ${level === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
              onClick={() => setLevel(each)}
              disabled={!sizeLevels.includes(each)}
              title={sizeLevels.includes(each) ? undefined : spec.cards === true ? `Not offered at ${sizeWord(size, kind)}` : `A ${size}×${size} has no ${PUZZLE_LEVEL_DISPLAY[each].label.toLowerCase()} puzzle to make`}
              data-testid={`puzzle-level-${each}`}
            >
              {PUZZLE_LEVEL_DISPLAY[each].label} <span className="font-mincho opacity-70">{PUZZLE_LEVEL_DISPLAY[each].kanji}</span>
            </button>
          ))}
        </div>
        )}
        <p className={`${spec.wordGrid === undefined ? "" : "min-h-8"} text-xs text-muted`} data-testid="puzzle-level-blurb">
          {levelBlurb(kind, level)}
        </p>
        {/*
          ONE WORD OR TWO: a Gomoji's Futago (`futago.ts`). John, 2026-09-26:
          "a Gomoji mode with two hidden words at once… Use our own name."
        */}
        {spec.wordGrid === undefined ? null : <FutagoChips kind={kind} size={size} level={level} chosen={words} onChoose={(chosen) => { setWords(chosen); if (chosen > 1) setWay("find"); }} />}
        {/*
          FIND THE WORD, CHASE ONE THAT DODGES, OR AVOID IT: a Gomoji's Nige
          (`dodge.ts`) and Sakasa (`backwards.ts`). 2026-09-26: "the word changes
          after every guess but stays true to every colour already shown", and
          "avoid the hidden word as long as you can… give it our own name."
        */}
        {spec.wordGrid === undefined ? null : <PlayWayChips kind={kind} size={size} level={level} offered={offersDodge(kind)} chosen={played} onChoose={(chosen) => { setWay(chosen); if (chosen !== "find") setWords(1); }} />}
        {/*
          STRICT, a choice at every level. John, 2026-09-25: "have an option
          strict mode for Hard where you have to play the Green items on the same
          location like you have now. right now there are no real options for the
          game." It was hard itself until then; now hard is the count of guesses.
        */}
        {spec.strict === true ? (
          <div className="grid grid-cols-3 gap-1.5 pt-1 sm:flex sm:flex-wrap" role="radiogroup" aria-label="Strict">
            {[false, true].map((each) => (
              <button
                key={String(each)}
                type="button"
                role="radio"
                aria-checked={strict === each}
                className={`${PICK_WORD_CHIP} ${strict === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
                onClick={() => setStrict(each)}
                data-testid={`puzzle-strict-${each ? "on" : "off"}`}
              >
                {each ? "Strict" : "Free"} <span className="font-mincho opacity-70">{each ? "厳" : "自"}</span>
              </button>
            ))}
          </div>
        ) : null}
        {spec.strict === true ? (
          <p className="min-h-8 text-xs text-muted" data-testid="puzzle-strict-blurb">
            {strict ? "Every letter found must be played again, a green one in its place." : "Any word may be guessed, whatever the last ones found."}
          </p>
        ) : null}
        {/*
          HEAD START, easy only (`headStart.ts`). John, 2026-09-26: "add another
          game option for easy mode… a random N chars based on word size, will
          already be eliminated for you on the keyboard." Drawn at every level so
          the screen never changes height when the level does; at medium and
          hard its chips are switched off and the line under them says why.
        */}
        {offersHeadStart(kind, "easy") ? (
          <HeadStartChips kind={kind} size={size} level={level} chosen={headStart} onChoose={setHeadStart} words={count} dodge={dodging} backwards={turned} />
        ) : null}
        {/*
          HOW THE GRID IS DRAWN, chosen here as well as under the keyboard.
          John, 2026-09-26: "where is the Reversi / Gomoku / Tiles options in
          our Options (it's only currently in the actual Play page)?" The same
          choice as the play page's (`useWordStyle`): it redraws the preview at
          once and is kept on the account, so the game opens the way it was set.
        */}
        {spec.wordGrid === undefined ? null : (
          <>
            <div className="grid grid-cols-3 gap-1.5 pt-1 sm:flex sm:flex-wrap" role="radiogroup" aria-label="How the grid is drawn" data-testid="puzzle-word-style">
              {WORD_STYLE_LIST.map((each) => (
                <button
                  key={each}
                  type="button"
                  role="radio"
                  aria-checked={style === each}
                  className={`${PICK_WORD_CHIP} ${style === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
                  onClick={() => setStyle(each)}
                  data-testid={`puzzle-word-style-${each}`}
                >
                  {WORD_STYLE_DISPLAY[each].label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted" data-testid="puzzle-word-style-blurb">
              {WORD_STYLE_DISPLAY[style].blurb}
            </p>
          </>
        )}
        {/* A puzzle that answers every move as it is made offers neither Check nor Hint (`PuzzleSpec.helps`). */}
        {spec.helps === false ? null : (
          <>
        {/*
          HOW MANY TIMES CHECK MAY BE PRESSED — see `PUZZLE_CHECK_ALLOWANCES` for
          why running out takes the help away rather than ending the puzzle. A
          race carries it too, the same for both seats.
        */}
        {spec.checks === false ? null : (
        <div className="grid grid-cols-3 gap-1.5 pt-1 sm:flex sm:flex-wrap" role="radiogroup" aria-label="Checks">
          {PUZZLE_CHECK_ALLOWANCES.map((each) => {
            const words = checkAllowanceWords(each);
            return (
              <button
                key={String(each)}
                type="button"
                role="radio"
                aria-checked={checks === each}
                className={`${PICK_WORD_CHIP} ${checks === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
                onClick={() => setChecks(each)}
                data-testid={`puzzle-checks-${each ?? "unlimited"}`}
              >
                {words.label} <span className="font-mincho opacity-70">{words.kanji}</span>
              </button>
            );
          })}
        </div>
        )}
        {/*
          HINT, chosen here or not at all. John, 2026-09-24: "when a user wants a
          HINT button they can add as an option for these games... and when
          pressed, we highlight what's wrong." Off by default; the button is
          always on the puzzle, disabled with its reason when it was not chosen.
        */}
        <div className="grid grid-cols-3 gap-1.5 pt-1 sm:flex sm:flex-wrap" role="radiogroup" aria-label="Hints">
          {[false, true].map((each) => (
            <button
              key={String(each)}
              type="button"
              role="radio"
              aria-checked={hints === each}
              className={`${PICK_WORD_CHIP} ${hints === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
              onClick={() => setHints(each)}
              data-testid={`puzzle-hints-${each ? "on" : "off"}`}
            >
              {each ? "Hints" : "No hints"} <span className="font-mincho opacity-70">{each ? "ヒント有" : "ヒント無"}</span>
            </button>
          ))}
        </div>
          </>
        )}
        <PuzzleClockChips kind={kind} chosen={clock} onChoose={setClock} />
      </SetUpSection>

      {/*
        TWO BIG BUTTONS, AND NOTHING TO READ. John, 2026-09-25, at the two
        buttons this had — "Solve a 10×10…" and, under a heading of its own
        with a paragraph, "Race a friend at 10×10": "Confused: are both these
        buttons just a Play button?… should be Play Alone and Play a Friend…
        we waste so much space with text… these buttons could be side by side
        or above one another. big buttons". Both start the puzzle; the button
        is the choice of who you play. Then, the same day, at a game's set-up
        saying Begin beside these: "it should always be PLAY and START" — so
        they read Start alone and Start with a friend (`START_PRESS`).
      */}
      <div className={SET_UP_PLAY_COLUMN} data-testid="puzzle-play-buttons">
        <SetUpResume href={resumeHref} />
        {kind === "kumimoji" ? <KumimojiPartyResume /> : null}
        {kind === "mahjong" ? <MahjongTableResume /> : null}
        <Link
          href={joinQuery(playPath(kind), puzzleQuery({ size, level, seed: null, checks, hints, strict, headStart: headStart && offersHeadStart(kind, level) && played === "find", words: count, dodge: dodging, backwards: turned, gameLength, language, doubleSet, diagonals, players, clock, bonus, pipes, anyDeal: kind === "solitaire" && anyDeal }))}
          className={PLAY_BUTTON}
          data-testid="puzzle-solve"
        >
          {/* Start, as every set-up screen's press says it (`START_PRESS`); Play is the word for the way here. */}
          <PressLabel {...START_PRESS.alone} />
        </Link>
        <button
          type="button"
          className={PLAY_BUTTON}
          onClick={race}
          disabled={!hasAccount || racing === "making" || players > 1}
          title={players > 1 ? "Pass and play is on this device; a race is between two members on two." : hasAccount ? undefined : "A race is between two members; this session has no account yet."}
          data-testid="puzzle-race"
        >
          {racing === "making" ? (
            START_PRESS.starting
          ) : (
            <PressLabel {...START_PRESS.friend} />
          )}
        </button>
      {!hasAccount ? (
        <p className="text-xs text-muted" data-testid="puzzle-race-needs-account">
          Starting with a friend needs an account.
        </p>
      ) : null}
      {racing !== "" && racing !== "making" ? <span className="text-sm text-shu">{racing}</span> : null}
      </div>
      </div>
    </section>
  );
}

// The preview and its sizes live beside this in their own file; kept importable from here for the set-up screen that hosts a puzzle (`PuzzleHere`).
export { PuzzleBoardAndSizes, PuzzleSizes };
