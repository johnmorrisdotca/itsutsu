"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { BOT_MEMBER_LIST } from "@/lib/bots/bots.constants";
import { BOT_PROFILES } from "@/lib/gomoku/opponent.constants";
import { NO_HANDICAP } from "@/lib/gomoku/gomoku.constants";
import { matchPath, seatPath } from "@/lib/gomoku/slugs";
import type { Opponent } from "@/lib/social/opponents";
import { Button, Field, SectionTitle, Select } from "@/components/ui/Controls";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { RulesForm } from "./RulesForm";
import { describeRules } from "./rulesSummary";
import type { RulesDraft } from "./rulesDraft";

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
  signedIn,
}: {
  initial: RulesDraft;
  opponents: Opponent[];
  signedIn: boolean;
}) {
  const router = useRouter();
  const [rules, setRules] = useState<RulesDraft>(initial);
  const [against, setAgainst] = useState<string>(ANYONE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const named = against.startsWith("m:")
    ? opponents.find((one) => one.email === against.slice(2))
    : undefined;
  const computer = against.startsWith(COMPUTER)
    ? BOT_MEMBER_LIST.find((bot) => bot.id === against.slice(COMPUTER.length))
    : undefined;
  const here = opponents.filter((one) => one.here);
  const away = opponents.filter((one) => !one.here);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/games/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rules,
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
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="set-up-game">
      <SectionTitle kanji="準備">Set up the game</SectionTitle>
      {/*
        What it will be, in the same words the rules panel uses once it is a
        game — so what somebody agreed to and what they are playing read the
        same, rather than being described twice in two voices.
      */}
      <p className="text-sm font-semibold" data-testid="set-up-summary">
        {describeRules({ ...rules, handicap: NO_HANDICAP })}
      </p>
      <p className="text-xs text-muted">
        Nothing is started until you say so. Once it is, these are the rules it is played under.
      </p>

      <div className="mt-1 flex flex-col gap-3 border-t border-rule pt-3">
        <RulesForm value={rules} onChange={setRules} disabled={busy} showOpen={false} showVariant={false} />
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
                    {one.name}
                  </option>
                ))}
              </optgroup>
            ) : null}
            {away.length > 0 ? (
              <optgroup label="Players you know 知人">
                {away.map((one) => (
                  <option key={one.email} value={`m:${one.email}`}>
                    {one.name}
                  </option>
                ))}
              </optgroup>
            ) : null}
            <optgroup label="The computer 対コンピュータ">
              {BOT_MEMBER_LIST.map((bot) => (
                <option key={bot.id} value={`${COMPUTER}${bot.id}`}>
                  {bot.name} {BOT_PROFILES[bot.tier].kanji} · {BOT_PROFILES[bot.tier].strength}
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
        <Button onClick={start} disabled={busy || !signedIn} strong data-testid="set-up-start">
          {busy ? "Starting…" : "Start the game 開始"}
        </Button>
      </span>
      {!signedIn ? (
        <p className="text-xs text-muted">Sign in to start a game against somebody.</p>
      ) : null}
    </section>
  );
}
