import Link from "next/link";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { GUIDES } from "@/lib/learn/strategy";

export const metadata = { title: "Learn" };

/** The strategy guides, one card each, with the games they cover. */
export default function LearnIndexPage() {
  return (
    <div className="paper flex flex-1 flex-col items-center px-4 py-8 sm:px-8">
      <main className="flex w-full max-w-5xl flex-col gap-6">
        <SiteHeader />
        <section className="flex flex-col gap-2">
          <h1 className="flex items-baseline gap-2 text-lg font-semibold">
            Learn <span className="font-mincho text-sm font-normal opacity-70">学び</span>
          </h1>
          <p className="max-w-prose text-sm text-muted">
            How to think about each game: the shapes that win, the moves that force, and
            the mistakes everyone makes once. Each guide names the games it applies to.
          </p>
        </section>
        <ul className="grid gap-3 sm:grid-cols-2" data-testid="learn-index">
          {GUIDES.map((guide) => (
            <li key={guide.slug}>
              <Link
                href={`/learn/${guide.slug}`}
                className={`${PANEL_CLASS} flex h-full flex-col gap-2 transition-colors hover:border-zinc-400 dark:hover:border-zinc-600`}
              >
                <span className="flex items-baseline gap-2 font-semibold">
                  {guide.title}
                  <span className="font-mincho text-xs font-normal opacity-70">{guide.kanji}</span>
                </span>
                <span className="text-xs text-muted">{guide.summary}</span>
                <span className="text-[0.65rem] text-zinc-500">
                  {guide.variants.map((variant) => RULE_VARIANT_DISPLAY[variant].label).join(" · ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
