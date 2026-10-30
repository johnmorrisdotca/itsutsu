"use client";

import { useEffect, useState } from "react";

import { country, countryName } from "@johnmorrisdotca/kuni";

import { BOARD_THEMES, DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { KUNIATE_CAPITAL, KUNIATE_FLAG } from "@/lib/puzzles/kuniate/code";

import { PuzzleBoard } from "../PuzzleBoard";
import { KUNIATE_FLAGS, KUNIATE_OUTLINES } from "./loaders.constants";

/** The rim of the wood round a clue: the same as a middling grid's, since a clue has no squares to count. */
const FRAME_SIDE = 9;
const INK = "#1c1917";
const PAPER = "#ffffff";

type Shown = { code: string; size: number; outline?: { viewBox: string; path: string }; flag?: string } | null;

/**
 * WHAT A KUNIATE ASKS: the outline, flag or capital of a country, on white paper in the wood every
 * board has (`PuzzleBoard`). The outline is the country's whole shape in ink with no name, no border
 * inside it and nothing around it; the flag is as Hata draws it, at its own proportions; the capital is its name.
 * Each is fetched for this one country and nothing else (`loaders.constants.ts`).
 */
export function KuniateClue({ code, size }: { code: string; size: number }) {
  const say = useSpeaker();
  const [shown, setShown] = useState<Shown>(null);
  const way = size;

  useEffect(() => {
    let live = true;
    if (way === KUNIATE_CAPITAL) return undefined;
    if (way === KUNIATE_FLAG) {
      void KUNIATE_FLAGS[code]?.().then((module) => live && setShown({ code, size: way, flag: module.default }));
    } else {
      void KUNIATE_OUTLINES[code]?.().then((module) => live && setShown({ code, size: way, outline: { viewBox: module.default.viewBox, path: module.default.regions.map((region) => region.path).join(" ") } }));
    }
    return () => {
      live = false;
    };
  }, [code, way]);

  const here = shown !== null && shown.code === code && shown.size === way ? shown : null;
  const capital = way === KUNIATE_CAPITAL ? (country(code)?.capital?.[say.locale === "ja" ? "ja" : "en"] ?? null) : null;

  return (
    <div className="w-full select-none" data-testid="puzzle-grid" data-kind="kuniate" data-size={size} data-way={way === KUNIATE_CAPITAL ? "capital" : way === KUNIATE_FLAG ? "flag" : "outline"}>
      <PuzzleBoard size={FRAME_SIDE} coordinates={false} theme={BOARD_THEMES[DEFAULT_APPEARANCE.boardTheme]}>
        <div className="flex h-full w-full items-center justify-center p-[6%]" style={{ background: PAPER }} data-testid="kuniate-clue" data-loaded={way === KUNIATE_CAPITAL || here !== null ? "true" : "false"}>
          {way === KUNIATE_CAPITAL ? (
            <p className="text-center text-2xl font-semibold sm:text-4xl" style={{ color: INK }} data-testid="kuniate-capital">
              {capital}
            </p>
          ) : here?.outline !== undefined ? (
            <svg viewBox={here.outline.viewBox} className="block h-full w-full" role="img" aria-label={say.say("pword.kuniate.outlineLabel")} data-testid="kuniate-outline">
              <path d={here.outline.path} fill={INK} />
            </svg>
          ) : here?.flag !== undefined ? (
            <span className="flex max-h-full w-full items-center justify-center [&>svg]:h-auto [&>svg]:max-h-full [&>svg]:w-full [&>svg]:shadow-[0_0_0_1px_#d6d3d1]" role="img" aria-label={say.say("pword.kuniate.flagLabel")} data-testid="kuniate-flag" dangerouslySetInnerHTML={{ __html: here.flag }} />
          ) : null}
        </div>
      </PuzzleBoard>
    </div>
  );
}

/** A place's name in the reader's language, short where it has a short form. */
export function placeName(code: string, locale: string): string {
  return countryName(code, locale === "ja" ? "ja" : "en", { short: true }) ?? code;
}
