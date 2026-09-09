"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { OPENING_RULES } from "@/lib/gomoku/gomoku.constants";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { OPENING_DISPLAY } from "@/lib/gomoku/openings.constants";
import type { OpeningRule, RuleVariant } from "@/lib/gomoku/gomoku.types";
import type { GameDetail } from "@/lib/history/gameHistory.types";

import { describeClock } from "@/lib/history/deadline";
import { Button, SectionTitle } from "@/components/ui/Controls";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { RATING_REFUSAL_DISPLAY, type RatingRefusal } from "@/lib/rating/rateable.constants";
import { penaltyMeans } from "./penalty";
import { RulesForm } from "./RulesForm";
import { RulesStatement } from "./RulesStatement";
import { draftFromGame, type RulesDraft } from "./rulesDraft";
import { describeHandicap, describeRules } from "./rulesSummary";

/**
 * The rules a shared game is played under, for everyone who opens its link,
 * and — for a seat holder, before the first stone — the means to change them.
 * The invited player never saw the settings the game was started from, so
 * this is the only place they learn what they are agreeing to.
 */
export function SharedRules({
  game,
  token,
  seat,
  refusal,
}: {
  game: GameDetail;
  token: string | null;
  seat: string | null;
  /**
   * Why this game will move no rating, when it will not. Decided on the
   * server — the rule reads the kept-record table — and said here rather than
   * discovered afterwards, when the ladder has not moved and there is nothing
   * left to ask.
   */
  refusal: RatingRefusal | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editable = seat !== null && token !== null && game.moveCount === 0;
  const variant = game.variant as RuleVariant;
  const copy = RULE_VARIANT_DISPLAY[variant];

  /*
   * One settled set of rules, sent whole. The form has already brought the
   * settings that cannot disagree into line — see `applyRulesChange` — so
   * there is nothing to merge or correct here, and no second copy of those
   * rules to fall out of step with the one on the setup screen.
   */
  async function change(merged: RulesDraft) {
    if (!editable) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/games/${game.id}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          ...merged,
          handicap: game.handicap.stone === null ? null : game.handicap,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Those rules could not be applied.");
      }
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Those rules could not be applied.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="shared-rules">
      <SectionTitle kanji="規則">Rules</SectionTitle>
      <p className="text-sm font-semibold" data-testid="shared-rules-line">
        {describeRules(game)}
      </p>
      {copy !== undefined ? (
        <p className="text-xs text-muted">{copy.tagline}</p>
      ) : null}
      {game.opening !== OPENING_RULES.free && game.opening in OPENING_DISPLAY ? (
        <p className="text-xs text-muted">
          {OPENING_DISPLAY[game.opening as OpeningRule].tagline}
        </p>
      ) : null}
      {describeHandicap(game.handicap) !== null ? (
        <p className="text-xs text-muted">
          The handicapped colour plays under those extra restrictions; the other colour plays the plain game.
        </p>
      ) : null}
      {game.openSeat !== null ? (
        <p className="text-xs text-moss" data-testid="shared-open-line">
          The {game.openSeat} seat is posted on the games page for anyone to take.
        </p>
      ) : null}
      <p className="text-xs text-muted" data-testid="shared-times-line">
        Started {new Date(game.playedAt).toLocaleString()}
        {game.status === "finished" && game.lastMoveAt !== null
          ? ` · finished ${new Date(game.lastMoveAt).toLocaleString()}`
          : ""}
      </p>
      {/*
        Only while the form is up. Once the statement is showing it says the
        clock, the ratings and the cost of running out of time as labelled
        rows, and this line was repeating all three of them word for word
        directly above it.
      */}
      {editable ? (
      <p className="text-xs text-muted" data-testid="shared-clock-line">
        {describeClock(game.clockMode, game.moveTimeMs)}
        {!game.rated ? ". Friendly: ratings unaffected" : ""}
        {game.moveTimeMs !== null && game.clockMode !== "game"
          ? `. ${penaltyMeans(game.timeoutPenalty)}`
          : ""}
      </p>
      ) : null}
      {refusal !== null ? (
        <p
          className="rounded-lg border border-ochre/60 bg-ochre-soft px-3 py-2 text-xs text-ink"
          data-testid="shared-unrated-line"
        >
          <span className="font-semibold">{RATING_REFUSAL_DISPLAY[refusal].playing}</span>{" "}
          <span className="font-mincho">{RATING_REFUSAL_DISPLAY[refusal].kanji}</span>
          {". "}
          {RATING_REFUSAL_DISPLAY[refusal].sentence}
        </p>
      ) : null}

      {/*
        Once a stone is down the form goes and the answers stay. Everything it
        was holding — the opening, whether resigning is allowed, what running
        out of time costs — used to leave the page with it, which is hardest on
        the player who was invited and never saw the settings to begin with.
      */}
      {!editable ? <RulesStatement rules={draftFromGame(game)} /> : null}

      {editable ? (
        <div className="mt-1 flex flex-col gap-3 border-t border-rule pt-3">
          <p className="text-xs text-muted">
            Either player may change the rules until the first stone is down.
          </p>
          <RulesForm value={draftFromGame(game)} onChange={(next) => void change(next)} disabled={saving} />
          {game.handicap.stone !== null ? (
            <Button
              onClick={() =>
                void fetch(`/api/games/${game.id}/settings`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    token,
                    size: game.size,
                    variant: game.variant,
                    obstacles: game.obstacles,
                    opening: game.opening,
                    moveTimeMs: game.moveTimeMs,
                    timeoutPenalty: game.timeoutPenalty,
                    handicap: null,
                  }),
                }).then(() => router.refresh())
              }
              disabled={saving}
            >
              Remove the handicap
            </Button>
          ) : null}
          {error !== null ? (
            <p className="text-xs text-shu">{error}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
