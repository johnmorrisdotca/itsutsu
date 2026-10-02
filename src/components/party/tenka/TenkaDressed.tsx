"use client";

import { tenkaDressing, type TenkaDressing, type TenkaDrawn } from "@johnmorrisdotca/tenka/dressing";
import { useEffect, useMemo, useRef, type CSSProperties } from "react";

import type { TenkaCardKind, TenkaMapKey, TenkaOwner } from "@/lib/party/tenka/tenka.types";

import { usePartyMarbles } from "../partyMarbles";
import { ownerMarble } from "./TenkaChips";

/**
 * TENKA'S DICE AND CARDS, DRAWN BY KOROKORO AND TORANPU through the package's
 * own dressing (`@johnmorrisdotca/tenka/dressing`).
 *
 * LOADED IN THE BROWSER ONLY (`TenkaDressedClient.tsx`): the dressing reaches
 * Korokoro's die and Toranpu's card art, and a table is read from this
 * browser's storage, so none of it belongs in the server's function. The
 * dressing hands back plain DOM elements, and this table is React, so each
 * one is put into a span and taken out again when the thing it draws changes.
 * Nothing here decides anything: the faces, the cards and the count left in
 * the deck are the game's, already settled.
 */

let made: TenkaDressing | null = null;

/** One dressing for the whole table: it keeps the dice sound's audio context, if it is ever asked for. */
function dressing(): TenkaDressing {
  made ??= tenkaDressing();
  return made;
}

/** Puts what a dressing drew into a span, and takes it away (stopping any timer) when `draw` changes or the span goes. */
function Drawn({ draw, className, style }: { draw: () => TenkaDrawn; className?: string; style?: CSSProperties }) {
  const host = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const where = host.current;
    if (where === null) return;
    let drawn: TenkaDrawn | null = null;
    try {
      drawn = draw();
      where.replaceChildren(drawn.element);
    } catch {
      // A dressing that cannot draw leaves the span empty; the words around it still say what it was.
    }
    return () => {
      drawn?.destroy?.();
      where.replaceChildren();
    };
  }, [draw]);
  return <span ref={host} className={className} style={style} />;
}

/**
 * One die of the last throw, in its thrower's colour. `tumble` is true only
 * for a throw made since this table was opened; a table opened on a throw
 * already made, or drawn again for any other reason, shows the die at rest.
 */
export function DressedDie({ face, owner, side, small, tumble, index, count, label }: { face: number; owner: TenkaOwner; side: "attack" | "defend"; small: boolean; tumble: boolean; index: number; count: number; label: string }) {
  const marble = ownerMarble(owner, usePartyMarbles());
  const style = {
    "--tk-attack": marble.fill,
    "--tk-attack-ink": marble.ink,
    "--tk-defend": marble.fill,
    "--tk-defend-ink": marble.ink,
    "--tk-die-size": small ? "28px" : "36px",
  } as CSSProperties;
  const draw = useMemo(() => () => dressing().die!(face, { side, tumble, index, count, label, locale: "en" }), [face, side, tumble, index, count, label]);
  return <Drawn draw={draw} className="flex shrink-0" style={style} />;
}

/** One card of the hand: the territory's own outline, its name, and the symbol of its army. */
export function DressedCard({ card, territory, kind, map, name, label }: { card: number; territory: number | null; kind: TenkaCardKind; map: TenkaMapKey; name: string; label: string }) {
  const style = { "--tk-card-width": "64px" } as CSSProperties;
  const draw = useMemo(() => () => dressing().card!({ card, territory, kind, map, name, label, locale: "en" }), [card, territory, kind, map, name, label]);
  return <Drawn draw={draw} className="block w-16 shrink-0" style={style} />;
}

/** The back of a card, for the deck, with `label` for a screen reader. */
export function DressedBack({ label }: { label: string }) {
  const draw = useMemo(() => () => dressing().back!({ label, locale: "en" }), [label]);
  return <Drawn draw={draw} className="block w-16 shrink-0" />;
}
