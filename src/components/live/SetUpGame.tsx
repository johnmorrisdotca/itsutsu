"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { botsFor } from "@/lib/bots/bots.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import type { WordStyle } from "@/lib/puzzles/gomoji/wordStyles";
import type { Opponent } from "@/lib/social/opponents";
import type { SeatOnBoard } from "@/components/mine/startGame.types";
import { draftRatingRefusal } from "@/lib/rating/handicapRefusal";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { HandicapChoice } from "./HandicapChoice";
import { HeadStartChoice } from "./HeadStartChoice";
import { OpponentChoice } from "./OpponentChoice";
import { ANYONE, RANDOM_COMPUTER, againstFromAddress, idIn, valueFor, whoIs } from "./opponentOptions";
import { BeginBar } from "./BeginBar";
import { BoardPreview } from "./BoardPreview";
import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import { useFeltChoice } from "@/components/board/useFeltChoice";
import { RULES_CHOOSERS, RulesForm } from "./RulesForm";
import { describeRules } from "./rulesSummary";
import { applyRulesChange, type RulesDraft } from "./rulesDraft";
import { matchSeat } from "./seatMatch";
import { useSetUpPress } from "./useSetUpPress";
import { readSetUpAsked } from "./setUpAsked";
import { keptBoardChosen, keptDraft, keptParams, queryRecord } from "./setUpKept";
import { SetUpNotices } from "./SetUpNotices";
import { PuzzleHere } from "./PuzzleHere";
import { SET_UP_SUMMARY } from "./picker.constants";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";
import { seatsFor, stillARematch } from "./setUpStart";
import { setUpBegin } from "./setUpBegin";
import { foldedWords } from "./setUpFolded";
import type { KeptBase, KeptDefaults, SetUpAgain, SetUpFork, SetUpOpponent } from "./setUp.types";
import { useRematchHeading } from "./useRematchHeading";
import { useKeptAddress } from "./useKeptAddress";
import { COLOUR_CHOICES, colourFromAddress, colourIsChosen, gamesFromAddress, type ColourChoice } from "./colourChoice";
import type { MatchSize } from "@/lib/history/liveMatch";
import { SET_UP_PARAMS } from "@/lib/gomoku/slugs";
import type { SetUpParam } from "./setUp.types";

/**
 * SETTLING A GAME BEFORE THERE IS A GAME — EVERY GAME, FROM EVERYWHERE.
 *
 * Every rule here used to be chosen on a board that already existed: the game
 * was created the moment you asked for one, and you landed on something that
 * looked like a live match with its settings still open. That is where a whole
 * family of trouble came from — a board that is not really a board, an address
 * that stops matching its own game when the rules move under it, and a posted
 * seat somebody could still change out from under whoever answered it.
 *
 * So nothing exists until the button at the bottom, and not even then: Continue
 * carries the settled draft to the doorstep, which states it and creates it on a
 * press of its own.
 *
 * Every way of starting a game arrives HERE, with whatever it already knows
 * filled in:
 *
 *  - THE OPPONENT ONLY — a player's page, a challenge, the computer players
 *    tab. They are named and selected; the game and the rules are the choice.
 *  - THE OPPONENT, THE GAME AND THE RULES — a rematch. Everything is filled in
 *    and the screen reads as a confirmation: one press accepts it, and every
 *    field is still a field. That is John's "I want to definitely play Bob at
 *    Reversi, but I want to try that variant, and change some rules."
 *  - AND A POSITION — a fork. The board, the game and the opening come with the
 *    position and are not offered, because a Reversi position is not a Halma
 *    one; the clock and whether it counts are this game's own.
 *
 * EVERY CHOICE IS ON THE SCREEN, under a heading, and none of it folds. John,
 * with the opponent and every rule behind one grey line: "Why can't I choose
 * someone in this Halma page? … so very hard to see..." — see `RulesForm`'s
 * `sections`. And every choice is in the address, so a reload, Back and a copied
 * link keep it — see `setUpKept.ts`.
 */
export function SetUpGame({
  defaults,
  game = null,
  asPlayed = null,
  opponents,
  seats = [],
  signedIn,
  canAsk,
  chooseGame = false,
  opponent = null,
  again = null,
  fork = null,
  carry = {},
  problem = null,
  appearance = DEFAULT_APPEARANCE,
  wordStyle = null,
}: {
  /** How the reader last drew a Gomoji grid, for a puzzle chosen here (`PuzzleHere`). */
  wordStyle?: WordStyle | null;
  /** The reader's board, so the preview is dressed as their game will be and a Reversi's felt can be chosen. */
  appearance?: Appearance;
  /** The member's standing board and clock: what silence opens a game at. */
  defaults: KeptDefaults;
  /** The game the path names, at /games/<game>/new; null where the game is a choice. */
  game?: RuleVariant | null;
  /**
   * The game this was filled in from, as it was PLAYED — null where nothing was.
   *
   * Only a rematch and a fork have one, and it is what lets this screen notice it
   * has been changed: the address can carry a whole draft, so what the form opens
   * with and what the old game was are two facts.
   */
  asPlayed?: RulesDraft | null;
  opponents: Opponent[];
  /**
   * The seats already posted, so asking for a game somebody is already asking
   * for sits down at theirs instead of posting a second one beside it.
   */
  seats?: SeatOnBoard[];
  /** Holding a session — `Reader.signedIn`: enough to post a seat for anyone and Continue. */
  signedIn: boolean;
  /**
   * An account — `Reader.hasAccount`: what naming a person or a program needs,
   * because that is a challenge and the route refuses one from a caller with no
   * address. An invite holder has the session and not this.
   */
  canAsk: boolean;
  /**
   * Offer the game itself as the first choice: set at /games/new, where nothing
   * has been chosen yet, and left alone at /games/<game>/new, where the address
   * has already said which game this is.
   */
  chooseGame?: boolean;
  /** Somebody the address named. Selected, and offered even if the list would not have them. */
  opponent?: SetUpOpponent | null;
  /** A finished game this repeats, and the colour the asker takes in it. */
  again?: SetUpAgain | null;
  /** A position this carries forward, and how far in. */
  fork?: SetUpFork | null;
  /**
   * The parts of a carried game this screen has no control for — the line
   * length, the seed, who opens, the draw limit. Carried into the request and
   * never asked, which is what lets this screen write the game itself rather
   * than hand a draft to a page that knows more than it does.
   */
  carry?: Record<string, unknown>;
  /** Why the address could not be honoured, when it could not. */
  problem?: string | null;
}) {
  /*
   * EVERY CHOICE STARTS FROM THE ADDRESS AND IS WRITTEN BACK TO IT. John: "We
   * need Memory when viewing Gaming pages... a refresh loses the Checkers
   * selections". Read here rather than taken from props, because a Back into
   * this screen is answered from the router's cache, which holds the props of
   * its first render. See `setUpKept.ts`. The board the address settled seeds
   * the same state a click on the board picker writes: `?board=19` is a choice.
   */
  const query = useSearchParams();
  /*
   * THE PLAYER THIS SCREEN WAS OPENED FOR. On a rematch that is the player from
   * last time, whoever the address has chosen since: they are the silence the
   * address leaves out, and the tile somebody may want to go back to. `opponent`
   * is who the address has this game against NOW, which on a rematch may be
   * somebody else — see `stillARematch`.
   */
  const named = again !== null ? again.opponent : opponent;
  const base: KeptBase = {
    asPlayed,
    forked: fork !== null,
    defaults,
    pathVariant: game,
    silentOpponent: again !== null ? again.opponent.id : null,
  };
  const [arrived] = useState(() => {
    const asked = readSetUpAsked(queryRecord(query));
    const draft = keptDraft(base, asked);
    return {
      draft,
      board: keptBoardChosen(base, asked, draft),
      against: againstFromAddress(fork === null ? asked.against : null, {
        computers: botsFor(draft.variant as RuleVariant),
        opponents,
        named,
        absent: (again !== null || fork !== null) && named !== null ? valueFor(named) : ANYONE,
      }),
    };
  });
  const [rules, setRules] = useState<RulesDraft>(arrived.draft);
  const [against, setAgainst] = useState<string>(arrived.against);
  /*
   * The seat the asker takes. Black unless the address or a press says
   * otherwise — see `colourChoice.ts` for the three answers and where the
   * question is asked at all.
   */
  const [colour, setColour] = useState<ColourChoice>(colourFromAddress(query.get(SET_UP_PARAMS.colour)));
  /* How many games at once — a match, offered wherever the colour is; see `liveMatch.ts`. */
  const [games, setGames] = useState<MatchSize>(gamesFromAddress(query.get(SET_UP_PARAMS.games)));
  /*
   * Pressed, and on the way. There is nothing here that can fail — the request
   * that could lives on the doorstep — so this screen has no error to show, only
   * a button that stops being pressable while the next page arrives.
   */
  const [busy, setBusy] = useState(false);
  // A Reversi board's felt, chosen under the preview and kept on the account (`useFeltChoice`).
  const { felt, chooseFelt } = useFeltChoice(appearance);
  // A puzzle chosen from the row of families turns the whole screen to it — see `PuzzleHere`.
  const [puzzle, setPuzzle] = useState<PuzzleKind | null>(null);
  /*
   * Says when the browser has taken this over. These controls are server-rendered,
   * so they are real controls before React has attached anything to them, and a
   * choice made in that window is simply dropped.
   */
  const ready = useHydrated();

  /*
   * The players offered at this game, and the one that has been chosen. Looked
   * up in that list rather than in all of them, so a specialist chosen before
   * the game was changed does not stay chosen at a game it does not play.
   */
  const computers = botsFor(rules.variant as RuleVariant);
  const chosenId = idIn(against);
  const chosen = chosenId === null ? null : whoIs(chosenId, computers, opponents, named);
  /* A computer player to be drawn at random: nobody is chosen, and the seat is not posted. */
  const random = against === RANDOM_COMPUTER;
  /*
   * Somebody the chooser is holding and this game will not have — in practice a
   * specialist program, after the game was changed to one it does not play.
   */
  const dropped =
    chosenId !== null && chosen === null && named !== null && named.id === chosenId
      ? named.name
      : null;

  /*
   * The board somebody chose, held here rather than in the draft: the draft has
   * to stay a board the current game can actually be played on, and this has to
   * survive a game that cannot use it — see `matchSeat`. It starts at whatever
   * the address settled, so a board on a link is a choice rather than a default.
   */
  const [boardChosen, setBoardChosen] = useState<number | null>(arrived.board);

  /*
   * Whether somebody is already asking for exactly this, and which board to show
   * — one rule, in one module, with its own tests: `matchSeat`. A rematch and a
   * fork are never matched, because they are about one particular person.
   */
  const { settled, waiting } = matchSeat({
    rules,
    seats,
    posting: against === ANYONE,
    boardChosen,
    matchable: again === null && fork === null,
  });

  /* Every choice into the address as it is made, without asking the server — see `useKeptAddress`. */
  useKeptAddress([
    ...keptParams(base, { rules, boardChosen, against: random ? RANDOM_COMPUTER : chosenId, chooseGame }),
    // The seat chosen, only when it is not the default — black says nothing, as the route's own rule.
    ...(colour === COLOUR_CHOICES.black ? [] : [[SET_UP_PARAMS.colour, colour] as SetUpParam]),
    ...(games === 1 ? [] : [[SET_UP_PARAMS.games, String(games)] as SetUpParam]),
  ]);

  /*
   * WHETHER THIS IS STILL A REPEAT of the game it was filled in from. A rematch is
   * only a rematch while the form still describes that game AGAINST THAT PLAYER;
   * `stillARematch` is the same decision `creationFor` makes on the doorstep.
   * Compared against `asPlayed`, since the address may already have carried a
   * change in. A program still to be drawn at random is nobody yet, so it is never
   * the player from last time.
   */
  const opponentNow = random ? null : chosen;
  const sameOpponent = again !== null && opponentNow !== null && opponentNow.id === again.opponent.id;
  const repeat = stillARematch({ rules: settled, source: asPlayed, opponent: opponentNow, again });

  /* And the heading above says the same, without a reload — `useRematchHeading`. */
  useRematchHeading({ again, repeat, opponent: opponentNow });

  /*
   * WHETHER THE GAME THIS BUTTON LEADS TO COULD EVER COUNT, read from `seatsFor`
   * — the function the doorstep asks — and `draftRatingRefusal`, which it asks too,
   * so the two pages cannot disagree about one press. True of two shapes: a fork
   * with nobody to hand the second seat to, and a handicap on either colour.
   */
  const refused = draftRatingRefusal({
    screen: seatsFor({ again, fork }).screen,
    handicap: settled.handicap,
    headStart: settled.headStart,
  });

  /*
   * WHAT THE BUTTON WILL DO, and what it will seat — one module, because it is
   * one question: what is this screen about to make? See `setUpBegin.ts`,
   * which also holds why the doorstep no longer stands between this screen and
   * the board.
   */
  const { begin, sitting } = setUpBegin({
    settled,
    asPlayed,
    /*
     * A FORK IS AGAINST WHOEVER WAS IN THE POSITION, and this screen offers no
     * chooser for it — so the person to name in the seating sentence is the one
     * the address arrived with, not the one nobody was asked for. `setUpBegin`
     * still sends no opponent with a fork's request: the route reads them off
     * the seats of the game being forked, which knows better than this screen.
     */
    opponent: fork !== null ? opponent : opponentNow,
    again,
    fork,
    carry,
    random,
    waiting: waiting === undefined ? undefined : { id: waiting.id, who: waiting.who },
    colour,
    games,
  });
  /* Whether the colour is the asker's to choose in THIS game — the control shows only where it is. */
  const colourChosen = colourIsChosen({
    named: random || opponentNow !== null,
    opening: settled.opening,
    again: again !== null,
    forked: fork !== null,
  });

  /*
   * PRESSING IT — the memory of a game this address has already made, what
   * went wrong if anything did, and the press itself. `useSetUpPress`.
   */
  const { made, trouble, press, forget } = useSetUpPress({
    key: `set-up:${game ?? "any"}:${query.toString()}`,
    begin,
    variant: settled.variant,
    onBusy: setBusy,
  });

  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="set-up-game" {...readyMark(ready)}>
      {/* No heading of its own: the page's "Set up a game" is right above it (John, 2026-09-25: "we repeat 'Set up the Game' twice"). */}
      <SetUpNotices
        problem={problem}
        again={again}
        repeat={repeat}
        sameOpponent={sameOpponent}
        chosenName={chosen?.name ?? null}
        fork={fork}
        opponent={opponent}
        dropped={dropped}
        variant={settled.variant}
      />

      {/*
        What it will be, in the same words the rules panel uses once it is a
        game — so what somebody agreed to and what they are playing read the same.
      */}
      {puzzle !== null ? (
        <PuzzleHere
          puzzle={puzzle}
          onPuzzle={setPuzzle}
          variant={settled.variant}
          onGame={(variant) => setRules(applyRulesChange(settled, { variant }))}
          disabled={busy}
          hasAccount={canAsk}
          appearance={{ ...appearance, felt }}
          onFelt={chooseFelt}
          wordStyle={wordStyle}
        />
      ) : (
      <>
      <p className={SET_UP_SUMMARY} data-testid="set-up-summary">
        {describeRules(settled)}
      </p>

      {/*
        The board itself is drawn INSIDE the chooser now, between the games and
        the boards they are played on — see `GameAndBoardChooser`, which is
        handed it as `preview` below.

        It used to sit here, above everything, because IYT has shown a sample
        board on its new-game screen since 1998 and this site showed only a name
        and a small mark. That put the picture first and the sizes a screen
        below it, so choosing a board meant scrolling away from the board. John,
        2026-09-22: "you can see the board and sizes side by side, rather than
        like now, where the board sizes are lower and almost off screen… I also
        think the Game list might be top row with the Board below it."

        The board is still the first thing on the screen that is a board; what
        comes above it is the row of games, which is what changes it. You choose
        the game, then look at what you chose. It redraws as the choices around
        it change, exactly as before.
      */}
      <div className="mt-1 flex flex-col gap-3 border-t border-rule pt-3">
        <RulesForm
          value={settled}
          onChange={setRules}
          disabled={busy}
          showOpen={false}
          showVariant={chooseGame}
          variantLabel="Game"
          chooser={RULES_CHOOSERS.pictures}
          positionFixed={fork !== null}
          preview={<BoardPreview rules={settled} appearance={{ ...appearance, felt }} onFelt={chooseFelt} position={fork?.position ?? null} />}
          refused={refused}
          sections={{
            /*
              A fork is against whoever was in the game it came from — the route
              reads that off the seats — so there is nothing to ask, and asking
              would be a control whose answer is discarded. The notice above
              names them.
            */
            opponent:
              fork === null ? (
                <OpponentChoice
                  value={against}
                  onChange={setAgainst}
                  variant={settled.variant}
                  opponents={opponents}
                  named={named}
                  disabled={busy}
                  signedIn={signedIn}
                  canAsk={canAsk}
                />
              ) : null,
            /*
              A HANDICAP: John, "you're playing someone who's not very strong —
              you want to, in the settings page, give yourself a handicap to help
              them out." Not on a fork, whose position was played under whatever
              handicap its game had. The head start for the weaker player — free
              turns, and the game's own traditional head start — comes first in
              the group, above the harder rules for the stronger one.
            */
            handicap:
              fork === null ? (
                <div className="flex flex-col gap-4">
                  <HeadStartChoice
                    value={settled.headStart}
                    variant={settled.variant}
                    size={settled.size}
                    disabled={busy}
                    onChange={(headStart) => setRules(applyRulesChange(settled, { headStart }))}
                  />
                  <HandicapChoice
                    value={settled.handicap}
                    variant={settled.variant}
                    disabled={busy}
                    onChange={(handicap) => setRules({ ...settled, handicap })}
                  />
                </div>
              ) : null,
          }}
          /*
           * WHAT EACH FOLDED GROUP SAYS WHILE IT IS SHUT. These are the very
           * words that used to sit over the Continue button as a recap — the
           * same call, the same rendering — moved onto the rows they describe.
           *
           * That is the repetition John named on 2026-09-21: "don't repeat
           * info too much". The screen was saying "Free opening · Resigning
           * allowed · No clock · Rated" in a line at the bottom while every
           * one of those controls stood open six inches above it, and then
           * the doorstep said it a third time. Said once, on the row that
           * holds the control, it is a summary rather than an echo.
           */
          folded={foldedWords({ settled, refused, opponent: fork !== null ? opponent : chosen, fork, random })}
          onSizeChosen={setBoardChosen}
          onPuzzle={chooseGame ? setPuzzle : undefined}
        />
      </div>

      <BeginBar
        sitting={sitting}
        colour={colourChosen ? { value: colour, onChange: setColour } : null}
        games={colourChosen ? { value: games, onChange: setGames } : null}
        made={made}
        trouble={trouble}
        press={press}
        forget={forget}
        busy={busy}
        signedIn={signedIn}
        canAsk={canAsk}
        named={against !== ANYONE}
        waiting={waiting}
      />
      </>
      )}
    </section>
  );
}
