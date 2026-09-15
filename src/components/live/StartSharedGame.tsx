"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { OPENING_RULES } from "@/lib/gomoku/gomoku.constants";
import { hasHeadStart } from "@/lib/gomoku/rules/headStart";
import type { GameSettings } from "@/lib/gomoku/gomoku.types";
import { seatPath } from "@/lib/gomoku/slugs";
import { Button, SectionTitle } from "@/components/ui/Controls";
import { GAME_COPY } from "@/components/game/game.constants";
import type { GameDefaults } from "@/components/game/gameDefaults";
import { SHARED_OPENINGS } from "@/lib/history/gameSettingsSchema";
import type { CreatedGame } from "@/lib/history/liveGame.types";
import { RulesForm } from "./RulesForm";
import type { RulesDraft } from "./rulesDraft";
import { describeRules } from "./rulesSummary";

/**
 * Starts a game that lives on the server and can be played from two devices.
 *
 * The creator lands on their own seat link, holding both — the other seat's
 * link is theirs to hand over, which is what stands in for an invitation when
 * there is nobody to send an email to.
 *
 * THE RULES ARE `RulesForm`'s, NOT THIS PANEL'S. It used to draw its own clock,
 * penalty, rating and switches beside the form every other way into a game
 * uses, and the two had already drifted — other hints, another order, other
 * test ids — which is the second place a rule can be described that the board
 * row about it predicted. `rulesForm.coverage.test.ts` stops it coming back.
 */
export function StartSharedGame({
  settings,
  postSeat = false,
  defaults,
}: {
  settings: GameSettings;
  /** Arrived to post a seat: the other seat starts open, and this panel comes into view. */
  postSeat?: boolean;
  /** Where a new game starts for this member: the clock, and whether it counts. */
  defaults: GameDefaults;
}) {
  const router = useRouter();
  const panel = useRef<HTMLElement>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /*
   * ONLY WHAT THIS PANEL ASKS. The game, the board, the blocks, the opening and
   * the handicap belong to the scratch board beside it and are read from
   * `settings` on every render, so the form can never hold a stale copy of a
   * board somebody has since changed.
   */
  const [choices, setChoices] = useState<
    Omit<RulesDraft, "variant" | "size" | "obstacles" | "opening" | "handicap" | "headStart">
  >({
    moveTimeMs: defaults.moveTimeMs,
    timeoutPenalty: "turn",
    clockMode: "move",
    rated: defaults.rated,
    allowResign: true,
    open: postSeat,
  });
  // Swap openings move colours between players, which a seat link cannot follow.
  const sharedOpening = SHARED_OPENINGS.includes(settings.opening)
    ? settings.opening
    : OPENING_RULES.free;
  const rules: RulesDraft = {
    ...choices,
    variant: settings.variant,
    size: settings.size,
    obstacles: settings.obstacles,
    opening: sharedOpening,
    handicap: settings.handicap,
    headStart: settings.headStart,
  };

  // The panel sits beside the board on a wide screen and below it on a phone;
  // someone who came to post a seat should not have to go looking for it.
  useEffect(() => {
    if (postSeat) panel.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [postSeat]);

  async function start() {
    setStarting(true);
    setError(null);

    try {
      const response = await fetch("/api/games/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          size: rules.size,
          variant: rules.variant,
          obstacles: rules.obstacles,
          opening: rules.opening,
          handicap: rules.handicap.stone === null ? null : rules.handicap,
          headStart: hasHeadStart(rules) ? rules.headStart : null,
          moveTimeMs: rules.moveTimeMs,
          timeoutPenalty: rules.timeoutPenalty,
          clockMode: rules.clockMode,
          rated: rules.rated,
          allowResign: rules.allowResign,
          open: rules.open,
        }),
      });

      if (!response.ok) throw new Error("The game could not be started.");

      const created = (await response.json()) as CreatedGame;
      router.push(seatPath(settings.variant, created.id, created.blackToken));
    } catch {
      setError("Could not start a shared game. Try again.");
      setStarting(false);
    }
  }

  return (
    <section ref={panel} id="post-seat" className="flex scroll-mt-6 flex-col gap-2">
      <SectionTitle kanji="通信対局">Play apart</SectionTitle>
      {postSeat ? (
        <p className="text-xs text-moss" data-testid="post-seat-note">
          Posting a seat: start the game and the other seat goes on the games page for whoever
          answers first. To change the game or the board first, use Set up, under the board.
        </p>
      ) : null}
      <p className="text-xs text-muted">
        The board here is a local game and stays in this browser. A shared game
        gets its own address and a QR code for each player, so you can take
        turns from two devices.
      </p>
      <p className="text-xs text-ink-soft" data-testid="shared-rules-summary">
        {describeRules(rules)}
        {sharedOpening !== settings.opening ? ` ${GAME_COPY.sharedOpeningNote}` : ""}
      </p>
      <RulesForm
        value={rules}
        onChange={(next) =>
          setChoices({
            moveTimeMs: next.moveTimeMs,
            timeoutPenalty: next.timeoutPenalty,
            clockMode: next.clockMode,
            rated: next.rated,
            allowResign: next.allowResign,
            open: next.open,
          })
        }
        disabled={starting}
        settledByBoard
        /*
         * NULL, AND ESTABLISHED RATHER THAN DEFAULTED. This panel sends no
         * `hotSeat`, `from` or `rematch`, so `resolveAgainst` leaves `hotSeat`
         * false and the game gets two different seat tokens — `isHotSeat` is
         * false of it for life, and `ratedAtCreation` honours the `rated` sent.
         * What is left is the NAMES, which are blank when the row is written
         * and filled as members sit down (`bindSeat`), so `ratingRefusal` has
         * nothing to decide until the game ends. Nothing is settled against a
         * rating before this game exists, so the choice is a real one.
         */
        refused={null}
      />
      <Button onClick={start} disabled={starting} data-testid="start-shared-game">
        {starting ? "Starting…" : "Start a shared game"}
      </Button>
      {error !== null ? (
        <p className="text-xs text-shu">{error}</p>
      ) : null}
    </section>
  );
}
