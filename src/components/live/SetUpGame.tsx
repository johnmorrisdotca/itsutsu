"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { botsFor } from "@/lib/bots/bots.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { beginLink } from "./setUpAddress";
import { variantLabel } from "@/lib/gomoku/variants.constants";
import { START_COPY } from "@/components/mine/mine.constants";
import type { Opponent } from "@/lib/social/opponents";
import type { SeatOnBoard } from "@/components/mine/startGame.types";
import { RATING_REFUSALS } from "@/lib/rating/rateable.constants";
import { Button, SectionTitle } from "@/components/ui/Controls";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { HandicapChoice } from "./HandicapChoice";
import { ANYONE, OpponentChoice, idIn, valueFor } from "./OpponentChoice";
import { RULES_CHOOSERS, RulesForm } from "./RulesForm";
import { SET_UP_COPY } from "./live.constants";
import { describeRules } from "./rulesSummary";
import type { RulesDraft } from "./rulesDraft";
import type { SetUpAgain, SetUpFork, SetUpOpponent } from "./setUp.types";
import { matchSeat } from "./seatMatch";
import { sameRules, seatsFor } from "./setUpStart";
import { foldedWords } from "./setUpWords";

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
 * So nothing exists until the button at the bottom. Until then this is a form
 * and a sentence describing what it will make, and the game is created once,
 * settled, with the rules it will be played under.
 *
 * WHAT CHANGED SECOND, AND IS THE POINT OF THE PRESENT ROUND: this screen was
 * built and then reached from exactly one place. A player's page, the players
 * list, the computer players tab, a rematch, a fork and the lobby sentence all
 * went on creating a game the instant they were pressed — so John, looking at a
 * computer player's page, pressed Play and was in a game of Gomoku he had not
 * asked for. His words: "you're playing Gomoku with an accidental click (or
 * just clicking around). I keep telling you we need to take the user to the
 * Game settings page, the page BEFORE the game starts."
 *
 * Now every one of them arrives HERE, with whatever it already knows filled in:
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
 * None of that is held in a cookie or a store. It arrives in the query, so a
 * pre-filled screen is a plain address — see `SET_UP_PARAMS`.
 */
export function SetUpGame({
  initial,
  asPlayed = null,
  boardChosen: boardSettled = null,
  opponents,
  seats = [],
  signedIn,
  chooseGame = false,
  opponent = null,
  again = null,
  fork = null,
  problem = null,
}: {
  initial: RulesDraft;
  /**
   * The game this was filled in from, as it was PLAYED — null where nothing was.
   *
   * Only a rematch has one, and it is what lets this screen notice it has been
   * changed. Not the same thing as `initial`: the address can now carry a whole
   * draft, so what the form opens with and what the old game was are two facts,
   * and comparing a changed draft against itself would always say "unchanged".
   */
  asPlayed?: RulesDraft | null;
  /**
   * The board the ADDRESS settled, or null where the draft's board is only the
   * default this screen opened at. See `SetUpFrom.boardChosen`.
   *
   * It seeds the same state a click on the board picker writes, because it is
   * the same fact arriving by a different door: `?board=19` is a choice
   * somebody made, in a link they followed, and `matchSeat` already knows that
   * a chosen board does not follow a seat on the noticeboard.
   */
  boardChosen?: number | null;
  opponents: Opponent[];
  /**
   * The seats already posted, so asking for a game somebody is already asking
   * for sits down at theirs instead of posting a second one beside it.
   *
   * This came off the one-line sentence that used to start games, whose own
   * comment put it best: auto-match and posting a seat are the same wish said
   * twice, and the only difference is whether somebody is already asking.
   */
  seats?: SeatOnBoard[];
  signedIn: boolean;
  /**
   * Offer the game itself as the first choice.
   *
   * Set at /games/new, where nothing has been chosen yet, and left alone at
   * /games/<game>/new, where the address has already said which game this is
   * — changing it there would make the address a lie. A rematch is sent to
   * /games/new for exactly this reason: its game is a DEFAULT rather than an
   * identity, and a rematch that could not change the game would fail at the
   * thing it was asked for.
   */
  chooseGame?: boolean;
  /** Somebody the address named. Selected, and offered even if the list would not have them. */
  opponent?: SetUpOpponent | null;
  /** A finished game this repeats, and the colour the asker takes in it. */
  again?: SetUpAgain | null;
  /** A position this carries forward, and how far in. */
  fork?: SetUpFork | null;
  /*
   * `carry` is no longer a prop here, and the absence is the point. The line
   * length, the seed, who opens and the draw limit still travel — they come off
   * the game a rematch or a fork was read from — but they are only needed by
   * whatever BUILDS the creation, and this screen no longer does. The doorstep
   * holds them, which is where the request is now made.
   */
  /** Why the address could not be honoured, when it could not. */
  problem?: string | null;
}) {
  const router = useRouter();
  const [rules, setRules] = useState<RulesDraft>(initial);
  const [against, setAgainst] = useState<string>(
    opponent === null ? ANYONE : valueFor(opponent),
  );
  /*
   * Pressed, and on the way. There is nothing here that can fail any more — the
   * request that could moved to the doorstep — so this screen has no error to
   * show, only a button that stops being pressable while the next page arrives.
   */
  const [busy, setBusy] = useState(false);
  /*
   * Says when the browser has taken this over.
   *
   * These controls are server-rendered, so they are real controls before React
   * has attached anything to them, and a choice made in that window is simply
   * dropped — the state never hears it and the next render puts the control
   * back. A person cannot lose that race; a test that opens the page and
   * chooses in the same breath loses it whenever the page is slow, and then
   * fails somewhere else entirely.
   */
  const ready = useHydrated();

  /*
   * The players offered at this game, and the one that has been chosen. Looked
   * up in that list rather than in all of them, so a specialist chosen before
   * the game was changed does not stay chosen at a game it does not play — and
   * that holds for one the ADDRESS named too, which is why `opponent` is not
   * simply trusted here.
   */
  const computers = botsFor(rules.variant as RuleVariant);
  const chosenId = idIn(against);
  const chosen = chosenId === null ? null : whoIs(chosenId, computers, opponents, opponent);
  /*
   * Somebody the chooser is holding and this game will not have — in practice a
   * specialist program, after the game was changed to one it does not play. The
   * name is kept so the screen can say whose offer has just lapsed; the fallback
   * itself is unchanged, because posting a seat for anyone is the right thing to
   * do with a game nobody can be found for.
   */
  const dropped =
    chosenId !== null && chosen === null && opponent !== null && opponent.id === chosenId
      ? opponent.name
      : null;

  /*
   * The board somebody chose, held here rather than in the draft: the draft has
   * to stay a board the current game can actually be played on, and this has to
   * survive a game that cannot use it — see `matchSeat`.
   *
   * IT STARTS AT WHATEVER THE ADDRESS SETTLED, which is the whole of the fix
   * for a wrong board on a link. It used to start at null, and null here means
   * "nobody has said anything about the board" — so `?board=19` read as no
   * answer, and a lone 9×9 seat on the noticeboard was followed over it. Every
   * board-carrying way in was affected: the lobby sentence, a family page, a
   * challenge, the doorstep's own way back. And only where exactly ONE seat
   * matched the game and the pace, which is why a busy database never showed it
   * and a fresh one always did.
   */
  const [boardChosen, setBoardChosen] = useState<number | null>(boardSettled);

  /*
   * Whether somebody is already asking for exactly this, and which board to show
   * — one rule, in one module, with its own tests: `matchSeat`. A rematch and a
   * fork are never matched, because they are about one particular person and, for
   * a fork, one particular position.
   */
  const { settled, waiting } = matchSeat({
    rules,
    seats,
    posting: against === ANYONE,
    boardChosen,
    matchable: again === null && fork === null,
  });

  /*
   * WHETHER THIS IS STILL A REPEAT of the game it was filled in from.
   *
   * A rematch is only a rematch while the form still describes that game — the
   * creation route takes every rule from the old one and nothing from the
   * request — so the moment somebody changes a rule this stops being one, and the
   * screen has to say so rather than hand back swapped colours without mentioning
   * it. `sameRules` is the same comparison `creationFor` makes on the doorstep,
   * asked here because this is where the sentence is printed.
   *
   * Compared against `asPlayed` rather than against `initial`: since the address
   * can fill this form in itself, `initial` may already carry a change, and a
   * changed draft compared against itself would always answer yes.
   */
  const repeat = again !== null && asPlayed !== null && sameRules(settled, asPlayed);

  /*
   * THE WAY ON, WHICH NO LONGER CREATES ANYTHING.
   *
   * This used to POST the game and land on the board, and that was John's
   * complaint stated as precisely as it can be: "we go straight to the game
   * rather than the Doorstep screen which confirms settings… the board means
   * we're playing!!!!" Choosing and confirming are two acts, and a screen that
   * does both in one press cannot be read before it is committed to.
   *
   * So Start carries the draft to /games/<game>/begin, which states it and
   * creates it on a press of its own. Every entry point reaches that page,
   * because every entry point reaches this screen — see `SET_UP_PARAMS` and
   * `beginLink`, and note that the draft travels in the address rather than in a
   * store, so the doorstep can be reloaded, linked and come back from.
   *
   * WHAT A SEAT SOMEBODY IS ALREADY WAITING AT CARRIES INSTEAD. It goes to the
   * same doorstep, naming the seat, and the doorstep reads that game and states
   * ITS rules — because the match here is on the game, the board and the pace,
   * and agreeing to somebody else's game means being shown the parts nobody
   * compared. Sitting down used to land on a board with no confirmation either.
   *
   * `router.push`, not `replace`: pressing Start and then going back belongs on
   * this screen, and the doorstep is a page a reader may honestly want to leave.
   */
  function start() {
    setBusy(true);
    router.push(
      beginLink(settled, {
        against: chosen?.id ?? null,
        rematch: again?.id ?? null,
        from: fork === null ? null : { id: fork.id, move: fork.move },
        sit: waiting?.id ?? null,
      }),
    );
  }

  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="set-up-game" {...readyMark(ready)}>
      <SectionTitle kanji="準備">Set up the game</SectionTitle>
      {/*
        WHAT THIS ONE IS, before what it is played under. A rematch, a fork and
        a fresh game are the same form with different numbers in it, and a
        reader who cannot tell which they are looking at has been handed a
        puzzle rather than a confirmation.
      */}
      {problem !== null ? (
        <p
          className="rounded-lg border border-ochre/60 bg-ochre-soft px-3 py-2 text-xs text-ink"
          data-testid="set-up-problem"
        >
          {problem}
        </p>
      ) : null}
      {again !== null ? (
        <p className="text-xs text-moss" data-testid="set-up-again">
          {repeat
            ? SET_UP_COPY.againHint(chosen?.name ?? "them", STONE_DISPLAY[again.colour].label)
            : SET_UP_COPY.againChanged}
        </p>
      ) : null}
      {fork !== null ? (
        <p className="text-xs text-moss" data-testid="set-up-fork">
          {fork.alone
            ? `${SET_UP_COPY.fork(fork.move)}. ${SET_UP_COPY.forkAlone}`
            : SET_UP_COPY.forkHint(fork.move, opponent?.name ?? "the same opponent")}
        </p>
      ) : null}
      {again === null && fork === null && opponent !== null ? (
        <p className="text-xs text-moss" data-testid="set-up-against">
          {SET_UP_COPY.againstHint(opponent.name)}
        </p>
      ) : null}
      {/*
        A NAMED PLAYER THE CHOSEN GAME DOES NOT OFFER, said rather than swallowed.
        A specialist program plays one game, so changing the game drops it from
        the list — and the screen then falls back to posting a seat for anyone,
        which is the right fallback and a surprise nobody should have to notice
        for themselves.
      */}
      {dropped !== null ? (
        <p className="text-xs text-shu" data-testid="set-up-not-offered">
          {SET_UP_COPY.notAtThisGame(dropped, variantLabel(settled.variant))}
        </p>
      ) : null}

      {/*
        What it will be, in the same words the rules panel uses once it is a
        game — so what somebody agreed to and what they are playing read the
        same, rather than being described twice in two voices.
      */}
      <p className="text-sm font-semibold" data-testid="set-up-summary">
        {describeRules(settled)}
      </p>
      <p className="text-xs text-muted">
        Nothing is started until you say so. Once it is, these are the rules it is played under.
      </p>

      <div className="mt-1 flex flex-col gap-3 border-t border-rule pt-3">
        <RulesForm
          value={settled}
          onChange={setRules}
          disabled={busy}
          showOpen={false}
          showVariant={chooseGame}
          variantLabel="Game"
          /*
           * The screen that CHOOSES a game shows the games, rather than
           * naming them in a dropdown. The rules panel beside a board keeps
           * the selects — it is a narrow column next to the game it is about,
           * and a row of board pictures there would crowd out the board.
           */
          chooser={RULES_CHOOSERS.pictures}
          /*
           * WHETHER THE GAME THIS BUTTON MAKES COULD EVER COUNT, answered
           * before it exists and read from `seatsFor` — the same function the
           * doorstep asks, so the screen that offers the rules and the page
           * that states them cannot come to different answers about one press.
           *
           * `screen` is true of exactly one shape: a fork with nobody to hand
           * the second seat to, which the creation route makes a hot seat.
           * Since offers, a fork against a named person is an offer and counts
           * like any other game, so the control stays for that one. Where it is
           * true the rating select is not drawn at all — nothing here could
           * overrule the route, so a control would be a question whose answer
           * is thrown away.
           */
          refused={seatsFor({ again, fork }).screen ? RATING_REFUSALS.hotSeat : null}
          /*
           * THE FIVE SETTINGS FOLD, AND THE OPPONENT AND THE HANDICAP FOLD WITH
           * THEM.
           *
           * The pictures cost 470 pixels over the two dropdowns they replaced
           * and put the Start button below an iPad's fold — see MoreSettings
           * for the measurement. These two are in the drawer because they are
           * the same kind of thing: settings about a game already chosen, not
           * the question this screen exists to ask. Both are named in the
           * summary line, so a rematch shows who it is against and a handicap
           * shows who is carrying it without either being opened.
           */
          fold={{
            /*
              The fork's own opponent, not the select's: a fork offers no
              opponent control, so `chosen` is null for one and the line would
              have read "Post the seat for anyone" over a game against the
              player who was in the position.
            */
            summary: foldedWords({
              opponent: fork !== null ? opponent : chosen,
              fork,
              handicap: settled.handicap,
            }),
            fields: (
              <>
                {/*
                  A HANDICAP, WHICH THIS SCREEN HAD NO ANSWER FOR UNTIL NOW. John:
                  "you're playing someone who's not very strong — you want to, in
                  the settings page, give yourself a handicap to help them out."
                  The engine has had them all along and nothing could ask for one.

                  Not on a fork: the position was played under whatever handicap
                  the game had, and the route carries that with the moves.
                  Offering to change it here would be a control the server is
                  right to ignore.
                */}
                {fork === null ? (
                  <HandicapChoice
                    value={settled.handicap}
                    variant={settled.variant}
                    disabled={busy}
                    onChange={(handicap) => setRules({ ...settled, handicap })}
                  />
                ) : null}
                {/*
                  A fork is against whoever was in the game it came from — the
                  route reads that off the seats — so there is nothing to ask,
                  and asking would be a control whose answer is discarded.
                */}
                {fork === null ? (
                  <OpponentChoice
                    value={against}
                    onChange={setAgainst}
                    variant={settled.variant}
                    opponents={opponents}
                    named={opponent}
                    disabled={busy}
                    signedIn={signedIn}
                  />
                ) : null}
              </>
            ),
          }}
          onSizeChosen={setBoardChosen}
        />
      </div>

      <span>
        {/*
          The button says which of the two things it will do, because they are
          different things to the person pressing it: taking a seat somebody is
          sitting at starts a game now, and posting one starts a wait. Neither of
          them starts it HERE any more — both lead to the page that states what is
          about to be played, which is the one press away that was missing.
        */}
        <Button onClick={start} disabled={busy || !signedIn} strong data-testid="set-up-start">
          {busy
            ? "Starting…"
            : waiting !== undefined
              ? `${START_COPY.sitWith(waiting.who)} 着席`
              : "Start the game 開始"}
        </Button>
      </span>
      <p className="text-xs text-muted" data-testid="set-up-leads">
        {SET_UP_COPY.startLeads}
      </p>
      {waiting !== undefined ? (
        <p className="text-xs text-muted" data-testid="set-up-match">
          {START_COPY.matchHint(waiting.who)}
        </p>
      ) : null}
      {!signedIn ? (
        <p className="text-xs text-muted">Sign in to start a game against somebody.</p>
      ) : null}
    </section>
  );
}

/**
 * Who a chosen value names, looked up where it can honestly be found.
 *
 * The order matters. A program is only itself at a game it plays — away from
 * its own board a specialist is somebody else under a second name — so the list
 * of programs offered at THIS game is asked first, and an opponent the address
 * named is only honoured as a program while that list still holds them.
 */
function whoIs(
  id: string,
  computers: readonly { id: string; name: string }[],
  opponents: readonly Opponent[],
  named: SetUpOpponent | null,
): SetUpOpponent | null {
  const bot = computers.find((one) => one.id === id);
  if (bot !== undefined) return { id: bot.id, name: bot.name, computer: true };
  const person = opponents.find((one) => one.id === id);
  if (person !== undefined) return { id: person.id, name: person.name, computer: false };
  /*
   * Somebody the address named who is on neither list — a player met in the
   * directory, who is nobody's buddy and is not here now. Honoured, because
   * dropping them would answer "play this person" with a seat posted for
   * anyone; but never for a program, which the list above is the authority on.
   */
  if (named !== null && named.id === id && !named.computer) return named;
  return null;
}
