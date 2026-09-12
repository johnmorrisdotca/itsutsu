/**
 * How a toast behaves and how it is drawn: the timings first, because they
 * are the decisions, then the copy and the classes that follow from them.
 *
 * THE CLOCK IS IN JAVASCRIPT AND ONLY THE MOVEMENT IS IN CSS. UmaKuma runs a
 * toast's whole life as one keyframe animation, which is tidy — but this
 * site's globals.css shortens EVERY animation to nothing under
 * `prefers-reduced-motion`, and a lifetime written as an animation would be
 * over before anybody had seen it. So the CSS moves a toast in and out and
 * nothing else; how long it stays is a timer, and a reader who has asked for
 * less motion gets the same notice for the same time, minus the movement.
 * The CSS reads these numbers through custom properties the host sets, so
 * they are stated once, here.
 */

/** Sliding in: long enough to be seen arriving, short enough to feel prompt. */
export const XP_TOAST_ENTER_MS = 420;

/**
 * Several landing at once arrive one after another, this far apart, rather
 * than as one block. Three notices dropping in together read as a wall, and a
 * wall is read as one thing or not at all.
 */
export const XP_TOAST_ENTER_STAGGER_MS = 110;

/**
 * How long an ordinary award stays. The card carries a number, a label with
 * its kanji and a sentence of a dozen words: three to four seconds at a
 * comfortable reading pace, plus a moment to notice it arrived at all.
 */
export const XP_TOAST_DWELL_MS = 5000;

/**
 * A level reached stays longer. It is the moment worth a screenshot, and a
 * phone's screenshot chord takes a second or two to find.
 */
export const XP_TOAST_LEVEL_DWELL_MS = 8000;

/**
 * Awards that arrived together leave this far apart, top first, so a stack
 * drains rather than blinking out — the eye is led down through what is left
 * instead of losing three things at once.
 */
export const XP_TOAST_STAGGER_MS = 700;

/** Fading and lifting out. Quicker than arriving: leaving is not news. */
export const XP_TOAST_LEAVE_MS = 260;

/** The gap a gone toast leaves closing up, after the fade, so the stack settles. */
export const XP_TOAST_COLLAPSE_MS = 220;

/**
 * A toast a pointer or focus rests on holds still — that is how a screenshot
 * gets taken — and once let go it stays at least this long, so moving the
 * pointer off never makes it vanish under the hand.
 */
export const XP_TOAST_LINGER_MS = 1500;

/**
 * At most this many on screen; the rest wait and step in as the stack
 * drains. Four is what a game's end can pay at once — a win, a streak, a
 * first at this game, a level — and three plain cards are a quarter of a
 * phone's height, four with a level among them about two fifths, for the few
 * seconds before the top one goes. More than that is a wall over the board.
 */
export const XP_TOAST_MAX_SHOWN = 4;

/** The space between stacked toasts, stated here because a collapsing slot has to close it too. */
export const XP_TOAST_GAP = "0.5rem";

/**
 * What a toast says beyond what the award brought with it.
 *
 * The English is fixed and the kanji sits beside it the way every heading's
 * does, through `Paired`. When the dictionary gains these, they move to
 * `PHRASES` and this table goes; until then they are here rather than inline
 * so there is one place to look.
 */
export const XP_TOAST_COPY = {
  /** The unit as the toast spells it; the catalogue is what names the currency. */
  unit: "XP",
  amount: (points: number) => `+${points}`,
  /** The stack's name for a screen reader. */
  region: "Points earned",
  dismiss: "Dismiss",
  /** 昇級 — promotion, going up a grade; shown alone to a Japanese reader. */
  levelUp: { en: "Level up", kanji: "昇級" },
  nextLevel: (name: string) => `Next level: ${name}`,
} as const;

/**
 * The look. Colours are the Itsutsu tokens, which already carry their dark
 * values, so nothing here has a `dark:` twin. The card is UmaKuma's pill
 * grown up: the same translucent surface at the top of the page with a
 * hairline border and a soft shadow, squared off enough to hold three lines.
 */
export const XP_TOAST_STYLE = {
  /** The stack: pinned to the top under the notch, centred, and no part of it takes a click except the cards. */
  host: "xp-toast-host pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[60] flex flex-col items-center px-3",
  slot: "xp-toast-slot w-[min(24rem,100%)]",
  card: "xp-toast pointer-events-auto relative flex items-start gap-3 rounded-2xl border px-4 py-3 pr-10 text-left shadow-[0_16px_40px_-16px_rgba(0,0,0,0.4)] backdrop-blur-sm outline-none",
  cardPlain: "border-rule-strong/80 bg-ivory/95",
  cardLevel: "border-moss bg-moss-soft/95",
  /** Wide enough for three digits, so the labels of a stack line up whatever each award paid. */
  points: "flex min-w-[3.75rem] shrink-0 flex-col items-start",
  amount: "font-mono text-2xl leading-none font-semibold tabular-nums text-moss",
  unit: "mt-1 text-[0.6rem] font-semibold tracking-[0.14em] text-muted uppercase",
  body: "flex min-w-0 flex-1 flex-col",
  label: "text-sm leading-snug font-semibold text-ink",
  kanji: "font-normal text-ink-soft",
  sentence: "mt-0.5 text-xs leading-snug text-muted",
  levelReached: "mt-2 flex flex-col border-t border-moss/30 pt-2",
  levelEyebrow: "text-[0.65rem] font-semibold tracking-[0.14em] text-moss uppercase",
  levelKanji: "font-normal tracking-normal",
  levelName: "text-lg leading-tight font-semibold text-ink",
  levelNext: "mt-1 text-xs text-muted",
  dismiss: "absolute top-1.5 right-1.5 inline-flex size-7 items-center justify-center rounded-full text-base leading-none text-muted transition-colors outline-none hover:bg-shade hover:text-ink focus-visible:ring-2 focus-visible:ring-moss",
} as const;
