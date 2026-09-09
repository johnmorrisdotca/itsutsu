"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Select } from "@/components/ui/Controls";
import { DEFAULT_BOARD_SIZE, boardSizesFor } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { BUTTON_BASE, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { gamePath, matchPath, rulesPath, seatPath } from "@/lib/gomoku/slugs";
import Link from "next/link";
import { BOT_MEMBER_LIST } from "@/lib/bots/bots.constants";
import { BOT_PROFILES } from "@/lib/gomoku/opponent.constants";
import { PACES, START_COPY } from "./mine.constants";
import type { StartGameProps } from "./startGame.types";

/**
 * "anyone", "screen", "m:<email>" for a member, or "c:<id>" for one of the
 * computer players — what the third word of the sentence means.
 *
 * A computer is named by its id rather than by an address because it has none:
 * it never signs in, and an address is only how you sign in.
 */
const ANYONE = "anyone";
const SCREEN = "screen";
const COMPUTER = "c:";

/**
 * Starting a game, as one sentence: play this game, at this pace, with
 * whoever. Auto-match and posting a seat were the same wish said twice —
 * the only difference is whether somebody is already asking, and the site
 * knows that — so "with anyone" sits down at a matching seat if there is
 * one and posts yours if there is not. Naming a member challenges them;
 * "someone at this screen" is the board in this browser.
 */
export function StartGame({ families, seats, opponents, signedIn }: StartGameProps) {
  const router = useRouter();
  const [variant, setVariant] = useState(families[0]?.games[0]?.variant ?? "freestyle");
  /** Null until somebody picks one: the sentence follows a waiting seat instead. */
  const [size, setSize] = useState<number | null>(null);
  const [pace, setPace] = useState<string>(String(PACES[0].value));
  const [against, setAgainst] = useState<string>(signedIn ? ANYONE : SCREEN);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const game = useMemo(
    () => families.flatMap((family) => family.games).find((entry) => entry.variant === variant),
    [families, variant],
  );
  const sizes = boardSizesFor(variant as RuleVariant);
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
  const named = against.startsWith("m:") ? opponents.find((one) => one.email === against.slice(2)) : undefined;
  const computer = against.startsWith(COMPUTER)
    ? BOT_MEMBER_LIST.find((bot) => bot.id === against.slice(COMPUTER.length))
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

  const hint =
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

  async function start() {
    setError(null);
    if (against === SCREEN) {
      router.push(gamePath(variant));
      return;
    }
    setBusy(true);
    try {
      // Somebody is already asking for exactly this: take their seat.
      if (named === undefined && computer === undefined && match !== undefined) {
        const sat = await fetch(`/api/games/${match.id}/sit`, { method: "POST" });
        if (sat.ok) {
          const { path } = (await sat.json()) as { path: string };
          router.push(path);
          return;
        }
        setError(START_COPY.seatTaken);
      }

      const response = await fetch("/api/games/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          computer !== undefined
            ? { variant, size: board, moveTimeMs, challengeId: computer.id }
            : named === undefined
              ? { variant, size: board, moveTimeMs, open: true }
              : { variant, size: board, moveTimeMs, challenge: named.email },
        ),
      });
      if (!response.ok) {
        setError(START_COPY.failed);
        return;
      }
      const created = (await response.json()) as { id: string; blackToken: string };
      /*
       * A challenge binds both seats to accounts, so its own address seats
       * whoever opens it. A posted seat belongs to nobody yet, so the opener
       * goes in by their seat link, which claims the black seat for them.
       */
      const to = response.headers.get("Location");
      router.push(
        named === undefined && computer === undefined
          ? seatPath(variant, created.id, created.blackToken)
          : (to ?? matchPath(variant, created.id)),
      );
    } finally {
      setBusy(false);
    }
  }

  const here = opponents.filter((one) => one.here);
  const away = opponents.filter((one) => !one.here);

  return (
    <div className="flex flex-col gap-3" data-testid="start-game">
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
                <option key={one.email} value={`m:${one.email}`}>
                  {one.name}
                </option>
              ))}
            </optgroup>
          ) : null}
          {away.length > 0 ? (
            <optgroup label={`${START_COPY.buddies.label} ${START_COPY.buddies.kanji}`}>
              {away.map((one) => (
                <option key={one.email} value={`m:${one.email}`}>
                  {one.name}
                </option>
              ))}
            </optgroup>
          ) : null}
          {signedIn ? (
            <optgroup label={`${START_COPY.computer.label} ${START_COPY.computer.kanji}`}>
              {BOT_MEMBER_LIST.map((bot) => (
                <option key={bot.id} value={`${COMPUTER}${bot.id}`}>
                  {bot.name} {BOT_PROFILES[bot.tier].kanji} · {BOT_PROFILES[bot.tier].strength}
                </option>
              ))}
            </optgroup>
          ) : null}
          <option value={SCREEN}>{START_COPY.atThisScreen}</option>
        </Select>
        <button
          type="button"
          onClick={start}
          disabled={busy}
          className={`${BUTTON_BASE} ${BUTTON_STRONG} px-4 py-2 text-sm sm:ml-auto`}
          data-testid="start-game-go"
        >
          {label}
        </button>
      </div>
      <p className="text-xs text-muted" data-testid="start-game-hint">
        {signedIn ? hint : START_COPY.signedOut}
      </p>
      {game !== undefined ? (
        <p className="text-xs text-muted">
          <Link href={rulesPath(variant)} className="underline underline-offset-4">
            Rules for {game.label}
          </Link>{" "}
          · or browse the families below.
        </p>
      ) : null}
      {error !== null ? (
        <p className="text-xs text-shu" data-testid="start-game-error">
          {error}
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
