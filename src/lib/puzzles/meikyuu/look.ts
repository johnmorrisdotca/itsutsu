import { blend, contrast, shade } from "@/lib/pieces/colourMath";

import { DEFAULT_LOOK, FRAMES, GOAL_FALLBACKS, INKS, LOOK_RULES, PAPERS, STONE_FALLBACKS, THEMES, TRAIL_FALLBACKS, WALL_FALLBACKS, type FrameId, type InkId, type PaperId, type ThemeId } from "./look.constants";

/**
 * A MEIKYUU BOARD'S COLOURS, MADE SAFE. Three choices (`LookChoice`) go in and
 * the colours to draw come out (`resolveLook`), already adjusted so that the
 * maze can be seen whatever was chosen. Pure: nothing here reads a screen or a
 * store, so every one of the combinations is proved readable in a test
 * (`look.test.ts`) and not hoped for.
 *
 * THE RULE (`LOOK_RULES`, in WCAG contrast ratios):
 *  - walls against the paper, 4.5:1 — the shape of the maze;
 *  - the line against the paper and against the walls, 3:1;
 *  - the start against the paper, 3:1;
 *  - the goal against the paper (1.8:1: it is outlined in the walls' colour,
 *    and the solved line wears it) and against the line (1.4:1);
 *  - a stone, the marble laid beside the line, against the paper (3:1), against
 *    its rim, which is the walls' colour (1.5:1), and against the line and the
 *    goal (1.25:1), so it is a marble and is taken for neither.
 *
 * HOW A CHOICE THAT BREAKS IT IS ANSWERED. It is never refused, because a child
 * who pressed "navy" on "midnight" should see a maze, not a message. The ink is
 * what was asked for and each of its colours is kept where it passes; where it
 * does not, the walls flip to the dark or light ink that reads on the paper,
 * and the line, start and goal take the first of their fallback colours that
 * passes. `adjusted` says that happened, so the chooser can say so.
 */
export type LookChoice = { frame: FrameId; paper: PaperId; ink: InkId };

/** The colours to draw, all `#rrggbb`. */
export type ResolvedLook = {
  paper: string;
  wall: string;
  /** The ring the package draws round the shape, between the paper and the walls. */
  ring: string;
  trail: string;
  start: string;
  goal: string;
  /** A stone's fill; its rim is the wall's colour. */
  stone: string;
  /** Whether any of the ink's own colours was changed to keep the maze readable on this paper. */
  adjusted: boolean;
};

/** The wood and rim of a frame, lit at one corner. */
export type ResolvedFrame = { light: string; base: string; deep: string; rim: string };

export const DEFAULT_CHOICE: LookChoice = DEFAULT_LOOK;

/** The first colour that passes, or the one that comes nearest to passing. */
function pick(candidates: readonly string[], score: (colour: string) => number, need: number): string {
  let best = candidates[0]!;
  let bestScore = -Infinity;
  for (const colour of candidates) {
    const value = score(colour);
    if (value >= need) return colour;
    if (value > bestScore) {
      best = colour;
      bestScore = value;
    }
  }
  return best;
}

/** Shades tried on a colour that nearly reads, nearest first: a little lighter or darker keeps its hue and makes it pass. */
const TUNING = [0, 0.08, -0.08, 0.16, -0.16, 0.24, -0.24, 0.32, -0.32, 0.45, -0.45, 0.6, -0.6, 0.8, -0.8] as const;

/**
 * The first of the candidates, as it is or tuned, that `passes`; null when none does. The first candidate gets
 * every shade before the next is looked at, so an ink that nearly reads keeps its hue and a fallback is a last resort.
 */
function tuned(candidates: readonly string[], passes: (colour: string) => boolean): string | null {
  for (const candidate of candidates) {
    for (const amount of TUNING) {
      const colour = amount === 0 ? candidate : shade(candidate, amount);
      if (passes(colour)) return colour;
    }
  }
  return null;
}

/** The line against the paper and the walls. */
function lineReads(colour: string, paper: string, wall: string): boolean {
  return contrast(colour, paper) >= LOOK_RULES.trail && contrast(colour, wall) >= LOOK_RULES.trail;
}

/** The walls and the line together: the ink's own where they read, and the nearest that do where they do not. */
function wallAndLine(ink: (typeof INKS)[InkId], paper: string): { wall: string; trail: string } {
  const readsOnPaper = (colour: string) => contrast(colour, paper) >= LOOK_RULES.wall;
  const wall = pick([ink.wall, ...WALL_FALLBACKS], (colour) => contrast(colour, paper), LOOK_RULES.wall);
  const own = [ink.trail, ...TRAIL_FALLBACKS];
  // A wall near the middle of the scale leaves no room for a line that stands off both it and the paper: the wall goes further from the paper, a step at a time, until there is.
  const towards = contrast("#000000", paper) > contrast("#ffffff", paper) ? "#000000" : "#ffffff";
  for (const steps of [0, 1, 2, 3, 4, 5, 6, 7, 8]) {
    const further = steps === 0 ? wall : blend(towards, wall, steps / 8);
    if (!readsOnPaper(further)) continue;
    const trail = tuned(own, (colour) => lineReads(colour, paper, further));
    if (trail !== null) return { wall: further, trail };
  }
  return { wall, trail: pick(own, (colour) => Math.min(contrast(colour, paper), contrast(colour, wall)), LOOK_RULES.trail) };
}

/** A stone against the paper, its rim (the wall), the line and the goal. */
function stoneReads(colour: string, paper: string, wall: string, trail: string, goal: string): boolean {
  return contrast(colour, paper) >= LOOK_RULES.stone && contrast(colour, wall) >= LOOK_RULES.stoneFromWall && contrast(colour, trail) >= LOOK_RULES.stoneFromTrail && contrast(colour, goal) >= LOOK_RULES.stoneFromGoal;
}

/** What a choice is drawn in. */
export function resolveLook(choice: LookChoice): ResolvedLook {
  const paper = PAPERS[choice.paper].colour;
  const ink = INKS[choice.ink];
  const { wall, trail } = wallAndLine(ink, paper);
  const start = tuned([ink.start, trail, ...TRAIL_FALLBACKS], (colour) => contrast(colour, paper) >= LOOK_RULES.start) ?? trail;
  const goal =
    tuned([ink.goal, ...GOAL_FALLBACKS], (colour) => contrast(colour, trail) >= LOOK_RULES.goalFromTrail && contrast(colour, paper) >= LOOK_RULES.goal) ??
    pick(GOAL_FALLBACKS, (colour) => (contrast(colour, trail) >= LOOK_RULES.goalFromTrail ? contrast(colour, paper) : -1), LOOK_RULES.goal);
  const stone =
    tuned(STONE_FALLBACKS, (colour) => stoneReads(colour, paper, wall, trail, goal)) ??
    pick(STONE_FALLBACKS, (colour) => Math.min(contrast(colour, paper) / LOOK_RULES.stone, contrast(colour, wall) / LOOK_RULES.stoneFromWall), 1);
  const plain = choice.paper === DEFAULT_LOOK.paper && choice.ink === DEFAULT_LOOK.ink;
  return {
    paper,
    wall,
    // The default look keeps the tan ring it has always had; every other is the paper drawn towards its walls.
    ring: plain ? "#a98954" : blend(wall, paper, 0.35),
    trail,
    start,
    goal,
    stone,
    adjusted: wall !== ink.wall || trail !== ink.trail || start !== ink.start || goal !== ink.goal,
  };
}

/** The ratios a resolved look reaches: what `look.test.ts` holds to `LOOK_RULES`, and what a reader of the code can check. */
export function readingOf(look: ResolvedLook): { wall: number; trail: number; trailOnWall: number; start: number; goal: number; goalFromTrail: number; stone: number; stoneFromWall: number; stoneFromTrail: number; stoneFromGoal: number } {
  return {
    wall: contrast(look.wall, look.paper),
    trail: contrast(look.trail, look.paper),
    trailOnWall: contrast(look.trail, look.wall),
    start: contrast(look.start, look.paper),
    goal: contrast(look.goal, look.paper),
    goalFromTrail: contrast(look.goal, look.trail),
    stone: contrast(look.stone, look.paper),
    stoneFromWall: contrast(look.stone, look.wall),
    stoneFromTrail: contrast(look.stone, look.trail),
    stoneFromGoal: contrast(look.stone, look.goal),
  };
}

/** Whether a resolved look meets every rule. */
export function isReadable(look: ResolvedLook): boolean {
  const reading = readingOf(look);
  return (
    reading.wall >= LOOK_RULES.wall &&
    reading.trail >= LOOK_RULES.trail &&
    reading.trailOnWall >= LOOK_RULES.trail &&
    reading.start >= LOOK_RULES.start &&
    reading.goal >= LOOK_RULES.goal &&
    reading.goalFromTrail >= LOOK_RULES.goalFromTrail &&
    reading.stone >= LOOK_RULES.stone &&
    reading.stoneFromWall >= LOOK_RULES.stoneFromWall &&
    reading.stoneFromTrail >= LOOK_RULES.stoneFromTrail &&
    reading.stoneFromGoal >= LOOK_RULES.stoneFromGoal
  );
}

/** A frame's colours: the base lit by a quarter at the top left and shaded a fifth at the bottom right, its rim darker still. */
export function resolveFrame(frame: FrameId): ResolvedFrame {
  const base = FRAMES[frame].base;
  return { light: shade(base, 0.25), base, deep: shade(base, -0.2), rim: shade(base, -0.55) };
}

/** The set whose three choices these are, or null for a mix of the player's own. */
export function themeOf(choice: LookChoice): ThemeId | null {
  for (const [id, theme] of Object.entries(THEMES)) {
    if (theme.frame === choice.frame && theme.paper === choice.paper && theme.ink === choice.ink) return id as ThemeId;
  }
  return null;
}

/** Whether a choice is the look every Meikyuu board has always had. */
export function isDefaultChoice(choice: LookChoice): boolean {
  return choice.frame === DEFAULT_LOOK.frame && choice.paper === DEFAULT_LOOK.paper && choice.ink === DEFAULT_LOOK.ink;
}

/** A choice with a ready-made set's three parts. */
export function choiceOfTheme(theme: ThemeId): LookChoice {
  const { frame, paper, ink } = THEMES[theme];
  return { frame, paper, ink };
}

/** `Object.hasOwn`, not `in`: a stored "toString" is not a colour. */
function known<T extends object>(table: T, value: unknown): value is keyof T {
  return typeof value === "string" && Object.hasOwn(table, value);
}

/** The parts of stored text or a stored object that name something this site still has, and nothing else. */
export function cleanChoice(stored: unknown): Partial<LookChoice> {
  let row: unknown = stored;
  if (typeof stored === "string") {
    try {
      row = JSON.parse(stored);
    } catch {
      return {};
    }
  }
  if (row === null || typeof row !== "object" || Array.isArray(row)) return {};
  const source = row as Record<string, unknown>;
  const clean: Partial<LookChoice> = {};
  if (known(FRAMES, source.frame)) clean.frame = source.frame;
  if (known(PAPERS, source.paper)) clean.paper = source.paper;
  if (known(INKS, source.ink)) clean.ink = source.ink;
  return clean;
}

/** A whole choice from a partial one: the default where nothing usable was said. */
export function choiceFrom(partial: Partial<LookChoice>): LookChoice {
  return { ...DEFAULT_CHOICE, ...partial };
}

export function sameChoice(a: LookChoice, b: LookChoice): boolean {
  return a.frame === b.frame && a.paper === b.paper && a.ink === b.ink;
}
