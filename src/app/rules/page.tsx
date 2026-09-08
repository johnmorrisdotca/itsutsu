import { Suspense } from "react";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { RulesIndex } from "@/components/rules/RulesIndex";
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
        {/* The filter reads the query on the client, so it renders once that is known. */}
        <Suspense>
          <RulesIndex
            cards={RULE_VARIANT_LIST.map((variant) => {
              const copy = RULE_VARIANT_DISPLAY[variant];
              return {
                variant,
                label: copy.label,
                kanji: copy.kanji,
                tagline: copy.tagline,
                inspiredBy: copy.inspiredBy,
              };
            })}
          />
        </Suspense>
        <section className="flex max-w-prose flex-col gap-2 text-xs text-muted" data-testid="rules-attribution">
          {RULES_ATTRIBUTION.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </section>
      </main>
    </div>
  );
}
