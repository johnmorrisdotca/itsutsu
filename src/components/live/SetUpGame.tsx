"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { boardSizesFor } from "@/lib/gomoku/gomoku.constants";
import { botsFor } from "@/lib/bots/bots.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { BOT_PROFILES } from "@/lib/gomoku/opponent.constants";
import { NO_HANDICAP } from "@/lib/gomoku/gomoku.constants";
import { matchPath, seatPath } from "@/lib/gomoku/slugs";
import { START_COPY } from "@/components/mine/mine.constants";
import type { Opponent } from "@/lib/social/opponents";
import type { SeatOnBoard } from "@/components/mine/startGame.types";
import { Button, Field, SectionTitle, Select } from "@/components/ui/Controls";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { RulesForm } from "./RulesForm";
import { describeRules } from "./rulesSummary";
import type { RulesDraft } from "./rulesDraft";
import { shownName } from "@/lib/rating/shownName";

/** What the opponent choice means; the same words the start sentence uses. */
const ANYONE = "anyone";
const COMPUTER = "c:";

/**
 * Settling a game before there is a game.
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
 */
export function SetUpGame({
  initial,
  opponents,
  seats = [],
  signedIn,
  chooseGame = false,
}: {
  initial: RulesDraft;
  opponents: Opponent[];
  /**
   * The seats already posted, so asking for a game somebody is already asking
   * for sits down at theirs instead of posting a second one beside it.
   *
   * This came off the one-line sentence that used to start games, whose own
   * comment put it best: auto-match and posting a seat are the same wish said
   * twice, and the only difference is whether somebody is already asking. The
   * sentence is gone and the wish is not, so it lives here now — a screen that
   * replaced it and quietly dropped this would not be a replacement.
   */
  seats?: SeatOnBoard[];
  signedIn: boolean;
  /**
   * Offer the game itself as the first choice.
   *
   * Set at /games/new, where nothing has been chosen yet, and left alone at
   * /games/<game>/new, where the address has already said which game this is
   * — changing it there would make the address a lie.
   */
  chooseGame?: boolean;
}) {
  const router = useRouter();
  const [rules, setRules] = useState<RulesDraft>(initial);
  const [against, setAgainst] = useState<string>(ANYONE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /*
   * Says when the browser has taken this over.
   *
   * These selects are server-rendered, so they are real controls before React
   * has attached anything to them, and a choice made in that window is simply
   * dropped — the state never hears it and the next render puts the select
   * back. A person cannot lose that race; a test that opens the page and
   * chooses in the same breath loses it whenever the page is slow, and then
   * fails somewhere else entirely. The mark moved here with the controls when
   * the one-line sentence that used to carry it was removed.
   */
  const ready = useHydrated();

  const named = against.startsWith("m:")
    ? opponents.find((one) => one.email === against.slice(2))
    : undefined;
  /*
   * The players offered at this game, and the one that has been chosen. Looked
   * up in that list rather than in all of them, so a specialist chosen before
   * the game was changed does not stay chosen at a game it does not play.
   */
  const computers = botsFor(rules.variant as RuleVariant);
  const computer = against.startsWith(COMPUTER)
    ? computers.find((bot) => bot.id === against.slice(COMPUTER.length))
    : undefined;
  const here = opponents.filter((one) => one.here);
  const away = opponents.filter((one) => !one.here);

  /*
   * A seat worth taking is one that matches the whole of what is being asked
   * for — the game, the board AND the pace. Matching on the game alone would
   * sit somebody down at a board or a clock they did not choose, which is the
   * opposite of settling the rules before the game exists.
   */


  /*
   * The board follows a seat somebody is already waiting on, until anybody
   * touches it.
   *
   * This is the regression the control could easily have caused and the old
   * sentence was careful about: every seat on the board was posted at some
   * size, and a screen that always opened at the member's own favourite would
   * stop matching them — so asking for a game would post a SECOND seat beside
   * the one already waiting, and neither would ever be filled. Following the
   * waiting seat keeps the common case one press, and touching the control
   * stops it following, because at that point the board is a choice somebody
   * has made rather than a default.
   */
  /*
   * The board somebody chose, remembered across a game that cannot use it.
   *
   * applyRulesChange snaps the size to one the chosen game is played on, so
   * looking at Reversi — which is 8x8 and nothing else — and coming back would
   * otherwise lose a 19x19 that had been chosen deliberately. The choice is
   * held here rather than in the draft, because the draft has to stay a board
   * the current game can actually be played on.
   */
  const [boardChosen, setBoardChosen] = useState<number | null>(null);
  const alone =
    against === ANYONE && boardChosen === null
      ? seats.filter((seat) => seat.variant === rules.variant && seat.moveTimeMs === rules.moveTimeMs)
      : [];
  const follow = alone.length === 1 ? alone[0] : undefined;
  /*
   * Derived rather than written into state. The followed board is a reading of
   * what is on the noticeboard, not a decision anybody has made, and storing a
   * reading as if it were a decision is what makes it need an effect to keep
   * it in step — which React rightly refuses.
   */
  const wanted =
    boardChosen !== null && boardSizesFor(rules.variant as RuleVariant).includes(boardChosen)
      ? boardChosen
      : undefined;
  const settled: RulesDraft =
    follow !== undefined
      ? { ...rules, size: follow.size }
      : wanted !== undefined
        ? { ...rules, size: wanted }
        : rules;

  /* Somebody already asking for exactly this — the game, the board AND the pace. */
  const waiting =
    against === ANYONE
      ? seats.find(
          (seat) =>
            seat.variant === settled.variant &&
            seat.size === settled.size &&
            seat.moveTimeMs === settled.moveTimeMs,
        )
      : undefined;

  async function start() {
    setBusy(true);
    setError(null);
    try {
      /*
       * Somebody is already asking for exactly this, so take their seat rather
       * than post a second one next to it and leave two people waiting for
       * each other.
       */
      if (waiting !== undefined) {
        const sat = await fetch(`/api/games/${waiting.id}/sit`, { method: "POST" });
        if (sat.ok) {
          const { path } = (await sat.json()) as { path: string };
          router.push(path);
          return;
        }
        // Somebody else reached it first; fall through and post one instead.
      }

      const response = await fetch("/api/games/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settled,
          // Posted for anyone unless somebody in particular is being asked.
          open: named === undefined && computer === undefined,
          ...(computer !== undefined ? { challengeId: computer.id } : {}),
          ...(named !== undefined ? { challenge: named.email } : {}),
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "That game could not be started.");
        return;
      }
      const created = (await response.json()) as { id: string; blackToken: string };
      const to = response.headers.get("Location");
      router.push(
        named === undefined && computer === undefined
          ? seatPath(rules.variant, created.id, created.blackToken)
          : (to ?? matchPath(rules.variant, created.id)),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="set-up-game" {...readyMark(ready)}>
      <SectionTitle kanji="準備">Set up the game</SectionTitle>
      {/*
        What it will be, in the same words the rules panel uses once it is a
        game — so what somebody agreed to and what they are playing read the
        same, rather than being described twice in two voices.
      */}
      <p className="text-sm font-semibold" data-testid="set-up-summary">
        {describeRules({ ...settled, handicap: NO_HANDICAP })}
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
          onSizeChosen={setBoardChosen}
        />
        <Field label="Opponent">
          <Select
            value={against}
            disabled={busy || !signedIn}
            onChange={(event) => setAgainst(event.target.value)}
            data-testid="set-up-with"
          >
            <option value={ANYONE}>Post the seat for anyone</option>
            {here.length > 0 ? (
              <optgroup label="Here now 在室">
                {here.map((one) => (
                  <option key={one.email} value={`m:${one.email}`}>
                    {shownName(one.name)}
                  </option>
                ))}
              </optgroup>
            ) : null}
            {away.length > 0 ? (
              <optgroup label="Players you know 知人">
                {away.map((one) => (
                  <option key={one.email} value={`m:${one.email}`}>
                    {shownName(one.name)}
                  </option>
                ))}
              </optgroup>
            ) : null}
            <optgroup label="The computer 対コンピュータ">
              {/* A specialist is offered at its own game and nowhere else. */}
              {computers.map((bot) => (
                <option key={bot.id} value={`${COMPUTER}${bot.id}`}>
                  {[bot.name, BOT_PROFILES[bot.tier].native].filter(Boolean).join(" ")} ·{" "}
                  {BOT_PROFILES[bot.tier].strength}
                </option>
              ))}
            </optgroup>
          </Select>
        </Field>
      </div>

      {error !== null ? (
        <p className="text-xs text-shu" data-testid="set-up-error">
          {error}
        </p>
      ) : null}
      <span>
        {/*
          The button says which of the two things it will do, because they are
          different things to the person pressing it: taking a seat somebody is
          sitting at starts a game now, and posting one starts a wait. The
          sentence this screen replaced said which, and a replacement that made
          both read "start" would have been a step backwards.
        */}
        <Button onClick={start} disabled={busy || !signedIn} strong data-testid="set-up-start">
          {busy
            ? "Starting…"
            : waiting !== undefined
              ? `${START_COPY.sitWith(waiting.who)} 着席`
              : "Start the game 開始"}
        </Button>
      </span>
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
