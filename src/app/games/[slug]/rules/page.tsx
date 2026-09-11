import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { gamePath, historyPath, playPath, slugFor, variantFor } from "@/lib/gomoku/slugs";

import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import type { Paired } from "@/lib/i18n/i18n.types";
import { rulesPageFor } from "@/lib/learn/rulesPage";
import { guidesFor } from "@/lib/learn/strategy";

export async function generateMetadata({ params }: PageProps<"/games/[slug]/rules">): Promise<Metadata> {
  const variant = variantFor((await params).slug);
  return { title: variant === null ? "Rules 規則" : `${RULE_VARIANT_DISPLAY[variant].label} · Rules 規則` };
}

export function generateStaticParams() {
  return RULE_VARIANT_LIST.map((variant) => ({ slug: slugFor(variant) }));
}

/**
 * One section of the template, headed in the LOCALE + JP pattern: the word
 * switches with the reader's language and the kanji beside it does not —
 * unless the reader's own language is written in that script, in which case
 * there is no second copy to show. `pair` decides that; this only draws it.
 */
function Part({ heading, lines }: { heading: Paired; lines: string[] }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex items-baseline gap-2 text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
        {heading.text}
        {heading.kanji !== null ? (
          <span className="font-mincho text-xs normal-case tracking-normal">{heading.kanji}</span>
        ) : null}
      </h2>
      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}

/**
 * One game's rules, at /games/<slug>/rules, in the template every game shares.
 *
 * A FACET RATHER THAN A NAMESPACE. These pages were /rules/<slug>, with an
 * index of their own at /rules, and the rules page was doubling as the game's
 * front door — every game's name on this site led here, so the ladder, the
 * record and the family had all been piled onto it because there was nowhere
 * else a reader could reach them from. The game has its own address now, one
 * segment up, and it carries all of that. This page is what it was named for:
 * the document.
 *
 * Still prerendered, and it still must be. Nothing here reads the database,
 * and that is the property to keep: `generateStaticParams` with no `export
 * const dynamic` means the whole page is built ahead of time, and a database
 * read in one asks at build time a question only a running site can answer.
 * The build died on /rules/drop-four for exactly that and nothing deployed at
 * all. The panels that need a database are on the game's front door, each
 * behind its own `connection()`.
 */
export default async function RulesPage({ params }: PageProps<"/games/[slug]/rules">) {
  const variant = variantFor((await params).slug);
  if (variant === null) notFound();
  const page = rulesPageFor(variant);
  const guides = guidesFor(variant);
  const say = await currentSpeaker();
  /*
   * The game's own name. It has no dictionary entry and wants none — a name
   * is not translated — but the site already carries its Japanese in the
   * kanji beside it, so a Japanese reader is shown that and nothing after it.
   */
  const name = say.pairName(page.title, page.kanji);
  const played = say.pair("rules.everyGamePlayed", "棋譜", { game: name.text });
  const learn = say.pair("rules.learn", "学び");

  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <article className={`${PANEL_CLASS} flex min-w-0 flex-1 flex-col gap-6`} data-testid="rules-page">
          <header className="flex flex-col gap-1">
            <p className="text-xs text-muted">
              {/*
                THREE STEPS, AND THE FIRST ONE IS WHY.

                Up to the GAME, not across to an index of rules: there is no
                index of rules any more, a game's rules belong to the game, and
                the way to another game's rules is through that game. The trail
                reads Games / name / Rules because that is what the address
                says, and this is where the word "Rules" goes on being said,
                which is why taking the bar's entry out did not leave its
                phrase with nothing to name.

                AND THE CATALOGUE COMES FIRST BECAUSE OF WHO ELSE READS THIS
                PAGE. This address is open without an invite and the game's own
                page beside it is not — the hub carries the ladder and the
                standings, which are members' names and figures. So for a
                stranger, the middle step of this trail is a door and the first
                one is the only way onward the site can actually honour. A page
                that is public must have a public way out of it, or it is a
                room with one exit that is locked.
              */}
              <Link href="/games" className="underline-offset-2 hover:underline" data-testid="rules-to-games">
                {say.say("nav.games")}
              </Link>{" "}
              /{" "}
              <Link href={gamePath(variant)} className="underline-offset-2 hover:underline" data-testid="rules-up">
                {name.text}
              </Link>{" "}
              / {say.say("nav.rules")}
            </p>
            <h1 className="flex items-baseline gap-2 text-2xl font-semibold">
              {name.text}
              {name.kanji !== null ? (
                <span className="font-mincho text-base font-normal opacity-70">{name.kanji}</span>
              ) : null}
            </h1>
            <p className="text-sm font-medium">{page.tagline}</p>
            <p className="text-xs text-muted italic">
              {/*
                The flag sits with the sentence about where the game is from,
                because that is the sentence it is a picture of. Hidden from a
                screen reader: the country is already said in the prose, and
                an emoji read aloud in the middle of it only interrupts.
              */}
              {page.from !== null ? (
                <span
                  className="mr-1.5 not-italic"
                  aria-hidden="true"
                  title={say.say("rules.from", { country: page.from.country })}
                  data-testid="origin-flag"
                  data-country={page.from.code}
                >
                  {page.from.flag}
                </span>
              ) : null}
              {page.origin}
            </p>
            {page.inspiredBy !== undefined ? (
              <p className="text-xs text-muted" data-testid="inspired-by">
                {say.say("rules.inspiredBy", { name: page.inspiredBy })}
              </p>
            ) : null}
            {/*
              A player arrives knowing one name for a game, and it is often not
              ours. Saying the others here is what lets them recognise it.
            */}
            {page.alsoKnownAs.length > 0 ? (
              <p className="text-xs text-muted" data-testid="also-known-as">
                {say.say("rules.alsoKnownAs", { names: page.alsoKnownAs.join(", ") })}
              </p>
            ) : null}
          </header>
          <Part heading={say.pair("rules.object", "目的")} lines={page.object} />
          <Part heading={say.pair("rules.board", "盤")} lines={page.board} />
          <Part heading={say.pair("rules.play", "手順")} lines={page.play} />
          <Part heading={say.pair("rules.house", "細則")} lines={page.house} />
          <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
<Link href={playPath(variant)} className="font-semibold underline-offset-2 hover:underline">
              {say.say("rules.playThis", { game: name.text })}
            </Link>
            {/*
              The ways out that are not "start one". Short here, because the
              game's own page carries every one of them in full one segment up.
              This is the document; a document that tries to be the hub as well
              is how /rules/<slug> ended up with a ladder bolted to it.
            */}
            <Link
              href={historyPath(variant)}
              className="text-sm underline-offset-2 hover:underline"
              data-testid="rules-record-link"
            >
              {played.text}{" "}
              {played.kanji !== null ? <span className="font-mincho">{played.kanji}</span> : null}
            </Link>
            {/*
              Somewhere outside this site that can contradict us. A rules page
              is only worth trusting if it can be checked, and the article is
              also where a reader goes for the history this page has no room
              for.
            */}
            {page.wikipedia !== null ? (
              <a
                href={page.wikipedia}
                target="_blank"
                rel="noreferrer noopener"
                className="text-xs text-muted underline-offset-2 hover:underline"
                data-testid="wikipedia-link"
              >
                {say.say("rules.wikipedia", { game: name.text })}
              </a>
            ) : null}
          </p>
        </article>

        <aside className="flex w-full flex-col gap-4 lg:w-80">
          {/*
            Always shown. Whether the file is there is settled by the New Game
            Gate before anything ships, so there is nothing to ask while
            serving the page — and asking meant a filesystem read whose answer
            depends on how the deployment lays out `public/` rather than on
            anything here.
          */}
          <figure className={`${PANEL_CLASS} flex flex-col gap-2`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- a static screenshot with no need of optimisation */}
            <img
              src={page.image}
              alt={say.say("rules.imageAlt", { game: name.text })}
              className="w-full rounded-lg"
            />
            <figcaption className="text-xs text-muted">{say.say("rules.inProgress")}</figcaption>
          </figure>
          {guides.length > 0 ? (
            <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="rules-learn">
              <h2 className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
                {learn.text}{" "}
                {learn.kanji !== null ? (
                  <span className="font-mincho normal-case tracking-normal">{learn.kanji}</span>
                ) : null}
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
