"use client";

import { useMemo, type CSSProperties } from "react";

import { BIG_FAMILIES, SUIDO_BIG_FAMILIES_GUIDE, SUIDO_PIECE_GUIDE, type GuidePiece, type PieceGroup } from "@johnmorrisdotca/suido";
import { drawGuidePiece, SUIDO_STYLE } from "@johnmorrisdotca/suido/draw";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";
import { PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { GUIDE_WORDS } from "./suidoGuideWords";

/** The small pieces' groups, in the order the page shows them, each with its heading; the big pieces and the families have sections of their own. */
const SMALL_GROUPS = [
  { group: "turn", title: "pmaze.guide.groupTurn" },
  { group: "water", title: "pmaze.guide.groupWater" },
  { group: "twist", title: "pmaze.guide.groupTwist" },
  { group: "block", title: "pmaze.guide.groupBlock" },
] as const satisfies readonly { group: PieceGroup; title: PhraseKey }[];

/** Two to a row on a phone, and as many as fit from a tablet's width, each as wide as its drawing and its words need. */
const SMALL_GRID = "grid grid-cols-2 gap-x-3 gap-y-4 sm:flex sm:flex-wrap sm:gap-x-4 sm:gap-y-3";

/** How wide a piece is drawn: a cell is this many pixels, so a big piece is twice as wide as a small one and every pipe is the same thickness. */
const CELL_PX = 52;

/**
 * THE GUIDE TO EVERY PIECE, on Suido's rules page: each piece the package has, drawn by the package itself (`drawGuidePiece`, from
 * `SUIDO_PIECE_GUIDE`), with its name and what it does in the reader's language (`suidoGuideWords.ts`). The small pieces by group, the big
 * pieces (a few of the 699 shapes), and one big piece of each of the 32 families. It is drawn in the browser only (`SuidoPieceGuideLazy`),
 * so the package's guide, its drawing and its 699 shapes are not in any page's server function.
 */
export function SuidoPieceGuide() {
  const say = useSpeaker();
  const hydrated = useHydrated();
  const figures = useMemo(() => Object.fromEntries([...SUIDO_PIECE_GUIDE, ...SUIDO_BIG_FAMILIES_GUIDE].map((piece) => [piece.id, drawGuidePiece(piece)])), []);

  const figure = (piece: GuidePiece, name: string, text: string | null) => (
    <figure key={piece.id} className="flex min-w-0 flex-col gap-1 sm:w-(--piece-width)" style={{ "--piece-width": `max(10.5rem, ${piece.layout.width * CELL_PX}px)` } as CSSProperties} data-testid="suido-guide-piece" data-piece={piece.id}>
      <div style={{ width: piece.layout.width * CELL_PX, maxWidth: "100%" }} className="mx-auto [&_svg]:block [&_svg]:h-auto [&_svg]:w-full" aria-hidden="true" dangerouslySetInnerHTML={{ __html: figures[piece.id]! }} />
      <figcaption className="text-xs leading-snug">
        <strong className="block text-center font-semibold">{name}</strong>
        {text === null ? null : <span className="mt-0.5 block text-muted">{text}</span>}
      </figcaption>
    </figure>
  );
  const word = (piece: GuidePiece) => {
    const words = GUIDE_WORDS[piece.id]!;
    return figure(piece, say.say(words.name), say.say(words.text));
  };

  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-4`} data-testid="suido-guide" {...readyMark(hydrated)}>
      {/* The board's own style, once for every drawing here: its colours follow the device's light or dark. */}
      <style>{SUIDO_STYLE}</style>
      <h2 className={SECTION_TITLE}>{say.say("pmaze.guide.title")}</h2>
      <p className="text-sm">{say.say("pmaze.guide.lead")}</p>
      {SMALL_GROUPS.map(({ group, title }) => (
        <div key={group} className="flex flex-col gap-2" data-testid="suido-guide-group" data-group={group}>
          <h3 className="text-sm font-semibold text-muted">{say.say(title)}</h3>
          <div className={SMALL_GRID}>{SUIDO_PIECE_GUIDE.filter((piece) => piece.group === group).map(word)}</div>
        </div>
      ))}
      <div className="flex flex-col gap-2" data-testid="suido-guide-group" data-group="big">
        <h3 className="text-sm font-semibold text-muted">{say.say("pmaze.guide.bigTitle")}</h3>
        <p className="text-sm">{say.say("pmaze.guide.bigLead")}</p>
        <div className={SMALL_GRID}>{SUIDO_PIECE_GUIDE.filter((piece) => piece.group === "big").map(word)}</div>
      </div>
      <div className="flex flex-col gap-2" data-testid="suido-guide-group" data-group="families">
        <h3 className="text-sm font-semibold text-muted">{say.say("pmaze.guide.familiesTitle")}</h3>
        <p className="text-sm">{say.say("pmaze.guide.familiesLead")}</p>
        <div className="grid grid-cols-4 gap-x-2 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-4">
          {SUIDO_BIG_FAMILIES_GUIDE.map((piece, at) => figure(piece, say.say("pmaze.guide.family", { family: BIG_FAMILIES[at]!.family, count: String(BIG_FAMILIES[at]!.shapes) }), null))}
        </div>
      </div>
    </section>
  );
}
