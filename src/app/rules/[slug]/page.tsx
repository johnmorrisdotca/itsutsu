import Link from "next/link";
import { notFound } from "next/navigation";

import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { gamePath, recordPath, slugFor, variantFor } from "@/lib/gomoku/slugs";
import { Suspense } from "react";

import { GameFamily } from "@/components/games/GameFamily";
import { GameLadder } from "@/components/games/GameLadder";
import { PlayedHere } from "@/components/games/PlayedHere";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import type { Paired } from "@/lib/i18n/i18n.types";
import { rulesPageFor } from "@/lib/learn/rulesPage";
import { guidesFor } from "@/lib/learn/strategy";

export const metadata = { title: "Rules" };

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

/** One game's rules, in the template every game shares. */
export default async function RulesPage({ params }: PageProps<"/rules/[slug]">) {
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
              <Link href="/rules" className="underline-offset-2 hover:underline">
                {say.say("nav.rules")}
              </Link>{" "}
              / {name.text}
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
            <Link href={gamePath(variant)} className="font-semibold underline-offset-2 hover:underline">
              {say.say("rules.playThis", { game: name.text })}
            </Link>
            {/*
              The way out of a rules page that is not "start one".
              Every game's name on this site leads here, so this page is the
              hub the rule hangs on — and it had nothing but the board and
              Wikipedia on it.

              "Who is best at it" used to be a second link beside this one,
              pointing at /champions/<slug>. It is gone because the ladder is
              now ON this page, a panel below, and that panel carries its own
              way through to the whole of it. Two links a thumb apart with the
              same words, one of them answering in place and the other sending
              you elsewhere to be answered, is the confusion this work exists
              to end rather than a second helping of it.
            */}
            <Link
              href={recordPath(variant)}
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
            anything here. It answers correctly on the live site today; it is
            simply not a question worth a page depending on.
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
          {/*
            Deferred to request time, in a component of its own. Every rules
            page is prerendered at build time, and reading the database in one
            asks at build time a question only a running site can answer — the
            build died on /rules/drop-four and nothing deployed at all.
          */}
          <Suspense fallback={null}>
            <PlayedHere variant={variant} title={page.title} />
          </Suspense>
          {/*
            Pure, so no Suspense and no request-time boundary: a family is a
            table in `families.ts` and is the same for everybody. It prerenders
            with the rules, which is what a page's static half is for.
          */}
          <GameFamily variant={variant} />
          {guides.length > 0 ? (
            <section className={`${PANEL_CLASS} flex flex-col gap-2`}>
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

      {/*
        The ladder, on the page every game's name leads to.

        Full width and below the rules, because it is a table of people rather
        than a note in a margin, and because of the order a reader arrives in:
        what the game is, then who plays it. `Suspense` and the `connection()`
        inside it for the same reason `PlayedHere` has both — the rules above
        prerender, and only this waits for a request.
      */}
      <Suspense fallback={null}>
        <GameLadder variant={variant} title={page.title} />
      </Suspense>
  </Page>
  );
}
