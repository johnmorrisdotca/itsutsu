import type { TenkaContinentKey, TenkaMapKey } from "@/lib/party/tenka/tenka.types";

import type { PartyMarble } from "../party.types";

/**
 * TENKA'S TABLE: what its screens say and how its map is drawn — one
 * constants module for the component group (`TenkaTable`, `TenkaMap`,
 * `TenkaBar`, and the rest in this folder).
 */

/** Where this browser keeps its game of Tenka: one at a time, apart from every other table's. */
export const TENKA_STORAGE_KEY = "itsutsu.tenka";

/** The neutral army of a table of two: grey, with N, never a player's colour. */
export const TENKA_NEUTRAL_MARBLE: PartyMarble = { label: "Neutral", letter: "N", fill: "#a39e93", ink: "#1a1a1a" };

/** The sea the world is drawn on, inside the board's wood: a plain chart, light and dark. */
export const TENKA_SEA = "#d9e5ea";
export const TENKA_SEA_DARK = "#2b3a42";

/** How strongly a territory is filled in its owner's colour: enough to read at a glance, never so much the counter is lost. */
export const TENKA_LAND_OPACITY = 0.78;

/** The lines on the map, in map units: a territory's edge, a continent's, a sea link's dashes, the chosen territory's ring. */
export const TENKA_LINES = { territory: 1.2, continent: 3.2, sea: 2.4, seaDash: "7 6", chosen: 3, reach: 2.5 } as const;

/**
 * AN ARMY COUNTER, drawn the same size on the screen however far the map is
 * zoomed: seventeen pixels tall (`screen` is its radius), readable at the
 * whole-world view on a phone. `apart` is the largest radius, in map units,
 * at which no two counters on the map cover each other (`tenkaView.test.ts`
 * measures it), so from `screen / apart` pixels to a map unit up every
 * counter is drawn whole; below it, where the world is too small for them
 * all, the ones that would cover another are drawn as a dot with the owner's
 * letter until the map is zoomed (`laidOutChips`). A dot is `dot` of a
 * counter's radius.
 */
export const TENKA_CHIP = { screen: 8.5, apart: 18, dot: 0.62 } as const;

/** How far from a tap, in screen pixels, the nearest territory's counter still takes it: about a fingertip. */
export const TENKA_TAP_REACH = 26;

/** A box narrower than this, in pixels, is a phone's: choosing where an attack or a move comes from frames it with what it can reach. */
export const TENKA_NARROW_BOX = 640;

/** The row of places to look at under the map: the whole world, and each continent by a name short enough for a phone. */
export const TENKA_REGION_NAMES: Record<TenkaContinentKey, string> = {
  northAmerica: "N. America",
  southAmerica: "S. America",
  europe: "Europe",
  africa: "Africa",
  asia: "Asia",
  australia: "Australia",
  // Europe's regions, as short as the world's so the row under the map stays one or two lines on a phone.
  britishIsles: "Britain",
  scandinavia: "Nordic",
  iberia: "Iberia",
  maghreb: "Maghreb",
  france: "France",
  germany: "Germany",
  centralEurope: "Central",
  italy: "Italy",
  balkans: "Balkans",
  baltic: "Baltic",
  easternEurope: "East",
};
export const TENKA_REGION_BUTTON =
  "min-h-9 rounded-full border border-rule-strong bg-ivory px-3 text-xs font-medium hover:bg-rule/60 aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper";

/** How much sea to keep round what a view frames, in map units: a little, so a continent fills the box it is shown in. */
export const TENKA_FRAME_PAD = 16;

/** The tags at the map's two edges where the world wraps round (the Bering Strait): their text and its gap from the edge, in screen pixels. */
export const TENKA_WRAP_TAG = { font: 11, inset: 5, below: 15, arrow: 6, gap: 2 } as const;

/** How far the map may be zoomed in, as a multiple of the whole world fitted to its box. */
export const TENKA_ZOOM_MOST = 8;

/** How far a finger may move and still be a tap, in pixels. */
export const TENKA_TAP_SLOP = 6;

/** What Tenka's table says, beyond what every table says (`PARTY_COPY`). */
export const TENKA_COPY = {
  lead: "Tenka for two to six people round one phone or tablet: take the world a territory at a time, then pass it on. Nothing here is rated or kept anywhere but this browser.",
  length: "How long?",
  lengthWords: (rounds: number, world: number, map: TenkaMapKey = "world") => (rounds === world ? (map === "europe" ? "All of Europe" : "The whole world") : `${rounds} rounds`),
  lengthNote: (rounds: number, world: number, map: TenkaMapKey = "world") =>
    rounds === world ? `Play until one player holds ${map === "europe" ? "all of Europe" : "the world"}.` : `Most territories after ${rounds} rounds wins.`,
  mapChoice: "Map",
  mapWords: (map: TenkaMapKey) => (map === "europe" ? "Europe" : "The world"),
  placing: "Starting armies",
  placingAuto: "Placed for you",
  placingHand: "Place them in turn",
  placingNote: "Placed for you starts at once; in turn, everybody places one army at a time round the table.",
  play: "Play →",
  about: "About Tenka and its rules",
  /** Where a game kept here by an earlier version of the rules (before 2026-10-02) would have been: it cannot be played on, and the set-up is offered instead. */
  oldSave: "The Tenka game kept on this device was played on a map that has since changed, so it cannot be continued. Start a new game below.",
  steps: ["Place", "Attack", "Fortify", "End turn"] as const,
  passTo: (name: string) => `Pass to ${name}`,
  ready: (name: string) => `I'm ${name}: start my turn`,
  place: (armies: number) => `${armies} ${armies === 1 ? "army" : "armies"} to place: tap your territories.`,
  setUp: (armies: number) => `Set-up: place one army on a territory of yours (${armies} left).`,
  placeAll: (armies: number, where: string) => `All ${armies} on ${where}`,
  mustTrade: "Five cards or more: trade a set before placing.",
  attackHint: "Tap one of your territories with two armies or more, then a neighbour to attack.",
  attackTarget: (from: string, to: string) => `${from} attacks ${to}`,
  roll: (dice: number) => `Roll ${dice}`,
  blitz: "Roll until decided",
  doneAttacking: "Done attacking",
  occupy: (to: string) => `${to} is yours. How many armies move in?`,
  moveIn: (armies: number) => `Move ${armies} in`,
  fortifyHint: "Move armies once between two of your territories joined by your own land, or end your turn.",
  fortifyPair: (from: string, to: string) => `From ${from} to ${to}`,
  fortify: (armies: number) => `Move ${armies}`,
  endTurn: "End turn",
  armies: (count: number) => `${count} ${count === 1 ? "army" : "armies"}`,
  territories: (count: number) => `${count} ${count === 1 ? "territory" : "territories"}`,
  cards: (count: number) => `${count} ${count === 1 ? "card" : "cards"}`,
  hand: "Your cards",
  noCards: "No cards yet: take a territory this turn to earn one.",
  trade: (armies: number) => `Trade for ${armies}`,
  roundOf: (round: number, rounds: number, world: number) => (rounds === world ? `Round ${round}` : `Round ${round} of ${rounds}`),
  out: "out",
  mapOf: (map: TenkaMapKey | undefined) => (map === "europe" ? "Map of Europe" : "Map of the world"),
  fit: "Move and zoom the map",
  regions: "Look at",
  world: "World",
  /** A tag at the edge of the map naming the territory across the wrap: west off the map's left edge, east off its right. */
  wrapTo: (name: string, east: boolean) => (east ? `${name} →` : `← ${name}`),
  wrapNote: (name: string) => `${name}, across the Bering Strait`,
} as const;
