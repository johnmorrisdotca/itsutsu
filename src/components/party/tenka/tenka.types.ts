import type { Ref } from "react";

import type { Appearance } from "@/components/board/board.types";
import type { TenkaGame, TenkaMove } from "@/lib/party/tenka/tenka.types";

/** How the map is looked at: screen pixels per map unit, and where the map's corner sits in the box. */
export type MapView = { scale: number; x: number; y: number };

/** The box the map is looked at through, and the map's own size, in map units. */
export type MapBox = { width: number; height: number; mapWidth: number; mapHeight: number };

/** What the map lights up: the territory chosen, the ones it may reach, and a second one chosen (a target, or where armies go). */
export type MapMarks = {
  chosen: number | null;
  reach: readonly number[];
  target: number | null;
};

export type TenkaMapProps = {
  game: TenkaGame;
  appearance: Appearance;
  marks: MapMarks;
  /** A territory tapped; absent on a map nobody plays on. */
  onTerritory?: (territory: number) => void;
  /** A preview: the table set out, nothing to tap, and no view to move. */
  readOnly?: boolean;
  /** What the table asks of the map's view: to frame territories just chosen (`TenkaMapHandle`). */
  handle?: Ref<TenkaMapHandle>;
};

/** What the table asks of the map's view. */
export type TenkaMapHandle = {
  /** On a phone, look at these territories — the first chosen, then what it can reach — close enough to read every counter. */
  frameAround: (territories: readonly number[]) => void;
};

/** What the table's player chose on the map, before it is a move: the two territories of an attack or a fortifying move, and how many. */
export type TenkaChoice = {
  from: number | null;
  to: number | null;
  /** How many armies move, when there is a number to choose. */
  armies: number;
  /** The last territory a reinforcing army was placed on, for "all the rest here". */
  placedOn: number | null;
};

export type TenkaBarProps = {
  game: TenkaGame;
  choice: TenkaChoice;
  onMove: (move: TenkaMove | readonly TenkaMove[]) => void;
  onArmies: (armies: number) => void;
  /** Whether the player to move has taken the device: until then, the bar asks for it to be passed. */
  handed: boolean;
  onReady: () => void;
};

export type TenkaSetUpProps = {
  appearance: Appearance;
  onStart: (game: TenkaGame) => void;
  /** The hydration mark (`readyMark`), on the form a test fills in. */
  ready: { "data-ready": string };
};
