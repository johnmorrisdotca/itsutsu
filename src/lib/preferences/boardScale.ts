/**
 * HOW BIG A BOARD IS DRAWN ON A WIDE SCREEN: Regular, Large or Full.
 *
 * John, 2026-09-28, with a 16×16 Number Place in a narrow column in the middle
 * of a wide screen: "Desktop should get the offer to have multiple sizes...
 * like regular and full or large.. giving the user more real estate. and
 * hopefully make the boxes bigger too." Then, the same day: "Desktop sizing
 * must be offered for ALL games (unless there's an issue). must have memory
 * when on similar devices."
 *
 * - REGULAR 標準 (hyōjun, "the standard size") is the board every page drew
 *   before there was a choice, left exactly as it was.
 * - LARGE 大 (dai, "large", as in 大盤, a large board) is halfway between
 *   Regular and Full: a bigger board that still leaves room around it.
 * - FULL 全画面 (zengamen, the word a Japanese player or app uses for "full
 *   screen") is as large as the window allows with the board's controls — the
 *   keypad, the keyboard, the tray, the clock, whose turn it is — beside or
 *   under it and still on the screen with it.
 *
 * Both bigger sizes are worked out from the window in the browser
 * (`boardScaleFit.ts`); what is kept is only which of the three was chosen.
 *
 * A WIDE BOARD HAS THE SAME THREE, LAID OUT WIDE. John, 2026-09-29, at
 * Tenka on a desk: "some games on desktop should have full width/height
 * option. where once play starts the map/board can be wider/bigger… the game
 * has to be drawn up differently." A board wider than it is tall declares
 * itself (`data-scale-wide` on its column), and on a desk nothing sits beside
 * it at any of the three: at Regular it is the page's whole width, with what
 * is read at a glance just above and below it and the rest in a row under
 * those; Large and Full take it past the page, halfway and all the way to
 * what the window's height allows, by the same arithmetic as every board. So
 * wide is how the board is laid out, not a fourth size: one chooser still
 * says how big. Just the board holds it across the whole modal, as large as
 * the window's height allows (globals.css).
 *
 * Judged wide: Tenka's map, two by one. Judged not: Mexican Train's table and
 * Mancala's board (square wood), Mahjong's Turtle (about four by three, and at
 * Full its controls beside it leave it a bigger board than under it would),
 * and the card tables (two by one, but held to a hand's width on purpose, so
 * the trick and the hand are taken in at one glance — `CardPlay`'s
 * `data-width-reason`). `boardScale.coverage.test.ts` holds the list.
 *
 * THIS REPLACES the four sizes the live board alone offered (Fit, S, M, L, on
 * one `boardSize` preference). Their Fit is this Regular on a live board;
 * a stored `boardSize` is a key the registry no longer declares, so it is
 * ignored rather than misread.
 */
export const BOARD_SCALES = {
  regular: "regular",
  large: "large",
  full: "full",
} as const;

export const BOARD_SCALE_LIST = [BOARD_SCALES.regular, BOARD_SCALES.large, BOARD_SCALES.full] as const;

export type BoardScale = (typeof BOARD_SCALE_LIST)[number];

/**
 * KINDS OF SCREEN, EACH WITH A CHOICE OF ITS OWN. John: "must have memory when
 * on similar devices" — so a laptop and a big monitor each keep their own
 * size, and every screen of the same kind on the account shares it.
 *
 * Told apart by the width of the window, in CSS pixels, because that is what
 * the board is drawn into: a 27-inch monitor with its browser at half width is
 * a laptop's room, and should get the laptop's choice. The bands:
 *
 * - laptop, 1024–1439: from the site's desk breakpoint (Tailwind's `lg`,
 *   where the board's side matter moves beside it) up to a 13–14-inch
 *   laptop's usual 1280–1366 and 1400-ish windows;
 * - desk, 1440–1919: a 15–16-inch laptop at 1440–1728, and a 24-inch
 *   monitor's browser not quite full screen;
 * - wide, 1920 and over: a full-HD or larger monitor with the browser open
 *   wide, where a Regular board is the narrow column John was looking at.
 *
 * Below 1024 there is no kind: a phone's or a tablet's board already fills
 * its screen, so nothing is offered and nothing is applied there.
 */
export const DEVICE_CLASSES = { laptop: "laptop", desk: "desk", wide: "wide" } as const;

export const DEVICE_CLASS_LIST = [DEVICE_CLASSES.laptop, DEVICE_CLASSES.desk, DEVICE_CLASSES.wide] as const;

export type DeviceClass = (typeof DEVICE_CLASS_LIST)[number];

/** Where each kind of screen starts, in CSS pixels of window width. */
export const DEVICE_CLASS_FROM_PX: Record<DeviceClass, number> = { laptop: 1024, desk: 1440, wide: 1920 };

/** The kind of screen a window this wide is, or null below a laptop's, where no choice applies. */
export function deviceClassOf(width: number): DeviceClass | null {
  if (!Number.isFinite(width) || width < DEVICE_CLASS_FROM_PX.laptop) return null;
  if (width < DEVICE_CLASS_FROM_PX.desk) return DEVICE_CLASSES.laptop;
  if (width < DEVICE_CLASS_FROM_PX.wide) return DEVICE_CLASSES.desk;
  return DEVICE_CLASSES.wide;
}

export type BoardScaleName = `boardScale.${DeviceClass}`;

/** The preference that keeps one kind of screen's choice. */
export function boardScaleName(device: DeviceClass): BoardScaleName {
  return `boardScale.${device}`;
}

/**
 * The registry's rows, one a kind of screen. Regular is the fallback because
 * it is the board as it always was; nothing reads the fallback as a choice
 * (`keptScalesFrom` reads the cleaned column, where "never chose" is absent).
 */
export const BOARD_SCALE_SPECS = Object.fromEntries(
  DEVICE_CLASS_LIST.map((device) => [boardScaleName(device), { options: BOARD_SCALE_LIST as readonly BoardScale[], fallback: BOARD_SCALES.regular as BoardScale }]),
) as { readonly [K in BoardScaleName]: { readonly options: readonly BoardScale[]; readonly fallback: BoardScale } };

/** A reader's kept choices, by kind of screen; a kind never chosen for is absent. */
export type KeptScales = Partial<Record<DeviceClass, BoardScale>>;

function isBoardScale(value: unknown): value is BoardScale {
  return (BOARD_SCALE_LIST as readonly unknown[]).includes(value);
}

/** The choices an account keeps, out of its cleaned preferences (`boardScale.<kind>` → kind). */
export function keptScalesFrom(preferences: Readonly<Record<string, unknown>>): KeptScales {
  const kept: KeptScales = {};
  for (const device of DEVICE_CLASS_LIST) {
    const value = preferences[boardScaleName(device)];
    if (isBoardScale(value)) kept[device] = value;
  }
  return kept;
}

/** The choices this browser keeps for a reader with no account, from whatever storage held: `{ [kind]: scale }`. */
export function scalesFrom(stored: unknown): KeptScales {
  if (stored === null || typeof stored !== "object" || Array.isArray(stored)) return {};
  const kept: KeptScales = {};
  for (const device of DEVICE_CLASS_LIST) {
    const value = (stored as Record<string, unknown>)[device];
    if (isBoardScale(value)) kept[device] = value;
  }
  return kept;
}

/** Where this browser keeps them for a reader with no account. */
export const BOARD_SCALE_STORAGE = "itsutsu.boardScale";

/** The size to draw for a kind of screen: what was kept for it, else Regular. */
export function scaleFor(kept: KeptScales, device: DeviceClass | null): BoardScale {
  if (device === null) return BOARD_SCALES.regular;
  return kept[device] ?? BOARD_SCALES.regular;
}
