"use client";

import { useState } from "react";

import { Paired } from "@/components/i18n/Paired";
import { phraseWith } from "@/components/i18n/phraseWith";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
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

const LENGTH_NAME = { short: "pkumi.length.short", medium: "pkumi.length.medium", full: "pkumi.length.full" } as const;

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
  const say = useSpeaker();
  const hydrated = useHydrated();
  const [language, setLanguage] = useState<KumimojiLanguage>("english");
  const [kana, setKana] = useState("は");
  const mix = mixShown(language);
  const rows = lengthRows(KUMIMOJI_HANDS.classic);
  const quickShort = kumimojiTileCount(KUMIMOJI_HANDS.quick, "short");

  return (
    <section className={`${PANEL_CLASS} flex min-w-0 flex-col gap-3`} data-testid="kumimoji-tiles" data-language={language} {...readyMark(hydrated)}>
      <h2 className={SECTION_TITLE}>
        <Paired en={say.say("pkumi.tiles.heading")} kanji="牌" kanjiClassName="normal-case tracking-normal" inReadersLanguage />
      </h2>
      <ViewTabs
        label={say.say("pkumi.tiles.which")}
        testId="kumimoji-tiles-language"
        items={[
          { key: "english", label: say.say("pkumi.opts.english"), current: language === "english", onClick: () => setLanguage("english"), testId: "kumimoji-tiles-english" },
          {
            key: "japanese",
            label: <Paired en={say.say("pkumi.tiles.japanese")} kanji="ひらがな" inReadersLanguage />,
            current: language === "japanese",
            onClick: () => setLanguage("japanese"),
            testId: "kumimoji-tiles-japanese",
          },
        ]}
      />
      <p className="text-sm" data-testid="kumimoji-tiles-summary">
        {say.count("pkumi.tiles.summary", mix.fewest, {
          total: String(mix.total),
          kinds: say.count(language === "english" ? "puzzle.count.letter" : "puzzle.count.kana", mix.tiles.length),
          commonest: mix.commonest.join(", ").toUpperCase(),
          most: String(mix.most),
          rarest: mix.rarest.join(" ").toUpperCase(),
        })}
      </p>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-x-1 gap-y-2" aria-label={say.say(language === "english" ? "pkumi.tiles.setEnglish" : "pkumi.tiles.setJapanese")} data-testid="kumimoji-mix">
        {mix.tiles.map((tile) => (
          <li key={tile.code} className="flex flex-col items-center gap-0.5" data-testid="kumimoji-mix-tile" data-glyph={tile.glyph} data-count={tile.count}>
            {language === "japanese" ? (
              <button
                type="button"
                onClick={() => setKana(tile.glyph)}
                aria-pressed={kana === tile.glyph}
                aria-label={say.say("pkumi.tiles.formAria", { glyph: tile.glyph, count: String(tile.count) })}
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
          {say.say(language === "english" ? "pkumi.tiles.wildLetter" : "pkumi.tiles.wildKana")}
        </span>
      </div>
      <h3 className="pt-1 text-sm font-semibold">
        <Paired en={say.say("pkumi.tiles.howMany")} kanji="枚数" kanjiClassName="text-xs font-normal text-muted" inReadersLanguage />
      </h3>
      <div className={TABLE_SCROLL}>
        <table className="w-full text-sm tabular-nums" data-testid="kumimoji-lengths">
          <thead>
            <tr className="border-b border-rule text-left text-xs text-muted">
              <th className="py-1 pr-2 font-medium">{say.say("pkumi.tiles.colLength")}</th>
              <th className="py-1 pr-2 font-medium">{say.say("pkumi.tiles.colTiles")}</th>
              <th className="py-1 pr-2 font-medium">{say.say("pkumi.tiles.colDouble")}</th>
              <th className="py-1 font-medium">{say.say("pkumi.tiles.colWild")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.length} className="border-b border-rule/60 last:border-0" data-testid="kumimoji-length" data-length={row.length}>
                <td className="py-1 pr-2">{say.say(LENGTH_NAME[row.length])}</td>
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
        {say.say("pkumi.tiles.foot", { classic: String(KUMIMOJI_HANDS.classic), quick: String(KUMIMOJI_HANDS.quick), quickShort: String(quickShort) })}
      </p>
      <p className="text-sm">
        <Link href={gamePath(PUZZLE_KINDS.kumimoji)} className="font-semibold underline-offset-2 hover:underline" data-testid="kumimoji-tiles-to-front">
          {say.say("pkumi.tiles.toFront")}
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
  const say = useSpeaker();
  const forms = formsOfTile(kana);
  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-paper/60 p-3 text-sm" data-testid="kumimoji-kana-forms" data-kana={kana} aria-live="polite">
      <p>
        {phraseWith(forms.length === 1 ? say.say("pkumi.tiles.formsOne") : say.say("pkumi.tiles.formsMany", { count: String(forms.length) }), { kana: <span className="font-semibold">{kana}</span> })}
      </p>
      <ul className="flex flex-wrap gap-1.5" aria-label={say.say("pkumi.tiles.formsAria", { kana })}>
        {forms.map((form) => (
          <li key={form} className={`${TILE} font-normal`} style={{ width: MIX_TILE_PX, height: MIX_TILE_PX, fontSize: tileLetterPx(MIX_TILE_PX) }} data-testid="kumimoji-kana-form">
            {form}
          </li>
        ))}
      </ul>
    </div>
  );
}
