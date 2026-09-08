import Link from "next/link";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { RULES_ATTRIBUTION } from "@/lib/gomoku/openings.constants";

export const metadata = { title: "Rules" };

/** Every game, one card each, leading to its rules page. */
export default function RulesIndexPage() {
  return (
    <div className="paper flex flex-1 flex-col items-center px-4 py-8 sm:px-8">
      <main className="flex w-full max-w-5xl flex-col gap-6">
        <SiteHeader />
        <section className="flex flex-col gap-2">
          <h1 className="flex items-baseline gap-2 text-lg font-semibold">
            Rules <span className="font-mincho text-sm font-normal opacity-70">規則</span>
          </h1>
          <p className="max-w-prose text-sm text-muted">
            Every game here is a line of stones at heart. Each page follows the same shape,
            so once you have read one you know where to look on the rest: what you are
            trying to do, the board, how a turn goes, and the details.
          </p>
        </section>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="rules-index">
          {RULE_VARIANT_LIST.map((variant) => {
            const copy = RULE_VARIANT_DISPLAY[variant];
            return (
              <li key={variant}>
                <Link
                  href={`/rules/${variant}`}
                  className={`${PANEL_CLASS} flex h-full flex-col gap-1 transition-colors hover:border-rule-strong`}
                >
                  <span className="flex items-baseline gap-2 font-semibold">
                    {copy.label}
                    <span className="font-mincho text-xs font-normal opacity-70">{copy.kanji}</span>
                  </span>
                  <span className="text-xs text-muted">{copy.tagline}</span>
                  {copy.inspiredBy !== undefined ? (
                    <span className="text-[0.7rem] text-muted italic">Inspired by {copy.inspiredBy}</span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
        <section className="flex max-w-prose flex-col gap-2 text-xs text-muted" data-testid="rules-attribution">
          {RULES_ATTRIBUTION.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </section>
      </main>
    </div>
  );
}
