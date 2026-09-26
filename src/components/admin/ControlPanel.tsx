import type { ReactNode } from "react";

/**
 * THE ADMIN'S CONTROL PANEL, as a set of parts: one framed panel, groups under
 * small headings, and one compact row per control. John, 2026-09-25, of Admin
 * → The site: "We need vertical and more condensed control panel type of
 * look", after WazaDB's own settings, which set each control as one line —
 * its name on the left, its switch on the right — under a small uppercase
 * heading for its group, a mode that is on shown in its own colour.
 *
 * Presentational only: every part takes what to show and what to do, and holds
 * no state, so a server page and a client panel can both draw with them, and
 * a new control (a mode, a switch) is one more `PanelRow` rather than a new
 * layout.
 */

/** The panel: one bordered box, its rows ruled apart. */
export function PanelFrame({ children, testId }: { children: ReactNode; testId?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-rule bg-ivory/60" data-testid={testId}>
      {children}
    </div>
  );
}

/** A group of rows under a small heading: Access, Notices, Modes. */
export function PanelGroup({ label, kanji, children, testId }: { label: string; kanji: string; children: ReactNode; testId?: string }) {
  return (
    <section className="border-t border-rule first:border-t-0" data-testid={testId}>
      <h3 className="flex items-baseline gap-2 bg-rule/30 px-3 py-1.5 text-[0.68rem] font-semibold tracking-[0.14em] text-muted uppercase">
        {label}
        <span className="font-mincho text-[0.7rem] font-normal tracking-normal normal-case opacity-80">{kanji}</span>
      </h3>
      <div className="divide-y divide-rule">{children}</div>
    </section>
  );
}

/**
 * One control: its name, kanji and a line saying what it does on the left; the
 * control on the right; a line under it saying who set it, where there is one.
 * Stacked on a phone, side by side from a tablet up.
 */
export function PanelRow({
  label,
  kanji,
  blurb,
  control,
  note,
  tone = "plain",
  busy = false,
  testId,
  data,
}: {
  label: string;
  kanji?: string;
  blurb: ReactNode;
  control: ReactNode;
  /** A line under the row: who set it and when, or what the control cannot do. */
  note?: ReactNode;
  /** A mode that is on, or a warning, tints the row. */
  tone?: "plain" | "on" | "alarm";
  busy?: boolean;
  testId?: string;
  /** Extra data attributes, for a test to read the row's state. */
  data?: Record<`data-${string}`, string>;
}) {
  const tint = tone === "on" ? "bg-moss-soft/60" : tone === "alarm" ? "bg-shu-soft/70" : "";
  return (
    <div
      className={`grid gap-2 px-3 py-2.5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-6 ${tint} ${busy ? "opacity-60" : ""}`}
      data-testid={testId}
      {...data}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="flex items-baseline gap-2 text-sm font-semibold">
          {label}
          {kanji === undefined ? null : <span className="font-mincho text-xs font-normal opacity-70">{kanji}</span>}
        </p>
        <div className="text-xs leading-snug text-muted">{blurb}</div>
        {note === undefined || note === null ? null : <div className="text-[0.7rem] leading-snug text-muted/90">{note}</div>}
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-2 md:justify-end">{control}</div>
    </div>
  );
}

/**
 * An on/off switch, WazaDB's pill: a track and a knob, the track in the mode's
 * colour when it is on. A real button with `role="switch"`, so it is read out
 * as one and pressed with the keyboard.
 */
export function PanelSwitch({
  on,
  label,
  onToggle,
  disabled = false,
  testId,
}: {
  on: boolean;
  /** Its name, for a reader of the page: the row's label says it to the eye. */
  label: string;
  onToggle: () => void;
  disabled?: boolean;
  testId?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border px-0.5 transition-colors focus-visible:ring-2 focus-visible:ring-moss focus-visible:outline-none disabled:opacity-50 ${
        on ? "border-moss bg-moss" : "border-rule-strong bg-rule/70"
      }`}
      data-testid={testId}
      data-on={on ? "true" : "false"}
    >
      <span
        aria-hidden="true"
        className={`inline-block size-4.5 rounded-full bg-ivory shadow transition-transform duration-200 ${on ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}

/** A small state word beside a control: IN FORCE, ON, OFF. */
export function PanelState({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "on" | "alarm" }) {
  const colour = tone === "on" ? "border-moss/50 bg-moss-soft text-ink" : tone === "alarm" ? "border-shu/60 bg-shu-soft text-ink" : "border-rule-strong/70 text-muted";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide uppercase ${colour}`}>
      {children}
    </span>
  );
}
