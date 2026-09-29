"use client";

import { useState } from "react";

import Link from "@/components/ui/Link";
import { PANEL_CLASS, SECTION_TITLE, TABLE_SCROLL } from "@/components/ui/ui.constants";
import { ViewTabs } from "@/components/ui/ViewTabs";
import { gamePath } from "@/lib/gomoku/slugs";
import type { KumimojiLanguage } from "@/lib/puzzles/kumimoji/kumimoji.types";
import { formsOfTile, lengthRows, mixShown, type MixTile } from "@/lib/puzzles/kumimoji/showcase";
import { tileFace } from "@/lib/puzzles/kumimoji/tileFace";
import { KUMIMOJI_HANDS, kumimojiTileCount } from "@/lib/puzzles/kumimoji/tiles.constants";
import { PUZZLE_KINDS } from "@/lib/puzzles/puzzles.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { TILE, tileLetterPx } from "./kumimoji.constants";
import { MIX_TILE_PX } from "./kumimojiShowcase.constants";
import { TileFace, wildStyle } from "./KumimojiTileFace";

const LENGTH_NAME = { short: "Short", medium: "Medium", full: "Full" } as const;

/**
 * THE TILES, COUNTED: the whole English set and the whole Japanese set as the
 * game deals them, each tile drawn as the game draws it with its count and a
 * bar against the commonest, so the hard ones are plainly few. Then how many
 * tiles each length of game takes, and how many of those are wild at each
 * level. All of it read from `tiles.constants.ts` through `showcase.ts`;
 * nothing here is a number of its own.
 *
 * In Japanese a tile is pressed to show every kana it plays as (`formsOfTile`,
 * the word check's own rule): the corner shows the common ones, and here the
 * rare ones too. Everything happens in the browser; the page is prerendered.
 */
export function KumimojiTiles() {
  const hydrated = useHydrated();
  const [language, setLanguage] = useState<KumimojiLanguage>("english");
  const [kana, setKana] = useState("は");
  const mix = mixShown(language);
  const rows = lengthRows(KUMIMOJI_HANDS.classic);
  const quickShort = kumimojiTileCount(KUMIMOJI_HANDS.quick, "short");

  return (
    <section className={`${PANEL_CLASS} flex min-w-0 flex-col gap-3`} data-testid="kumimoji-tiles" data-language={language} {...readyMark(hydrated)}>
      <h2 className={SECTION_TITLE}>
        The tiles <span className="font-mincho normal-case tracking-normal">牌</span>
      </h2>
      <ViewTabs
        label="Which set of tiles"
        testId="kumimoji-tiles-language"
        items={[
          { key: "english", label: "English", current: language === "english", onClick: () => setLanguage("english"), testId: "kumimoji-tiles-english" },
          {
            key: "japanese",
            label: (
              <>
                Japanese <span className="font-mincho">ひらがな</span>
              </>
            ),
            current: language === "japanese",
            onClick: () => setLanguage("japanese"),
            testId: "kumimoji-tiles-japanese",
          },
        ]}
      />
      <p className="text-sm" data-testid="kumimoji-tiles-summary">
        {mix.total} tiles in {mix.tiles.length} {language === "english" ? "letters" : "kana"}. The most is {mix.commonest.join(", ").toUpperCase()}, {mix.most} of them; the hard ones are{" "}
        {mix.rarest.join(" ").toUpperCase()}, only {mix.fewest === 1 ? "one" : mix.fewest} of each.
      </p>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-x-1 gap-y-2" aria-label={`The ${language} set`} data-testid="kumimoji-mix">
        {mix.tiles.map((tile) => (
          <li key={tile.code} className="flex flex-col items-center gap-0.5" data-testid="kumimoji-mix-tile" data-glyph={tile.glyph} data-count={tile.count}>
            {language === "japanese" ? (
              <button
                type="button"
                onClick={() => setKana(tile.glyph)}
                aria-pressed={kana === tile.glyph}
                aria-label={`${tile.glyph}, ${tile.count} in the set. Show every form it plays as.`}
                className={`rounded-[18%] ${kana === tile.glyph ? "ring-2 ring-moss ring-offset-1" : ""}`}
              >
                <Tile tile={tile} />
              </button>
            ) : (
              <Tile tile={tile} />
            )}
            <span className={`text-xs tabular-nums ${tile.count === mix.fewest ? "font-semibold text-shu" : "text-muted"}`}>{tile.count}</span>
            <span className="h-1 w-full rounded-full bg-rule/60" aria-hidden="true">
              <span className={`block h-1 rounded-full ${tile.count === mix.fewest ? "bg-shu" : "bg-moss"}`} style={{ width: `${Math.round((tile.count / mix.most) * 100)}%` }} />
            </span>
          </li>
        ))}
      </ul>
      {language === "japanese" ? <KanaForms kana={kana} /> : null}
      <div className="flex items-center gap-2 text-sm" data-testid="kumimoji-mix-wild">
        <span className={`${TILE} relative shrink-0`} style={wildStyle(tileFace("*"), { width: MIX_TILE_PX, height: MIX_TILE_PX, fontSize: tileLetterPx(MIX_TILE_PX) })} aria-hidden="true">
          <TileFace face={tileFace("*")} />
        </span>
        <span>
          The wild tile stands in for some of a game&apos;s tiles, most at easy and none at hard: it is any {language === "english" ? "letter" : "kana"} you choose, and you can change your mind.
        </span>
      </div>
      <h3 className="pt-1 text-sm font-semibold">
        How many tiles a game takes <span className="font-mincho text-xs font-normal text-muted">枚数</span>
      </h3>
      <div className={TABLE_SCROLL}>
        <table className="w-full text-sm tabular-nums" data-testid="kumimoji-lengths">
          <thead>
            <tr className="border-b border-rule text-left text-xs text-muted">
              <th className="py-1 pr-2 font-medium">Length</th>
              <th className="py-1 pr-2 font-medium">Tiles</th>
              <th className="py-1 pr-2 font-medium">Double set</th>
              <th className="py-1 font-medium">Wild at easy · medium · hard</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.length} className="border-b border-rule/60 last:border-0" data-testid="kumimoji-length" data-length={row.length}>
                <td className="py-1 pr-2">{LENGTH_NAME[row.length]}</td>
                <td className="py-1 pr-2">{row.tiles}</td>
                <td className="py-1 pr-2">{row.doubleTiles}</td>
                <td className="py-1">
                  {row.wilds.easy} · {row.wilds.medium} · {row.wilds.hard}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        With the {KUMIMOJI_HANDS.classic}-tile hand. A Short game from the {KUMIMOJI_HANDS.quick}-tile hand is {quickShort} tiles. The Double set is two English sets together; Japanese plays one.
      </p>
      <p className="text-sm">
        <Link href={gamePath(PUZZLE_KINDS.kumimoji)} className="font-semibold underline-offset-2 hover:underline" data-testid="kumimoji-tiles-to-front">
          Pictures of it being played, and a hand to try, on the game&apos;s page →
        </Link>
      </p>
    </section>
  );
}

function Tile({ tile }: { tile: MixTile }) {
  const face = tileFace(tile.code);
  return (
    <span className={`${TILE} relative`} style={wildStyle(face, { width: MIX_TILE_PX, height: MIX_TILE_PX, fontSize: tileLetterPx(MIX_TILE_PX) })}>
      <TileFace face={face} />
    </span>
  );
}

/** One kana tile and every kana it plays as, drawn as tiles so the reader sees what a line of them spells. */
function KanaForms({ kana }: { kana: string }) {
  const forms = formsOfTile(kana);
  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-paper/60 p-3 text-sm" data-testid="kumimoji-kana-forms" data-kana={kana} aria-live="polite">
      <p>
        <span className="font-semibold">{kana}</span>{" "}
        {forms.length === 1 ? "plays as itself alone." : `plays as ${forms.length} kana, with nothing to choose: a line is a word if it spells one read any of these ways.`}
      </p>
      <ul className="flex flex-wrap gap-1.5" aria-label={`What ${kana} plays as`}>
        {forms.map((form) => (
          <li key={form} className={`${TILE} font-normal`} style={{ width: MIX_TILE_PX, height: MIX_TILE_PX, fontSize: tileLetterPx(MIX_TILE_PX) }} data-testid="kumimoji-kana-form">
            {form}
          </li>
        ))}
      </ul>
    </div>
  );
}
