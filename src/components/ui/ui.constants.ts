/**
 * The shared look of every control. Kept in one place so the board panel, the
 * settings and the history page cannot drift apart.
 *
 * Colours are the Itsutsu tokens from globals.css — ivory, ink, rule, moss —
 * and each token already carries its dark value, so nothing here needs a
 * `dark:` twin. A control that does is using the wrong colour.
 */

export const BUTTON_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-moss disabled:cursor-not-allowed disabled:opacity-35";

export const BUTTON_QUIET =
  "border-rule-strong/80 bg-ivory/80 text-ink hover:bg-rule/60";

export const BUTTON_STRONG =
  "border-transparent bg-ink text-paper hover:bg-ink-soft";

/*
 * `min-w-0` and `max-w-full` because a select is as wide as its longest
 * option and will otherwise push out of whatever it is sitting in. Naming an
 * option well is the real fix — see GAME_COPY's short penalty labels — but a
 * control should not be able to break a panel however badly it is named.
 */
export const SELECT_CLASS =
  "min-w-0 max-w-full truncate rounded-lg border border-rule-strong/80 bg-ivory/80 px-2 py-1 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-moss disabled:cursor-not-allowed disabled:opacity-55";

export const INPUT_CLASS =
  "w-full rounded-lg border border-rule-strong/80 bg-ivory/80 px-2.5 py-1.5 text-sm text-ink outline-none placeholder:text-muted/80 focus-visible:ring-2 focus-visible:ring-moss";

export const PANEL_CLASS =
  "rounded-2xl border border-rule bg-ivory/60 p-4 backdrop-blur-sm";

/** A panel that is a link: the border firms up under the pointer. */
export const PANEL_LINK_CLASS = `${PANEL_CLASS} transition-colors hover:border-rule-strong`;

export const SECTION_TITLE =
  "text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted";

/** Focus ring for things that are not buttons — intersections, swatches. */
export const FOCUS_RING = "outline-none focus-visible:ring-2 focus-visible:ring-moss";

/** Tone colours for the awareness banner, matching `AdviceTone`. */
export const TONE_CLASS = {
  calm: "border-rule bg-ivory/70 text-ink-soft",
  good: "border-moss/40 bg-moss-soft text-ink",
  great: "border-moss bg-moss-soft text-ink",
  warn: "border-ochre/50 bg-ochre-soft text-ink",
  alarm: "border-shu/60 bg-shu-soft text-ink",
} as const;
