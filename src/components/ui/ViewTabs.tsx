import Link from "next/link";
import type { ReactNode } from "react";

import { FOCUS_RING } from "./ui.constants";

/** One choice in a row of view tabs: a link where the choice is an address, a button where it is the page's own state. */
export type ViewTab = {
  key: string;
  label: ReactNode;
  current: boolean;
  /** An address, for a choice a reader can share and the server renders; otherwise `onClick`. */
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  testId?: string;
  /** How many things the choice holds, drawn small after its name. */
  count?: number | null;
};

/**
 * THE CHOICES THAT CHANGE WHAT A PAGE LISTS, drawn as tabs.
 *
 * John, 2026-09-25, looking at /xp and /players beside My games: "we are using
 * tabs vs buttons... should be tabs everywhere right?" The page's sections were
 * tabs (`Tabs`) and every choice inside them — Everyone, People, Computers;
 * Everywhere or Itsutsu only; Simple or In full; a game's kind; the open
 * seats' pace — was a row of dark pills, which read as buttons that DO
 * something rather than a view being chosen. So they are tabs too: the same
 * underline under the open one, a step smaller than the page's own strip, so
 * a page's sections still read above the choices inside one.
 *
 * One component for every such row, links and buttons alike, and
 * `viewTabs.coverage.test.ts` fails the build on a new row of filled pills.
 * An on-and-off switch is not a choice between views and has its own look
 * (`ToggleLink`); a filter that has been applied, with an × to take it off,
 * is a chip and stays one.
 */
export function ViewTabs({
  items,
  label,
  testId,
  lead,
}: {
  items: readonly ViewTab[];
  /** What the choice is, for a reader who cannot see the row. */
  label: string;
  testId?: string;
  /** A word before the row, where one row among several needs naming ("Pace"). */
  lead?: ReactNode;
}) {
  return (
    <nav aria-label={label} data-testid={testId} className="flex min-w-0 flex-wrap items-end gap-x-1 border-b border-rule">
      {lead === undefined ? null : <span className="self-center pr-1 text-xs text-muted">{lead}</span>}
      {items.map((item) => {
        const className = `${FOCUS_RING} -mb-px inline-flex items-baseline gap-1.5 border-b-2 px-2.5 py-1 text-xs whitespace-nowrap transition-colors sm:text-sm ${
          item.current ? "border-ink font-semibold text-ink" : "border-transparent text-muted hover:border-rule-strong hover:text-ink-soft"
        } ${item.disabled ? "pointer-events-none opacity-30" : ""}`;
        const inside = (
          <>
            {item.label}
            {item.count === undefined || item.count === null ? null : (
              <span className="font-mono text-xs text-muted tabular-nums">{item.count}</span>
            )}
          </>
        );
        if (item.href !== undefined) {
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={item.current ? "true" : undefined}
              aria-disabled={item.disabled ? true : undefined}
              title={item.title}
              className={className}
              data-testid={item.testId}
            >
              {inside}
            </Link>
          );
        }
        return (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            disabled={item.disabled}
            aria-pressed={item.current}
            title={item.title}
            className={className}
            data-testid={item.testId}
          >
            {inside}
          </button>
        );
      })}
    </nav>
  );
}

/**
 * AN ON-AND-OFF SWITCH over a list, such as "Settled ratings": a box that is
 * ticked or not, beside its name. Not a tab, because it is not one view among
 * several, and not a filled pill, because that is what a view switch used to
 * look like (`ViewTabs`).
 */
export function ToggleLink({
  href,
  on,
  children,
  title,
  testId,
}: {
  href: string;
  on: boolean;
  children: ReactNode;
  title?: string;
  testId?: string;
}) {
  return (
    <Link
      href={href}
      aria-pressed={on}
      title={title}
      className={`${FOCUS_RING} inline-flex items-center gap-1.5 rounded px-1 py-1 text-xs transition-colors sm:text-sm ${on ? "text-ink" : "text-muted hover:text-ink-soft"}`}
      data-testid={testId}
    >
      <span
        aria-hidden="true"
        className={`inline-flex size-3.5 items-center justify-center rounded-sm border text-[0.6rem] leading-none ${
          on ? "border-ink bg-ink text-paper" : "border-rule-strong bg-ivory"
        }`}
      >
        {on ? "✓" : ""}
      </span>
      {children}
    </Link>
  );
}
