"use client";

import type { KeyboardEvent } from "react";
import { usePartyMarbles } from "../partyMarbles";

import { TENKA_NEUTRAL } from "@/lib/party/tenka/tenka.constants";
import type { TenkaGame } from "@/lib/party/tenka/tenka.types";
import { tenkaMapOf } from "@/lib/party/tenka/tenkaMap";
import { tenkaShapesFor } from "@/lib/party/tenka/tenkaShapes.data";
import { centredBaseline } from "@/lib/ui/svgText";

import { TENKA_CHIP } from "./tenka.constants";
import type { MapMarks } from "./tenka.types";

import type { PartyMarble } from "../party.types";
import { chipRadius, chipWidth, laidOutChips } from "./tenkaView";
import { marbleLabel, tenkaNeutralMarble, tenkaWords } from "@/components/party/partyWords";
import { territoryName } from "./tenkaWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { partyPlayerName } from "@/lib/party/partyNames";

/** An owner's marble, as this table shows it (`usePartyMarbles`): a player's, or the neutral army's grey. */
export function ownerMarble(owner: number, marbles: readonly PartyMarble[], neutral: PartyMarble): PartyMarble {
  return owner === TENKA_NEUTRAL ? neutral : marbles[owner]!;
}

/** The territories whose counters matter most, first: what is chosen and what it reaches, then the player to move's, then the biggest armies. */
function counterOrder(game: TenkaGame, marks: MapMarks): number[] {
  const weight = (territory: number) =>
    (territory === marks.chosen || territory === marks.target ? 4000 : marks.reach.includes(territory) ? 3000 : game.owners[territory] === game.toPlay ? 2000 : 0) + Math.min(999, game.armies[territory]);
  return tenkaMapOf(game).territories.map((_, territory) => territory).sort((a, b) => weight(b) - weight(a) || a - b);
}

/**
 * EVERY TERRITORY'S COUNTER: the owner's letter and the armies there, on the
 * owner's colour, the same size on the screen however far the map is zoomed
 * (`TENKA_CHIP`) — seventeen pixels, readable on a phone at the whole-world
 * view. Where the world is too small for all of them (Europe's middle, the
 * isthmus, the islands of Southeast Asia, until the map is zoomed), a counter
 * that would cover a more important one is a dot with the owner's letter
 * (`laidOutChips`); either way it is a button, named in full.
 */
export function TenkaChips({ game, marks, scale, onTerritory }: { game: TenkaGame; marks: MapMarks; scale: number; onTerritory?: (territory: number) => void }) {
  const say = useSpeaker();
  const neutral = tenkaNeutralMarble(say.locale);
  // Every place's marble as this table shows it, with any colour a player chose (`usePartyMarbles`).
  const marbles = usePartyMarbles();
  const radius = chipRadius(scale);
  const shapes = tenkaShapesFor(game);
  const { territories } = tenkaMapOf(game);
  const dots = laidOutChips(shapes.labels, game.armies, scale, counterOrder(game, marks));
  const reach = new Set(marks.reach);
  const last = game.lastRoll;
  const press = (territory: number) => (event: KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onTerritory?.(territory);
  };
  // The dots first, so a whole counter is never under one.
  const order = territories.map((_, territory) => territory).sort((a, b) => Number(dots.has(b)) - Number(dots.has(a)));
  return (
    <>
      {order.map((territory) => {
        const [x, y] = shapes.labels[territory];
        const owner = game.owners[territory];
        const marble = ownerMarble(owner, marbles, neutral);
        const armies = game.armies[territory];
        const name = territoryName(territories[territory], say);
        const whose = owner === TENKA_NEUTRAL ? say.say("party.tenka.neutralOf") : say.say("party.tenka.possessive", { name: partyPlayerName(game, owner, say) });
        const fought = last !== null && (last.from === territory || last.to === territory);
        const dot = dots.has(territory);
        const width = radius * chipWidth(String(armies).length);
        const edge = { stroke: fought ? "#111111" : "rgba(0,0,0,0.7)", strokeWidth: (fought ? 2.4 : 1) / scale };
        return (
          <g
            key={territory}
            transform={`translate(${x} ${y})`}
            role={onTerritory === undefined ? undefined : "button"}
            tabIndex={onTerritory === undefined ? undefined : 0}
            aria-label={say.say("party.tenka.chipAria", { name, whose, colour: marbleLabel(marble, say.locale), letter: marble.letter, armies: tenkaWords(say.locale).armies(armies) })}
            className={onTerritory === undefined ? undefined : "cursor-pointer outline-none"}
            onClick={onTerritory === undefined ? undefined : () => onTerritory(territory)}
            onKeyDown={onTerritory === undefined ? undefined : press(territory)}
            data-testid="tenka-territory"
            data-territory={territories[territory].key}
            data-name={territories[territory].name}
            data-owner={owner}
            data-armies={armies}
            data-dot={dot ? "true" : undefined}
            data-reach={reach.has(territory) ? "true" : undefined}
            data-chosen={marks.chosen === territory ? "true" : undefined}
            data-target={marks.target === territory ? "true" : undefined}
          >
            {dot ? (
              <>
                <circle r={radius * TENKA_CHIP.dot} fill={marble.fill} {...edge} />
                <text y={centredBaseline(0, radius * 0.8)} fontSize={radius * 0.8} fontWeight={700} textAnchor="middle" fill={marble.ink} aria-hidden="true">
                  {marble.letter}
                </text>
              </>
            ) : (
              <>
                <rect x={-width / 2} y={-radius} width={width} height={radius * 2} rx={radius} fill={marble.fill} {...edge} />
                <text x={-width / 2 + radius * 0.825} y={centredBaseline(0, radius * 1.05)} fontSize={radius * 1.05} fontWeight={600} textAnchor="middle" fill={marble.ink} opacity={0.8} aria-hidden="true">
                  {marble.letter}
                </text>
                <text
                  x={-width / 2 + radius * (1.3 + 0.37 * String(armies).length)}
                  y={centredBaseline(0, radius * 1.25)}
                  fontSize={radius * 1.25}
                  fontWeight={700}
                  textAnchor="middle"
                  fill={marble.ink}
                  aria-hidden="true"
                >
                  {armies}
                </text>
              </>
            )}
            <title>{say.say("party.tenka.chipTitle", { name, whose, armies: String(armies) })}</title>
          </g>
        );
      })}
    </>
  );
}
