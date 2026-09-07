"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  BOARD_SIZES,
  OPENING_RULES,
  RULE_VARIANT_LIST,
} from "@/lib/gomoku/gomoku.constants";
import {
  OPENING_DISPLAY,
  RULE_VARIANT_DISPLAY,
} from "@/lib/gomoku/variants.constants";
import type { OpeningRule, RuleVariant } from "@/lib/gomoku/gomoku.types";
import type { GameDetail } from "@/lib/history/gameHistory.types";
import { SHARED_OPENINGS } from "@/lib/history/gameSettingsSchema";
import { Button, Field, SectionTitle, Select } from "@/components/ui/Controls";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
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
}: {
  game: GameDetail;
  token: string | null;
  seat: string | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editable = seat !== null && token !== null && game.moveCount === 0;
  const variant = game.variant as RuleVariant;
  const copy = RULE_VARIANT_DISPLAY[variant];

  async function change(next: Partial<{ size: number; variant: string; opening: string }>) {
    if (!editable) return;
    setSaving(true);
    setError(null);
    const merged = {
      size: game.size,
      variant: game.variant,
      obstacles: game.obstacles,
      opening: game.opening,
      ...next,
    };
    // A variant that does not offer the current opening drops back to free.
    if (!SHARED_OPENINGS.includes(merged.opening as OpeningRule)) {
      merged.opening = OPENING_RULES.free;
    }
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

      {editable ? (
        <div className="mt-1 flex flex-col gap-3 border-t border-rule pt-3">
          <p className="text-xs text-muted">
            Either player may change the rules until the first stone is down.
          </p>
          <Field label="Rules">
            <Select
              value={game.variant}
              disabled={saving}
              onChange={(event) => change({ variant: event.target.value })}
              data-testid="shared-rules-variant"
            >
              {RULE_VARIANT_LIST.map((option) => (
                <option key={option} value={option}>
                  {RULE_VARIANT_DISPLAY[option].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Board">
            <Select
              value={game.size}
              disabled={saving}
              onChange={(event) => change({ size: Number(event.target.value) })}
            >
              {BOARD_SIZES.map((option) => (
                <option key={option} value={option}>
                  {option}×{option}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Opening">
            <Select
              value={game.opening}
              disabled={saving}
              onChange={(event) => change({ opening: event.target.value })}
            >
              {SHARED_OPENINGS.map((option) => (
                <option key={option} value={option}>
                  {OPENING_DISPLAY[option].label}
                </option>
              ))}
            </Select>
          </Field>
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
            <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
