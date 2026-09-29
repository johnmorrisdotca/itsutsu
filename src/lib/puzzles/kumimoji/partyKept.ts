import { decodeGrid, encodeGrid, lettersOf, sameLetters } from "./grid";
import type { PartyEnding, PartyGame, PartySettings } from "./party.types";
import { KUMIMOJI_PARTY, KUMIMOJI_HANDS } from "./tiles.constants";

/**
 * A PASS-AND-PLAY GAME KEPT IN THE BROWSER, as one string of JSON: the
 * settings, the whole bag in its order, what was traded back and taken, whose
 * turn it is, who is out, who resigned and who still has a last turn, what
 * this turn has done so far, and every player's
 * name, hand and grid (`encodeGrid`). The bag is written out rather than made
 * again from the seed, so a game left half way opens the same after the
 * generator has changed.
 *
 * It is never sent to the server: a local game has no points, no record and
 * nothing to check, and the names in it are the players' own business.
 */
const VERSION = 1;

type Kept = {
  v: number;
  settings: PartySettings;
  bag: string;
  returned: string;
  taken: number;
  turn: number;
  turns: number;
  out: number[];
  lastTurns: number[] | null;
  resigned: number[];
  resignRun: number[];
  ending: PartyEnding | null;
  startTable: string;
  traded: boolean;
  passedBy: number | null;
  players: { name: string; hand: string; grid: string }[];
};

export function encodeParty(game: PartyGame): string {
  const kept: Kept = {
    v: VERSION,
    settings: game.settings,
    bag: game.bag,
    returned: game.returned,
    taken: game.taken,
    turn: game.turn,
    turns: game.turns,
    out: [...game.out],
    lastTurns: game.lastTurns === null ? null : [...game.lastTurns],
    resigned: [...game.resigned],
    resignRun: [...game.resignRun],
    ending: game.ending,
    startTable: game.startTable,
    traded: game.traded,
    passedBy: game.passedBy,
    players: game.players.map((player) => ({ name: player.name, hand: player.hand.join(""), grid: encodeGrid(player.tiles) })),
  };
  return JSON.stringify(kept);
}

const isCount = (value: unknown, most: number): value is number => Number.isInteger(value) && (value as number) >= 0 && (value as number) <= most;
const isTiles = (value: unknown): value is string => typeof value === "string" && /^[a-zA-Z*-]*$/.test(value);

function readSettings(value: unknown): PartySettings | null {
  if (typeof value !== "object" || value === null) return null;
  const s = value as Record<string, unknown>;
  const sizes: readonly number[] = Object.values(KUMIMOJI_HANDS);
  if (!sizes.includes(s.size as number)) return null;
  if (s.level !== "easy" && s.level !== "medium" && s.level !== "hard") return null;
  if (!Number.isInteger(s.seed)) return null;
  if (s.gameLength !== "short" && s.gameLength !== "medium" && s.gameLength !== "full") return null;
  if (s.language !== "english" && s.language !== "japanese") return null;
  if (typeof s.doubleSet !== "boolean" || typeof s.hints !== "boolean") return null;
  // A game kept before Diagonals existed has no word for it, and was played without.
  if (s.diagonals !== undefined && typeof s.diagonals !== "boolean") return null;
  return { size: s.size as number, level: s.level, seed: s.seed as number, gameLength: s.gameLength, language: s.language, doubleSet: s.doubleSet, diagonals: s.diagonals === true, hints: s.hints };
}

/**
 * A kept game read back, or null for anything that is not one. With
 * `familyKey` (the loaded word list's), it is also checked against its own
 * bag: every tile held by anybody — hand and table — must be one taken out of
 * it and not given back, as the solo game checks a kept run
 * (`decodeTileProgress`). Without, its shape alone, which is enough to offer
 * it on the set-up screen.
 */
export function decodeParty(code: string | null, familyKey?: (tile: string) => string | null): PartyGame | null {
  if (code === null) return null;
  let kept: Kept;
  try {
    kept = JSON.parse(code) as Kept;
  } catch {
    return null;
  }
  if (typeof kept !== "object" || kept === null || kept.v !== VERSION) return null;
  const settings = readSettings(kept.settings);
  if (settings === null || !isTiles(kept.bag) || !isTiles(kept.returned)) return null;
  const line = kept.bag + kept.returned;
  if (!isCount(kept.taken, line.length) || !Array.isArray(kept.players)) return null;
  const count = kept.players.length;
  if (count < KUMIMOJI_PARTY.least || count > KUMIMOJI_PARTY.most) return null;
  if (!isCount(kept.turn, count - 1) || !isCount(kept.turns, 1_000_000) || (kept.ending !== null && kept.ending !== "out" && kept.ending !== "standing" && kept.ending !== "tied") || typeof kept.traded !== "boolean" || !isTiles(kept.startTable) || (kept.passedBy !== null && !isCount(kept.passedBy, count - 1))) return null;
  const seats = (list: unknown): list is number[] => Array.isArray(list) && list.every((at) => isCount(at, count - 1)) && new Set(list).size === list.length;
  if (!seats(kept.out) || (kept.lastTurns !== null && !seats(kept.lastTurns)) || !seats(kept.resigned) || !seats(kept.resignRun)) return null;
  const players: PartyGame["players"][number][] = [];
  for (const player of kept.players) {
    if (typeof player !== "object" || player === null || typeof player.name !== "string" || player.name.length > KUMIMOJI_PARTY.nameMost || !isTiles(player.hand)) return null;
    const tiles = decodeGrid(player.grid);
    if (tiles === null) return null;
    players.push({ name: player.name, hand: [...player.hand], tiles });
  }
  const game: PartyGame = { settings, bag: kept.bag, returned: kept.returned, taken: kept.taken, players, turn: kept.turn, turns: kept.turns, out: kept.out, lastTurns: kept.lastTurns, resigned: kept.resigned, resignRun: kept.resignRun, ending: kept.ending, startTable: kept.startTable, traded: kept.traded, passedBy: kept.passedBy };
  if (familyKey !== undefined && !holdsItsBag(game, familyKey)) return null;
  return game;
}

/** Whether what everybody holds is exactly what was taken from the bag, less what was given back. */
export function holdsItsBag(game: PartyGame, familyKey: (tile: string) => string | null): boolean {
  const taken = [...(game.bag + game.returned).slice(0, game.taken)].map(familyKey);
  const back = [...game.returned].map(familyKey);
  const held = [...game.players.flatMap((player) => [...player.hand, ...player.tiles.values()])].map(familyKey);
  if ([...taken, ...back, ...held].some((tile) => tile === null)) return false;
  const tally = lettersOf(taken as string[]);
  for (const tile of back as string[]) tally.set(tile, (tally.get(tile) ?? 0) - 1);
  for (const [tile, count] of tally) if (count === 0) tally.delete(tile);
  return sameLetters(tally, lettersOf(held as string[]));
}

/** Whether a kept game is the one an address asks for: the same settings, and as many players. */
export function isPartyFor(game: PartyGame, settings: PartySettings, players: number): boolean {
  const a = game.settings;
  return (
    game.players.length === players &&
    a.size === settings.size &&
    a.level === settings.level &&
    a.seed === settings.seed &&
    a.gameLength === settings.gameLength &&
    a.language === settings.language &&
    a.doubleSet === settings.doubleSet &&
    a.diagonals === settings.diagonals &&
    a.hints === settings.hints
  );
}
