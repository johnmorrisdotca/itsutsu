import Link from "next/link";
import { notFound } from "next/navigation";

import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { GUIDES, guideBySlug } from "@/lib/learn/strategy";

export const metadata = { title: "Learn" };

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

/** One strategy guide, as an article. */
export default async function GuidePage({ params }: PageProps<"/learn/[slug]">) {
  const { slug } = await params;
  const guide = guideBySlug(slug);
  if (guide === null) notFound();

  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />
      <article className={`${PANEL_CLASS} flex max-w-3xl flex-col gap-6`} data-testid="guide-page">
        <header className="flex flex-col gap-1">
          <p className="text-xs text-muted">
            <Link href="/learn" className="underline-offset-2 hover:underline">
              Learn
            </Link>{" "}
            / {guide.title}
          </p>
          <h1 className="flex items-baseline gap-2 text-2xl font-semibold">
            {guide.title}
            <span className="font-mincho text-base font-normal opacity-70">{guide.kanji}</span>
          </h1>
          <p className="text-sm text-muted">{guide.summary}</p>
          <p className="flex flex-wrap gap-2 pt-1 text-xs">
            {guide.variants.map((variant) => (
              <Link
                key={variant}
                href={`/rules/${variant}`}
                className="rounded-full border border-rule px-2 py-0.5 underline-offset-2 hover:underline"
              >
                {RULE_VARIANT_DISPLAY[variant].label}
              </Link>
            ))}
          </p>
        </header>
        {guide.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-2">
            <h2 className="text-base font-semibold">{section.heading}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-relaxed">
                {paragraph}
              </p>
            ))}
            {section.points ? (
              <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed">
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </article>
  </Page>
  );
}
