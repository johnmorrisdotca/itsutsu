/**
 * THE COLOURS A MEIKYUU BOARD MAY WEAR. John, 2026-10-02: "allow the user to
 * change the colour for the border of the app or basically for the board they
 * are playing in, the background colour and even the colour of the maze. We
 * have to be smart with colours that work together and not make something that
 * makes it very hard to see the thing, but it allows kids and people to
 * decorate their design even before and after playing."
 *
 * Three independent choices, each from a short curated list (never a free
 * picker, so nothing here is a colour nobody looked at):
 *
 *  - the FRAME: the wood and rim round the board (`BoardFrame`'s surface and rim);
 *  - the PAPER: the background the maze is drawn on;
 *  - the INK: the maze itself, its walls, the line drawn through it, and its
 *    start and goal.
 *
 * What makes the combinations safe is not the lists but `look.ts`, which turns
 * any three choices into colours that pass the readability rules below. An ink
 * is what the player asked for; the colours drawn are the ink's, adjusted where
 * the paper under it would make them hard to see.
 *
 * Plain data, no imports: `look.ts` reads it, the preferences registry reads
 * it, and the picker names it.
 */

/** The paper default: what Meikyuu has always been drawn on, cream by day and by night. */
export const DEFAULT_LOOK = { frame: "wood", paper: "cream", ink: "ink" } as const;

/** WCAG contrast ratios the drawn colours must reach (`look.ts` makes them so, `look.test.ts` proves it for every combination). */
export const LOOK_RULES = {
  /** Walls against the paper: the maze's whole shape, so text-grade (WCAG AA). */
  wall: 4.5,
  /** The line against the paper, and against the walls it runs beside. */
  trail: 3,
  /** The start dot against the paper: a mark with no outline of its own. */
  start: 3,
  /** The goal against the paper and the line. It is outlined in the wall's colour and the solved line wears it, so it needs less: the default gold is 1.9. */
  goal: 1.8,
  /** The goal against the line, so the end of the line is not lost in it. */
  goalFromTrail: 1.4,
  /** A stone (the marble laid beside the line) against the paper: a mark of its own, so graphics-grade (WCAG 1.4.11). */
  stone: 3,
  /** A stone against its rim, which is the wall's colour, so the marble is a marble and not a hole. */
  stoneFromWall: 1.5,
  /** A stone against the line and against the goal, so it is not taken for either (its shape is not theirs either). */
  stoneFromTrail: 1.25,
  stoneFromGoal: 1.25,
} as const;

/** Stone colours tried, in order: the package's own slate blue for a light paper and its pale blue for a dark one, then others, each tuned lighter or darker if it nearly reads. */
export const STONE_FALLBACKS = ["#4b5d8f", "#b3c0ea", "#6a5acd", "#e8ecf7", "#8a6a3b", "#d9c8a0", "#3b4a63", "#cfd6e6", "#ffffff", "#000000"] as const;

/** The two ink colours a wall falls back on when its own cannot be seen on the paper. */
export const WALL_FALLBACKS = ["#1f2320", "#f3efe4"] as const;

/** Line colours tried, in order, when an ink's own line cannot be seen on its paper and walls. */
export const TRAIL_FALLBACKS = ["#2e8b57", "#d9381e", "#2865a6", "#7b4fb0", "#d97a1e", "#ffd23f", "#6fcf97", "#ff8a6b", "#7fb4ee", "#c3a1f0", "#ffb061", "#ffffff", "#000000"] as const;

/** Goal colours tried, in order, when an ink's own goal is lost on its paper or its line. */
export const GOAL_FALLBACKS = ["#e0b43b", "#ffb020", "#f2c230", "#ffe08a", "#d97a1e", "#2865a6", "#7b4fb0", "#ffffff", "#000000"] as const;

/** The frames: a base colour each, lit at one corner and shaded at the rim like the site's own woods. `wood` is the board every puzzle has always had. */
export const FRAMES = {
  wood: { label: "Wood", kanji: "木", base: "#e2ba7a" },
  darkwood: { label: "Dark wood", kanji: "濃木", base: "#8d5c30" },
  green: { label: "Green", kanji: "緑", base: "#237a45" },
  blue: { label: "Blue", kanji: "青", base: "#2865a6" },
  red: { label: "Red", kanji: "赤", base: "#a3342e" },
  black: { label: "Black", kanji: "黒", base: "#2a2c30" },
  pink: { label: "Pink", kanji: "桃", base: "#e0629a" },
  purple: { label: "Purple", kanji: "紫", base: "#7c4dbd" },
  orange: { label: "Orange", kanji: "橙", base: "#e8812a" },
  teal: { label: "Teal", kanji: "青緑", base: "#14877f" },
  yellow: { label: "Yellow", kanji: "黄", base: "#e6b520" },
  silver: { label: "Silver", kanji: "銀", base: "#aab2be" },
} as const satisfies Record<string, { label: string; kanji: string; base: string }>;

export type FrameId = keyof typeof FRAMES;
export const FRAME_LIST = Object.keys(FRAMES) as FrameId[];

/**
 * The papers. Light ones and dark ones, and none in between: a mid-tone paper
 * is the one that no wall can be seen on, so there is none to choose.
 */
export const PAPERS = {
  cream: { label: "Paper", kanji: "紙", colour: "#fbf8f1" },
  white: { label: "White", kanji: "白", colour: "#ffffff" },
  butter: { label: "Butter", kanji: "黄", colour: "#fff3c4" },
  peach: { label: "Peach", kanji: "桃色", colour: "#ffe3cf" },
  blush: { label: "Blush", kanji: "薄紅", colour: "#ffe0e8" },
  lavender: { label: "Lavender", kanji: "藤", colour: "#ece3ff" },
  sky: { label: "Sky", kanji: "空", colour: "#dbeeff" },
  mint: { label: "Mint", kanji: "薄荷", colour: "#dff5e6" },
  slate: { label: "Slate", kanji: "石", colour: "#2d3541" },
  forest: { label: "Forest", kanji: "森", colour: "#17332a" },
  plum: { label: "Plum", kanji: "葡萄", colour: "#2b1840" },
  midnight: { label: "Midnight", kanji: "夜", colour: "#161b2e" },
} as const satisfies Record<string, { label: string; kanji: string; colour: string }>;

export type PaperId = keyof typeof PAPERS;
export const PAPER_LIST = Object.keys(PAPERS) as PaperId[];

/**
 * The inks: the maze's walls, the line drawn through it, and its start and
 * goal, as the player would like them. Each is a dark ink for the light papers
 * or a light one for the dark papers, and `look.ts` flips or swaps whatever the
 * paper chosen would swallow, so every ink is safe on every paper.
 */
export const INKS = {
  ink: { label: "Ink", kanji: "墨", wall: "#1f2320", trail: "#2e8b57", start: "#2f7a4f", goal: "#e0b43b" },
  navy: { label: "Navy", kanji: "紺", wall: "#1b2a6b", trail: "#ce7100", start: "#1a7f4b", goal: "#cba328" },
  ocean: { label: "Ocean", kanji: "海", wall: "#0b3a5c", trail: "#e0572c", start: "#1d7a5a", goal: "#cba328" },
  forest: { label: "Forest", kanji: "林", wall: "#19432e", trail: "#9b79c3", start: "#1d6b46", goal: "#cea636" },
  plum: { label: "Plum", kanji: "紫", wall: "#4a1d6b", trail: "#3f9464", start: "#2e8b57", goal: "#cea636" },
  brick: { label: "Brick", kanji: "煉瓦", wall: "#5c2016", trail: "#4186af", start: "#2f7a4f", goal: "#cea636" },
  berry: { label: "Berry", kanji: "苺", wall: "#661538", trail: "#4386bd", start: "#2f7a4f", goal: "#cea636" },
  bright: { label: "Bright", kanji: "彩", wall: "#4f277f", trail: "#eb531d", start: "#13a050", goal: "#d6ab00" },
  mono: { label: "Mono", kanji: "灰", wall: "#111111", trail: "#6e6e6e", start: "#333333", goal: "#a0a0a0" },
  moon: { label: "Moon", kanji: "月", wall: "#f3efe4", trail: "#e0572c", start: "#6fcf97", goal: "#ffb020" },
  sun: { label: "Sun", kanji: "陽", wall: "#ffe9a8", trail: "#e0527f", start: "#7fe3a6", goal: "#ffb020" },
} as const satisfies Record<string, { label: string; kanji: string; wall: string; trail: string; start: string; goal: string }>;

export type InkId = keyof typeof INKS;
export const INK_LIST = Object.keys(INKS) as InkId[];

/** The ready-made sets: one press for the three choices together. */
export const THEMES = {
  wood: { label: "Wood and paper", kanji: "木と紙", frame: "wood", paper: "cream", ink: "ink" },
  midnight: { label: "Midnight", kanji: "夜", frame: "black", paper: "midnight", ink: "moon" },
  candy: { label: "Candy", kanji: "飴", frame: "pink", paper: "blush", ink: "berry" },
  forest: { label: "Forest", kanji: "森", frame: "green", paper: "mint", ink: "forest" },
  ocean: { label: "Ocean", kanji: "海", frame: "blue", paper: "sky", ink: "ocean" },
  sunset: { label: "Sunset", kanji: "夕焼", frame: "orange", paper: "peach", ink: "brick" },
  mono: { label: "Mono", kanji: "白黒", frame: "silver", paper: "white", ink: "mono" },
  bright: { label: "Bright", kanji: "元気", frame: "yellow", paper: "butter", ink: "bright" },
} as const satisfies Record<string, { label: string; kanji: string; frame: FrameId; paper: PaperId; ink: InkId }>;

export type ThemeId = keyof typeof THEMES;
export const THEME_LIST = Object.keys(THEMES) as ThemeId[];

/** Where a device keeps its own choice, for a reader with no account or none yet. */
export const LOOK_STORAGE = "itsutsu.meikyuu.look";

/** The words on the colour chooser. */
export const LOOK_COPY = {
  press: "Colours",
  kanji: "色",
  title: "Colours",
  blurb: "Pick a ready-made set, or mix your own. The maze always stays easy to see.",
  themes: "Ready-made sets",
  own: "Make your own",
  frame: "Border",
  paper: "Background",
  ink: "Maze",
  reset: "Reset",
  done: "Done",
  adjusted: "The maze's lines were changed a little so they stay easy to see on this background.",
} as const;
