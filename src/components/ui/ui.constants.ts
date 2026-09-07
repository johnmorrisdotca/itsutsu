/**
 * The shared look of every control. Kept in one place so the board panel, the
 * settings and the history page cannot drift apart.
 */

export const BUTTON_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-35";

export const BUTTON_QUIET =
  "border-zinc-300/80 bg-white/70 text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100 dark:hover:bg-zinc-800";

export const BUTTON_STRONG =
  "border-transparent bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white";

export const SELECT_CLASS =
  "rounded-lg border border-zinc-300/80 bg-white/70 px-2 py-1 text-sm text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-55 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100";

export const INPUT_CLASS =
  "w-full rounded-lg border border-zinc-300/80 bg-white/70 px-2.5 py-1.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-sky-400 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100";

export const PANEL_CLASS =
  "rounded-2xl border border-zinc-200/70 bg-white/60 p-4 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/40";

export const SECTION_TITLE =
  "text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400";

/** Tone colours for the awareness banner, matching `AdviceTone`. */
export const TONE_CLASS = {
  calm: "border-zinc-300/70 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200",
  good: "border-emerald-300/70 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100",
  great:
    "border-emerald-400/80 bg-emerald-100 text-emerald-950 dark:border-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-50",
  warn: "border-amber-300/80 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100",
  alarm:
    "border-rose-400/80 bg-rose-50 text-rose-950 dark:border-rose-700 dark:bg-rose-950/60 dark:text-rose-100",
} as const;
