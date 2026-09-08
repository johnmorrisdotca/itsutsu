"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Select } from "@/components/ui/Controls";
import { BUTTON_BASE, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { gamePath, matchPath, rulesPath, seatPath } from "@/lib/gomoku/slugs";
import Link from "next/link";
import { PACES, START_COPY } from "./mine.constants";
import type { StartGameProps } from "./startGame.types";

/** "anyone", "screen", or "m:<email>" — what the third word of the sentence means. */
const ANYONE = "anyone";
const SCREEN = "screen";

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
  const [pace, setPace] = useState<string>(String(PACES[0].value));
  const [against, setAgainst] = useState<string>(signedIn ? ANYONE : SCREEN);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const game = useMemo(
    () => families.flatMap((family) => family.games).find((entry) => entry.variant === variant),
    [families, variant],
  );
  const moveTimeMs = pace === "" ? null : Number(pace);
  const paceLabel = PACES.find((option) => String(option.value) === pace)?.label ?? "";

  const forThisGame = seats.filter((seat) => seat.variant === variant);
  const match = forThisGame.find((seat) => seat.moveTimeMs === moveTimeMs);
  const named = against.startsWith("m:") ? opponents.find((one) => one.email === against.slice(2)) : undefined;

  const label =
    against === SCREEN
      ? START_COPY.setUp
      : named !== undefined
        ? START_COPY.challenge(named.name)
        : match !== undefined
          ? START_COPY.sitWith(match.who)
          : START_COPY.post;

  const hint =
    against === SCREEN
      ? START_COPY.screenHint
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
      if (named === undefined && match !== undefined) {
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
          named === undefined
            ? { variant, size: game?.size, moveTimeMs, open: true }
            : { variant, size: game?.size, moveTimeMs, challenge: named.email },
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
        named === undefined ? seatPath(variant, created.id, created.blackToken) : (to ?? matchPath(variant, created.id)),
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
