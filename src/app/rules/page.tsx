import { Paired } from "@/components/i18n/Paired";
import Link from "next/link";
import { Suspense } from "react";

import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { RulesIndex, type RulesKind } from "@/components/rules/RulesIndex";
import { RULE_VARIANT_LIST, VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { RULES_ATTRIBUTION } from "@/lib/gomoku/openings.constants";

export const metadata = { title: "Rules" };

/** Every game, one card each, leading to its rules page. */
export default function RulesIndexPage() {
  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />
      <section className="flex flex-col gap-2">
        <h1 className="flex items-baseline gap-2 text-lg font-semibold">
          <Paired en="Rules" kanji="規則" kanjiClassName="text-sm font-normal opacity-70" />
        </h1>
        <p className="max-w-prose text-sm text-muted">
          Every game here is a line of stones at heart. Each page follows the same shape,
          so once you have read one you know where to look on the rest: what you are
          trying to do, the board, how a turn goes, and the details. For the whole list as plain
          text, see{" "}
          <Link href="/games/all" className="underline underline-offset-4" data-testid="every-game-link">
            every game
          </Link>
          .
        </p>
      </section>
      {/* The filter reads the query on the client, so it renders once that is known. */}
      <Suspense>
        <RulesIndex
          cards={RULE_VARIANT_LIST.map((variant) => {
            const copy = RULE_VARIANT_DISPLAY[variant];
            const spec = VARIANT_SPECS[variant];
            return {
              variant,
              label: copy.label,
              kanji: copy.kanji,
              tagline: copy.tagline,
              inspiredBy: copy.inspiredBy,
              // What wins, read from the spec so the bar cannot drift from the rules.
              kind: spec.flips ? "flips" : (String(spec.winLength ?? 5) as RulesKind),
            };
          })}
        />
      </Suspense>
      <section className="flex max-w-prose flex-col gap-2 text-xs text-muted" data-testid="rules-attribution">
        {RULES_ATTRIBUTION.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </section>
  </Page>
  );
}
