"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";
import { PANEL_CLASS, PLAY_BUTTON } from "@/components/ui/ui.constants";
import { playPath } from "@/lib/gomoku/slugs";
import { generatePuzzle } from "@/lib/puzzles/generate";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import { freshSeed } from "@/lib/puzzles/random";
import { PUZZLE_CHECK_ALLOWANCES, PUZZLE_DISPLAY, PUZZLE_LEVEL_DISPLAY, PUZZLE_SIZE_NAMES, PUZZLE_SPECS, checkAllowanceWords } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import { BoardPicker } from "@/components/live/BoardPicker";
import { SetUpSection } from "@/components/live/SetUpSection";


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
}) {
  const hydrated = useHydrated();
  const router = useRouter();
  const spec = PUZZLE_SPECS[kind];
  const copy = PUZZLE_DISPLAY[kind];
  const [ownSize, setOwnSize] = useState(spec.defaultSize);
  const size = sized?.size ?? ownSize;
  const [level, setLevel] = useState<PuzzleLevel>(spec.defaultLevel);
  const [checks, setChecks] = useState<number | null>(null);
  // Hint, off unless chosen: see `useHints`. Not carried into a race, which allows none.
  const [hints, setHints] = useState(false);
  const [racing, setRacing] = useState<"" | "making" | string>("");

  /*
   * A race: this browser makes the puzzle, posts it whole, and the site
   * answers with the race's address — the host is taken there, where the
   * guest's seat link waits to be sent. Nothing is generated on a server.
   */
  const race = async () => {
    setRacing("making");
    try {
      const made = generatePuzzle(kind, size, level, freshSeed());
      const answered = await fetch("/api/puzzles/races", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, size, level, seed: made.seed, givens: made.givens, solution: made.solution, checksAllowed: checks }),
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
      {sized === undefined ? <PuzzleSizes kind={kind} size={size} onSize={setOwnSize} /> : null}

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
        be LARGER play buttons."
      */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_18rem] md:items-stretch">
      <SetUpSection title="Options" kanji="設定" testId="puzzle-settings">
        <p className="text-xs text-muted" data-testid="puzzle-size-note">
          {copy.board}
        </p>
        <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap" role="radiogroup" aria-label="Level">
          {spec.levels.map((each) => (
            <button
              key={each}
              type="button"
              role="radio"
              aria-checked={level === each}
              className={`${PICK_WORD_CHIP} ${level === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
              onClick={() => setLevel(each)}
              data-testid={`puzzle-level-${each}`}
            >
              {PUZZLE_LEVEL_DISPLAY[each].label} <span className="font-mincho opacity-70">{PUZZLE_LEVEL_DISPLAY[each].kanji}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted" data-testid="puzzle-level-blurb">
          {PUZZLE_LEVEL_DISPLAY[level].blurb}
        </p>
        {/* A puzzle that answers every move as it is made offers neither Check nor Hint (`PuzzleSpec.helps`). */}
        {spec.helps === false ? null : (
          <>
        {/*
          HOW MANY TIMES CHECK MAY BE PRESSED — see `PUZZLE_CHECK_ALLOWANCES` for
          why running out takes the help away rather than ending the puzzle. A
          race carries it too, the same for both seats.
        */}
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
      </SetUpSection>

      {/*
        TWO BIG BUTTONS, AND NOTHING TO READ. John, 2026-09-25, at the two
        buttons this had — "Solve a 10×10…" and, under a heading of its own
        with a paragraph, "Race a friend at 10×10": "Confused: are both these
        buttons just a Play button?… should be Play Alone and Play a Friend…
        we waste so much space with text… these buttons could be side by side
        or above one another. big buttons". Both start the puzzle; the button
        is the choice of who you play.
      */}
      <div className="flex flex-col justify-center gap-3" data-testid="puzzle-play-buttons">
        <Link
          href={`${playPath(kind)}${puzzleQuery({ size, level, seed: null, checks, hints })}`}
          className={PLAY_BUTTON}
          data-testid="puzzle-solve"
        >
          {/* One kanji each beside the words, as every label here pairs them (John, 2026-09-25: "use SINGLE kanji"). */}
          Play alone <span className="font-mincho text-base font-normal opacity-70">独</span> →
        </Link>
        <button
          type="button"
          className={PLAY_BUTTON}
          onClick={race}
          disabled={!hasAccount || racing === "making"}
          title={hasAccount ? undefined : "A race is between two members; this session has no account yet."}
          data-testid="puzzle-race"
        >
          {racing === "making" ? (
            "Making the race…"
          ) : (
            <>
              Play a friend <span className="font-mincho text-base font-normal opacity-70">友</span> →
            </>
          )}
        </button>
      {!hasAccount ? (
        <p className="text-xs text-muted" data-testid="puzzle-race-needs-account">
          Playing a friend needs an account.
        </p>
      ) : null}
      {racing !== "" && racing !== "making" ? <span className="text-sm text-shu">{racing}</span> : null}
      </div>
      </div>
    </section>
  );
}

/**
 * A puzzle's sizes, as the tiles every board size on this site is chosen
 * from: `BoardPicker`, with the big number in the board's own lattice
 * (`BoardSizeMark`), the chosen mark, and a name for what the size is for.
 *
 * John, 2026-09-24, on these tiles as they first shipped — a picture of their
 * own with "4×4" printed under it: "Why does those size boards look different
 * than every other single size board we have ever created." They were drawn by
 * a second component the puzzles brought with them; `boardSizeMark.coverage`
 * now refuses a size picture that is not `BoardSizeMark`. What each size is
 * for is said in the settings below (`PuzzleSetUp`), not under the tiles.
 */
export function PuzzleSizes({ kind, size, onSize, beside = false }: { kind: PuzzleKind; size: number; onSize: (size: number) => void; beside?: boolean }) {
  return (
    <BoardPicker value={size} sizes={PUZZLE_SPECS[kind].offered} onChange={onSize} names={PUZZLE_SIZE_NAMES[kind]} beside={beside} />
  );
}
