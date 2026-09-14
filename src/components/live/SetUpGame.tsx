"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { botsFor } from "@/lib/bots/bots.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { START_COPY } from "@/components/mine/mine.constants";
import type { Opponent } from "@/lib/social/opponents";
import type { SeatOnBoard } from "@/components/mine/startGame.types";
import { draftRatingRefusal } from "@/lib/rating/handicapRefusal";
import { Button, SectionTitle } from "@/components/ui/Controls";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { HandicapChoice } from "./HandicapChoice";
import { OpponentChoice } from "./OpponentChoice";
import { ANYONE, RANDOM_COMPUTER, againstFromAddress, idIn, valueFor, whoIs } from "./opponentOptions";
import { RULES_CHOOSERS, RulesForm } from "./RulesForm";
import { SET_UP_COPY, SIGN_IN_TO_PLAY } from "./live.constants";
import { describeRules, describeSettings } from "./rulesSummary";
import type { RulesDraft } from "./rulesDraft";
import { matchSeat } from "./seatMatch";
import { beginLink } from "./setUpAddress";
import { readSetUpAsked } from "./setUpAsked";
import { keptBoardChosen, keptDraft, keptParams, queryRecord } from "./setUpKept";
import { SetUpNotices } from "./SetUpNotices";
import { SettingWords } from "./SettingWords";
import { seatsFor, stillARematch } from "./setUpStart";
import { recapWords } from "./setUpWords";
import type { KeptBase, KeptDefaults, SetUpAgain, SetUpFork, SetUpOpponent } from "./setUp.types";
import { forgetRematchHeading, publishRematchHeading } from "./setUpHeadingState";
import { useKeptAddress } from "./useKeptAddress";

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
  chooseGame = false,
  opponent = null,
  again = null,
  fork = null,
  problem = null,
}: {
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
  signedIn: boolean;
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
  /** Why the address could not be honoured, when it could not. */
  problem?: string | null;
}) {
  const router = useRouter();
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
   * Pressed, and on the way. There is nothing here that can fail — the request
   * that could lives on the doorstep — so this screen has no error to show, only
   * a button that stops being pressable while the next page arrives.
   */
  const [busy, setBusy] = useState(false);
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
  useKeptAddress(keptParams(base, { rules, boardChosen, against: random ? RANDOM_COMPUTER : chosenId, chooseGame }));

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

  /*
   * AND THE HEADING ABOVE SAYS THE SAME, without a reload. It is drawn by the page
   * from the address the page opened with, so choosing somebody else left it
   * reading "Play them again, you take White" over a notice saying it was a new
   * game. The same decision is handed up to it as it changes — see
   * `setUpHeadingState`.
   */
  const nowName = opponentNow?.name ?? null;
  const againId = again?.id ?? null;
  useEffect(() => {
    if (againId === null) return;
    publishRematchHeading(againId, { repeat, opponent: nowName === null ? null : { name: nowName } });
  }, [againId, repeat, nowName]);
  useEffect(() => {
    if (againId === null) return;
    return () => forgetRematchHeading(againId);
  }, [againId]);

  /*
   * WHETHER THE GAME THIS BUTTON LEADS TO COULD EVER COUNT, read from `seatsFor`
   * — the function the doorstep asks — and `draftRatingRefusal`, which it asks too,
   * so the two pages cannot disagree about one press. True of two shapes: a fork
   * with nobody to hand the second seat to, and a handicap on either colour.
   */
  const refused = draftRatingRefusal({ screen: seatsFor({ again, fork }).screen, handicap: settled.handicap });

  /*
   * THE WAY ON, WHICH CREATES NOTHING. Continue carries the draft to
   * /games/<game>/begin, which states it and creates it on a press of its own; a
   * seat somebody is already waiting at goes to the same doorstep, naming the
   * seat. `router.push`, not `replace`: going back from the doorstep belongs here.
   *
   * On a rematch, nobody in particular is said out loud as `anyone`. Silence there
   * means the player from last time, so a seat for anyone left unsaid arrived at
   * the doorstep as the very rematch somebody had just chosen not to play.
   */
  function start() {
    setBusy(true);
    router.push(
      beginLink(settled, {
        against: random ? RANDOM_COMPUTER : (chosen?.id ?? (again !== null ? ANYONE : null)),
        rematch: again?.id ?? null,
        from: fork === null ? null : { id: fork.id, move: fork.move },
        sit: waiting?.id ?? null,
      }),
    );
  }

  /*
   * The whole game as a line, over the button that carries it: the rules' own
   * words, then who it is against and any handicap. A reader at the bottom of a
   * long form reads what Continue will carry without scrolling back up.
   */
  const recap = [
    ...describeSettings(settled, refused),
    ...recapWords({ opponent: fork !== null ? opponent : chosen, fork, handicap: settled.handicap, random }),
  ];

  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="set-up-game" {...readyMark(ready)}>
      <SectionTitle kanji="準備">Set up the game</SectionTitle>
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
          chooser={RULES_CHOOSERS.pictures}
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
                />
              ) : null,
            /*
              A HANDICAP: John, "you're playing someone who's not very strong —
              you want to, in the settings page, give yourself a handicap to help
              them out." Not on a fork, whose position was played under whatever
              handicap its game had. A head start for the weaker player — free
              moves, extra stones, piece odds — is the next ticket, and its group
              goes in this section above the harder rules for the stronger one.
            */
            handicap:
              fork === null ? (
                <HandicapChoice
                  value={settled.handicap}
                  variant={settled.variant}
                  disabled={busy}
                  onChange={(handicap) => setRules({ ...settled, handicap })}
                />
              ) : null,
          }}
          onSizeChosen={setBoardChosen}
        />
      </div>

      <div className="flex flex-col gap-2 border-t border-rule pt-3" data-testid="set-up-continue">
        <SettingWords words={recap} testId="set-up-recap" />
        <span>
          {/*
            The button says what it does: it continues, to the page that states
            the game. John: "it's not Start the Game... button should be
            'Continue'". Where somebody is already waiting at exactly this game it
            says whose seat it continues to, because that is a different act.
          */}
          <Button onClick={start} disabled={busy || !signedIn} strong data-testid="set-up-start">
            {busy
              ? SET_UP_COPY.continuing
              : waiting !== undefined
                ? SET_UP_COPY.continueToSeat(waiting.who)
                : SET_UP_COPY.continue}
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
        {!signedIn ? <p className="text-xs text-muted">{SIGN_IN_TO_PLAY}</p> : null}
      </div>
    </section>
  );
}
