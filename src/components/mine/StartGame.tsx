"use client";

import { useMemo, useState } from "react";

import { Select } from "@/components/ui/Controls";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import { DEFAULT_BOARD_SIZE, boardSizesFor } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { BUTTON_BASE, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { NO_PACE, gamePath, playPath, rulesPath, setUpLink } from "@/lib/gomoku/slugs";
import Link from "next/link";
import { botsFor } from "@/lib/bots/bots.constants";
import { BOT_PROFILES } from "@/lib/gomoku/opponent.constants";
import { PACES, START_COPY } from "./mine.constants";
import type { StartGameProps } from "./startGame.types";
import { shownName } from "@/lib/rating/shownName";

/**
 * "anyone", "screen", "m:<id>" for a member, or "c:<id>" for one of the
 * computer players — what the third word of the sentence means.
 *
 * Everybody is named by their member id. A computer never signs in and so has
 * no address at all, which is why it was always the id here; a person's address
 * worked and put every buddy's email into the page's markup to do it.
 */
const ANYONE = "anyone";
const SCREEN = "screen";
const COMPUTER = "c:";
/**
 * A member, by id.
 *
 * It was by address, which meant this select wrote every buddy's email into the
 * page's markup and could not name a computer player at all. The setup screen
 * the sentence now leads to is addressed by id for the same two reasons — see
 * `SET_UP_PARAMS`.
 */
const MEMBER = "m:";

/**
 * Starting a game, as one sentence: play this game, at this pace, with
 * whoever. Auto-match and posting a seat were the same wish said twice —
 * the only difference is whether somebody is already asking, and the site
 * knows that — so "with anyone" sits down at a matching seat if there is
 * one and posts yours if there is not. Naming a member challenges them;
 * "someone at this screen" is the board in this browser.
 */
export function StartGame({ families, seats, opponents, signedIn }: StartGameProps) {
  const [variant, setVariant] = useState(families[0]?.games[0]?.variant ?? "freestyle");
  /** Null until somebody picks one: the sentence follows a waiting seat instead. */
  const [size, setSize] = useState<number | null>(null);
  const [pace, setPace] = useState<string>(String(PACES[0].value));
  const [against, setAgainst] = useState<string>(signedIn ? ANYONE : SCREEN);
  /** False on the server, true once the browser has it — see `data-ready` below. */
  const ready = useHydrated();

  const game = useMemo(
    () => families.flatMap((family) => family.games).find((entry) => entry.variant === variant),
    [families, variant],
  );
  const sizes = boardSizesFor(variant as RuleVariant);
  /*
   * The computer players worth offering at this game. The graded five play
   * anything; a specialist is offered only where it is one, because away from
   * its own board it is 国手 under a second name and a different flag.
   */
  const computers = botsFor(variant as RuleVariant);
  const moveTimeMs = pace === "" ? null : Number(pace);
  const paceLabel = PACES.find((option) => String(option.value) === pace)?.label ?? "";
  const forThisGame = seats.filter((seat) => seat.variant === variant);

  /*
   * The board, which until somebody says otherwise is whichever one a person
   * is already waiting on.
   *
   * That default is the whole reason this is not a plain piece of state. The
   * sentence exists to get two people playing, and a control that started at
   * some fixed size would quietly stop matching the seats on the board: every
   * game posted before this control existed is on the size the old code sent,
   * and somebody arriving at a default of 15×15 would post a second seat
   * beside the 9×9 one already waiting rather than sit down at it. Following
   * the waiting seat means the common case is still one click, and the
   * uncommon one — wanting a particular board — is a choice somebody makes on
   * purpose and keeps.
   *
   * A chosen board is held across a change of game rather than reset, and
   * where the new game does not have it — every Reversi but the mini one is
   * 8×8 — that game's own first board stands in, so the control can never
   * show a size it is not offering.
   */
  const waiting = forThisGame.find((seat) => seat.moveTimeMs === moveTimeMs && sizes.includes(seat.size));
  const board =
    size !== null && sizes.includes(size)
      ? size
      : (waiting?.size ?? (sizes.includes(DEFAULT_BOARD_SIZE) ? DEFAULT_BOARD_SIZE : sizes[0]));

  /*
   * A seat worth taking is one that matches the whole sentence, board
   * included. Matching on the game and the pace alone would seat somebody who
   * asked for 19×19 at a 9×9 game and say nothing about it — the sentence has
   * to describe what you are about to get, or the control is decoration.
   */
  const match = forThisGame.find((seat) => seat.moveTimeMs === moveTimeMs && seat.size === board);
  const named = against.startsWith(MEMBER)
    ? opponents.find((one) => one.id === against.slice(MEMBER.length))
    : undefined;
  /*
   * Looked up in the players offered at *this* game rather than in all of
   * them, so choosing a specialist and then changing the game does not leave
   * a challenge pointing at somebody the list no longer shows. The sentence
   * falls back to posting a seat, which it also says out loud.
   */
  const computer = against.startsWith(COMPUTER)
    ? computers.find((bot) => bot.id === against.slice(COMPUTER.length))
    : undefined;

  const label =
    against === SCREEN
      ? START_COPY.setUp
      : computer !== undefined
        ? START_COPY.challenge(computer.name)
      : named !== undefined
        ? START_COPY.challenge(named.name)
        : match !== undefined
          ? START_COPY.sitWith(match.who)
          : START_COPY.post;

  const about =
    against === SCREEN
      ? START_COPY.screenHint
      : computer !== undefined
        ? START_COPY.computerHint(computer.name, BOT_PROFILES[computer.tier].blurb)
      : named !== undefined
        ? named.here
          ? START_COPY.challengeHintHere(named.name)
          : START_COPY.challengeHintAway(named.name, paceLabel)
        : match !== undefined
          ? START_COPY.matchHint(match.who)
          : forThisGame.length > 0
            ? START_COPY.otherPaceHint(forThisGame.length, game?.label ?? variant)
            : START_COPY.firstHint(game?.label ?? variant);
  /*
   * And that there is a screen between the press and the game. Said here
   * rather than by rewording the button, which names the errand in John's own
   * words and still names it correctly — what would be dishonest is leaving
   * somebody to discover the extra step. The board at this screen is exempt:
   * that press really does land on a board, which is what it says.
   */
  const hint = against === SCREEN ? about : `${about} ${START_COPY.nextIsSetUp}`;

  /*
   * WHERE THE SENTENCE GOES, WHICH IS NO LONGER STRAIGHT INTO A GAME.
   *
   * It used to POST the game itself and land you on a board. That was the last
   * of the six ways into a game that skipped the screen where the rules are
   * settled, and John has asked for that screen in front of every one of them:
   * "There are many places we can start a game... and we need that page before
   * the game starts."
   *
   * SO THE SENTENCE IS THE FAST WAY TO REACH IT RATHER THAN A WAY AROUND IT,
   * and it loses nothing by being one — everything it had settled travels with
   * it, so the screen it lands on is filled in and one press from a game. It
   * keeps its auto-matching too, because that screen does the same thing with
   * the same seats: ask for a game somebody is already asking for and it offers
   * to sit down at theirs rather than post a second one beside it.
   *
   * "Someone at this screen" still goes to the BOARD, and must: a scratch board
   * is not a game anybody set up, which is the whole of what it is for.
   */
  const href =
    against === SCREEN
      ? playPath(variant)
      : setUpLink({
          variant,
          /*
           * Only where there was a board to choose. On a game played on one
           * board the control is not offered, and an address naming the only
           * possible board would be saying a choice was made that nobody made.
           */
          board: sizes.length > 1 ? board : undefined,
          // Said out loud, because "no clock" and "nobody said" want opposite
          // answers from the screen that reads this back.
          pace: moveTimeMs === null ? NO_PACE : moveTimeMs,
          against: computer?.id ?? named?.id,
        });

  const here = opponents.filter((one) => one.here);
  const away = opponents.filter((one) => !one.here);

  return (
    /*
     * `data-ready` is true only once this has run in the browser.
     *
     * The sentence is server-rendered and its selects are real, so they can be
     * changed before React has attached anything to them — and a change made
     * then is dropped on the floor: the state never hears it, and the next
     * render puts the select back where it was. It looks exactly like a
     * control that ignored you.
     *
     * A person cannot lose that race; a browser test opening the page and
     * choosing in the same breath loses it whenever the page is a little
     * slow, and then fails somewhere else entirely — "started on 9×9 when I
     * chose 19×19", which reads as a bug in the board and is a bug in the
     * clock. Three specs chased that today. Waiting for this marker is the
     * one honest way to say "the page is listening now".
     */
    <div className="flex flex-col gap-3" data-testid="start-game" {...readyMark(ready)}>
      <div className="flex flex-col items-stretch gap-2 text-lg sm:flex-row sm:flex-wrap sm:items-center">
        <Word>{START_COPY.play}</Word>
        <Select
          value={variant}
          onChange={(event) => setVariant(event.target.value)}
          aria-label="Game"
          data-testid="start-game-variant"
        >
          {families.map((family) => (
            <optgroup key={family.title} label={`${family.title} ${family.kanji}`}>
              {family.games.map((entry) => {
                const open = seats.filter((seat) => seat.variant === entry.variant).length;
                return (
                  <option key={entry.variant} value={entry.variant}>
                    {entry.label} {entry.kanji}
                    {open > 0 ? ` · ${START_COPY.seatsOpen(open)}` : ""}
                  </option>
                );
              })}
            </optgroup>
          ))}
        </Select>
        {/*
          Only where there is a choice to make. Most games are played on one
          board and have nothing to ask, so a size control on every game would
          be a word added to the sentence for a decision that does not exist —
          and the sentence being one line is the whole of what it is for.
        */}
        {sizes.length > 1 ? (
          <>
            <Word>{START_COPY.on}</Word>
            <Select
              value={board}
              onChange={(event) => setSize(Number(event.target.value))}
              aria-label="Board"
              data-testid="start-game-board"
            >
              {sizes.map((option) => (
                <option key={option} value={option}>
                  {option}×{option}
                </option>
              ))}
            </Select>
          </>
        ) : null}
        <Word>{START_COPY.at}</Word>
        <Select value={pace} onChange={(event) => setPace(event.target.value)} aria-label="Pace" data-testid="start-game-pace">
          {PACES.map((option) => (
            <option key={option.label} value={option.value === null ? "" : String(option.value)}>
              {option.label}
            </option>
          ))}
        </Select>
        <Word>{START_COPY.with}</Word>
        <Select
          value={against}
          onChange={(event) => setAgainst(event.target.value)}
          aria-label="Opponent"
          data-testid="start-game-with"
        >
          {signedIn ? <option value={ANYONE}>{START_COPY.anyone}</option> : null}
          {here.length > 0 ? (
            <optgroup label={`${START_COPY.hereNow.label} ${START_COPY.hereNow.kanji}`}>
              {here.map((one) => (
                <option key={one.id} value={`${MEMBER}${one.id}`}>
                  {shownName(one.name)}
                </option>
              ))}
            </optgroup>
          ) : null}
          {away.length > 0 ? (
            <optgroup label={`${START_COPY.buddies.label} ${START_COPY.buddies.kanji}`}>
              {away.map((one) => (
                <option key={one.id} value={`${MEMBER}${one.id}`}>
                  {shownName(one.name)}
                </option>
              ))}
            </optgroup>
          ) : null}
          {signedIn ? (
            <optgroup label={`${START_COPY.computer.label} ${START_COPY.computer.kanji}`}>
              {computers.map((bot) => (
                <option key={bot.id} value={`${COMPUTER}${bot.id}`}>
                  {[bot.name, BOT_PROFILES[bot.tier].native].filter(Boolean).join(" ")} ·{" "}
                  {BOT_PROFILES[bot.tier].strength}
                </option>
              ))}
            </optgroup>
          ) : null}
          <option value={SCREEN}>{START_COPY.atThisScreen}</option>
        </Select>
        {/*
          A LINK, BECAUSE IT NAVIGATES. It used to be a button that wrote a game
          and then navigated to it; there is nothing to write here any more, and
          a link is better at the one job that is left — it prefetches, it opens
          in a new tab if somebody wants that, and it cannot drop a press to
          hydration because there is no handler waiting to be attached. The
          selects above still need the ready mark; this no longer does.
        */}
        <Link
          href={href}
          className={`${BUTTON_BASE} ${BUTTON_STRONG} px-4 py-2 text-center text-sm sm:ml-auto`}
          data-testid="start-game-go"
        >
          {label}
        </Link>
      </div>
      <p className="text-xs text-muted" data-testid="start-game-hint">
        {signedIn ? hint : START_COPY.signedOut}
      </p>
      {game !== undefined ? (
        <p className="text-xs text-muted">
          <Link href={rulesPath(variant)} className="underline underline-offset-4">
            Rules for {game.label}
          </Link>{" "}
          ·{" "}
          {/*
            The way through for anything the sentence does not ask about — an
            opening, a clock that is a budget, a friendly game. The sentence
            stays one line for the common case; everything else settles the
            rules in full before there is a game to change them on.
          */}
          <Link href={`${gamePath(variant)}/new`} className="underline underline-offset-4" data-testid="start-game-set-up">
            set it up in full
          </Link>{" "}
          · or browse the families below.
        </p>
      ) : null}
    </div>
  );
}

/** A word of the sentence: plain on a wide screen, a small label on a narrow one. */
function Word({ children }: { children: string }) {
  return (
    <span className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase sm:text-lg sm:font-normal sm:tracking-normal sm:text-ink-soft sm:normal-case">
      {children}
    </span>
  );
}
