import Link from "next/link";

import { FOCUS_RING } from "./ui.constants";
import { tabHref, type Tab } from "@/lib/ui/tabs";

/**
 * One page's sections, one at a time.
 *
 * Links rather than buttons, because the open tab is in the address: it can
 * be shared, opened in a new tab, and it survives a reload. That also means
 * the page renders only the section being read, which is the point — a
 * player's record from three sites is three long tables and nobody wants all
 * of them at once.
 *
 * The strip scrolls sideways rather than wrapping, so a page with five
 * sections looks the same on a phone as on a desk: one row of tabs, with the
 * open one always drawn the same way.
 *
 * A lone tab is still drawn. It used to be suppressed as pointless, which
 * made a page with one section a different-looking page from the same page
 * with two — and the section that is always there is exactly the one worth
 * naming.
 */
export function Tabs({
  tabs,
  active,
  base,
  label,
}: {
  tabs: readonly Tab[];
  active: string;
  /** The page's own address, with no query on it. */
  base: string;
  /** What the set of tabs is, for a reader who cannot see them. */
  label: string;
}) {
  if (tabs.length === 0) return null;
  return (
    <nav aria-label={label} className="-mx-1 overflow-x-auto" data-testid="tabs">
      <ul className="flex min-w-full gap-1 border-b border-rule px-1">
        {tabs.map((tab) => {
          const open = tab.key === active;
          return (
            <li key={tab.key}>
              <Link
                href={tabHref(base, tabs, tab.key)}
                scroll={false}
                aria-current={open ? "page" : undefined}
                data-testid="tab"
                data-tab={tab.key}
                data-open={open ? "true" : "false"}
                className={`${FOCUS_RING} -mb-px flex items-baseline gap-1.5 border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                  open
                    ? "border-ink font-semibold text-ink"
                    : "border-transparent text-muted hover:border-rule-strong hover:text-ink-soft"
                }`}
              >
                {tab.label}
                {tab.kanji !== undefined ? (
                  <span className="font-mincho text-xs text-muted">{tab.kanji}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
