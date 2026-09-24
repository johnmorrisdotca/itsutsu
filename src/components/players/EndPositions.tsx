"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Controls";
import { INPUT_CLASS, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { replayGame } from "@/lib/gomoku/replay";
import { slugFor } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import type { GameDetail } from "@/lib/history/gameHistory.types";
import { ENDINGS_COPY, ENDINGS_OUTCOME_LIST, ENDINGS_OUTCOMES, type EndingsOutcome } from "@/lib/history/endings.constants";
import { frameOf, mosaicSvg } from "@/lib/record/mosaic";
import { MOSAIC_COPY } from "@/lib/record/mosaic.constants";
import type { MosaicFrame } from "@/lib/record/mosaic.types";
import { nextPaint, pngOf, screenPixels } from "@/lib/record/mosaicImage";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

/** The board size most of these games were played on: a picture has one size, and the rest are said to be left out. */
function commonSize(games: readonly GameDetail[]): number {
  const counts = new Map<number, number>();
  for (const game of games) counts.set(game.size, (counts.get(game.size) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
}

/**
 * A PLAYER'S GAMES OF ONE KIND, EACH AS IT ENDED, on one picture. John,
 * 2026-09-23: "a mosaic of all their end games where they win (or lose)… download
 * all from the client side and it wouldn't be too intensive."
 *
 * One press is one read — `fetchEndings`, the moves of up to a picture's worth
 * of games — and everything after it happens here: each game replayed to its
 * last position, drawn by `mosaicSvg`, turned into a PNG by the canvas. Nothing
 * is stored anywhere; ask again tomorrow and the newest games are in it.
 */
export function EndPositions({
  memberId,
  name,
  variants,
}: {
  memberId: string;
  name: string;
  /** The games this player has finished here, most played first — see `ItsutsuRecord`'s breakdown. */
  variants: readonly RuleVariant[];
}) {
  const hydrated = useHydrated();
  const [variant, setVariant] = useState<RuleVariant>(variants[0]);
  const [outcome, setOutcome] = useState<EndingsOutcome>(ENDINGS_OUTCOMES.won);
  const [made, setMade] = useState<{ url: string; name: string; count: number; left: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => () => {
    if (made !== null) URL.revokeObjectURL(made.url);
  }, [made]);

  if (variants.length === 0) return null;

  async function make() {
    setBusy(true);
    setNote(null);
    await nextPaint();
    try {
      const answer = await fetch(`/api/members/${encodeURIComponent(memberId)}/endings?variant=${variant}&outcome=${outcome}`);
      if (!answer.ok) throw new Error(`status ${answer.status}`);
      const { games } = (await answer.json()) as { games: GameDetail[] };
      const size = commonSize(games);
      const onBoard = games.filter((game) => game.size === size);
      const frames: MosaicFrame[] = [];
      for (const [i, game] of onBoard.entries()) {
        try {
          frames.push(frameOf(replayGame(game)));
        } catch (error) {
          // A game that will not replay is left out of the picture, not allowed to spoil it.
          console.error("[endings] could not replay", game.id, error);
        }
        // A breath every few games, so a long list never holds the page still.
        if (i % 12 === 11) await nextPaint();
      }
      if (frames.length === 0) {
        setMade(null);
        setNote(ENDINGS_COPY.none);
        return;
      }
      const { width, height } = screenPixels();
      const svg = mosaicSvg({
        frames,
        size,
        grid: VARIANT_SPECS[variant].grid,
        width,
        height,
        fillSpare: true,
        details: [
          name,
          `${RULE_VARIANT_DISPLAY[variant].label} · ${size}×${size}`,
          `${ENDINGS_COPY.outcomes[outcome]} · ${frames.length} ${frames.length === 1 ? "game" : "games"}`,
          MOSAIC_COPY.site,
        ],
      });
      const blob = await pngOf(svg, width, height);
      setMade({
        url: URL.createObjectURL(blob),
        name: `itsutsu-${slugFor(variant)}-${outcome}-endings.png`,
        count: frames.length,
        left: games.length - onBoard.length,
      });
    } catch (error) {
      console.error("[endings] could not draw", error);
      setNote(ENDINGS_COPY.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="end-positions" {...readyMark(hydrated)}>
      <h2 className={SECTION_TITLE}>
        {ENDINGS_COPY.heading} <span className="font-mincho normal-case tracking-normal">{ENDINGS_COPY.kanji}</span>
      </h2>
      <p className="text-sm text-ink-soft">{ENDINGS_COPY.blurb}</p>
      <span className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          {ENDINGS_COPY.gameLabel}
          <select className={INPUT_CLASS} value={variant} onChange={(event) => setVariant(event.target.value as RuleVariant)} data-testid="endings-game">
            {variants.map((choice) => (
              <option key={choice} value={choice}>
                {RULE_VARIANT_DISPLAY[choice].label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {ENDINGS_COPY.outcomeLabel}
          <select className={INPUT_CLASS} value={outcome} onChange={(event) => setOutcome(event.target.value as EndingsOutcome)} data-testid="endings-outcome">
            {ENDINGS_OUTCOME_LIST.map((choice) => (
              <option key={choice} value={choice}>
                {ENDINGS_COPY.outcomes[choice]}
              </option>
            ))}
          </select>
        </label>
        <Button onClick={make} disabled={busy} data-testid="make-endings">
          {busy ? ENDINGS_COPY.making : ENDINGS_COPY.make}
        </Button>
        {made !== null ? (
          <a href={made.url} download={made.name} className="text-sm font-semibold underline underline-offset-4" data-testid="download-endings">
            {ENDINGS_COPY.download}
          </a>
        ) : null}
      </span>
      {note !== null ? <p className="text-sm text-muted" data-testid="endings-note">{note}</p> : null}
      {made !== null && made.left > 0 ? <p className="text-xs text-muted">{ENDINGS_COPY.otherSizes(made.left)}</p> : null}
      {made !== null ? (
        // eslint-disable-next-line @next/next/no-img-element -- a picture made in this browser a moment ago; there is nothing to optimise
        <img src={made.url} alt={`How ${made.count} ${made.count === 1 ? "game" : "games"} ended`} className="w-full rounded-lg border border-rule" data-testid="endings-picture" />
      ) : null}
    </section>
  );
}
