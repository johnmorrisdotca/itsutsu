import Link from "next/link";
import { notFound } from "next/navigation";

import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { gamePath, slugFor, variantFor } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { rulesPageFor } from "@/lib/learn/rulesPage";
import { guidesFor } from "@/lib/learn/strategy";
import { hasGameImage } from "@/lib/learn/images";

export const metadata = { title: "Rules" };

export function generateStaticParams() {
  return RULE_VARIANT_LIST.map((variant) => ({ slug: slugFor(variant) }));
}

function Part({ title, kanji, lines }: { title: string; kanji: string; lines: string[] }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex items-baseline gap-2 text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
        {title} <span className="font-mincho text-xs normal-case tracking-normal">{kanji}</span>
      </h2>
      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}

/** One game's rules, in the template every game shares. */
export default async function RulesPage({ params }: PageProps<"/rules/[slug]">) {
  const variant = variantFor((await params).slug);
  if (variant === null) notFound();
  const page = rulesPageFor(variant);
  const guides = guidesFor(variant);
  const image = hasGameImage(variant);

  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <article className={`${PANEL_CLASS} flex min-w-0 flex-1 flex-col gap-6`} data-testid="rules-page">
          <header className="flex flex-col gap-1">
            <p className="text-xs text-muted">
              <Link href="/rules" className="underline-offset-2 hover:underline">
                Rules
              </Link>{" "}
              / {page.title}
            </p>
            <h1 className="flex items-baseline gap-2 text-2xl font-semibold">
              {page.title}
              <span className="font-mincho text-base font-normal opacity-70">{page.kanji}</span>
            </h1>
            <p className="text-sm font-medium">{page.tagline}</p>
            <p className="text-xs text-muted italic">{page.origin}</p>
            {page.inspiredBy !== undefined ? (
              <p className="text-xs text-muted" data-testid="inspired-by">
                Inspired by {page.inspiredBy}. The name belongs to its owner; this is our own version of the rules.
              </p>
            ) : null}
            {/*
              A player arrives knowing one name for a game, and it is often not
              ours. Saying the others here is what lets them recognise it.
            */}
            {page.alsoKnownAs.length > 0 ? (
              <p className="text-xs text-muted" data-testid="also-known-as">
                Also known as {page.alsoKnownAs.join(", ")}.
              </p>
            ) : null}
          </header>
          <Part title="Object" kanji="目的" lines={page.object} />
          <Part title="Board" kanji="盤" lines={page.board} />
          <Part title="Play" kanji="手順" lines={page.play} />
          <Part title="House rules" kanji="細則" lines={page.house} />
          <p className="text-sm">
            <Link href={gamePath(variant)} className="font-semibold underline-offset-2 hover:underline">
              Play {page.title} →
            </Link>
          </p>
        </article>

        <aside className="flex w-full flex-col gap-4 lg:w-80">
          {image ? (
            <figure className={`${PANEL_CLASS} flex flex-col gap-2`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- a static screenshot with no need of optimisation */}
              <img src={page.image} alt={`A game of ${page.title} in progress`} className="w-full rounded-lg" />
              <figcaption className="text-xs text-muted">A game in progress.</figcaption>
            </figure>
          ) : null}
          {guides.length > 0 ? (
            <section className={`${PANEL_CLASS} flex flex-col gap-2`}>
              <h2 className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
                Learn <span className="font-mincho normal-case tracking-normal">学び</span>
              </h2>
              <ul className="flex flex-col gap-2 text-sm">
                {guides.map((guide) => (
                  <li key={guide.slug}>
                    <Link href={`/learn/${guide.slug}`} className="font-semibold underline-offset-2 hover:underline">
                      {guide.title}
                    </Link>
                    <p className="text-xs text-muted">{guide.summary}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
  </Page>
  );
}
