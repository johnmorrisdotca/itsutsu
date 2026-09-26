import type { Metadata } from "next";
import { GAME_SIDE_COLUMN } from "@/components/games/games.constants";
import Link from "@/components/ui/Link";
import { notFound } from "next/navigation";

import { PlayButton } from "@/components/games/PlayButton";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { gamePath, historyPath, puzzleFor, setUpPath, slugFor, variantFor } from "@/lib/gomoku/slugs";

import { EVERY_GAME_KEY, gameCopyOf } from "@/lib/catalogue/gameKeys";
import { puzzleRulesPage } from "@/lib/puzzles/puzzleRulesPage";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import type { Paired } from "@/lib/i18n/i18n.types";
import { rulesPageFor } from "@/lib/learn/rulesPage";
import { guidesFor } from "@/lib/learn/strategy";
import { GameTrail } from "@/components/games/GameTrail";

export async function generateMetadata({ params }: PageProps<"/games/[slug]/rules">): Promise<Metadata> {
  const { slug } = await params;
  const copy = gameCopyOf(variantFor(slug) ?? puzzleFor(slug) ?? "");
  return { title: copy === null ? "Rules 規則" : `${copy.label} · Rules 規則` };
}

export function generateStaticParams() {
  // A puzzle's rules are a document under it, as a game's are.
  return EVERY_GAME_KEY.map((variant) => ({ slug: slugFor(variant) }));
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
      <h2 className={`flex items-baseline gap-2 ${SECTION_TITLE}`}>
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
  const { slug } = await params;
  /*
   * A puzzle's rules in the game's template: Object, Board, Play, House,
   * built by `puzzleRulesPage` from the puzzle's own spec and copy. It has
   * no record to link and no guide on the learning shelf yet, so those two
   * are the game's alone.
   */
  const puzzle = puzzleFor(slug);
  const variant = puzzle === null ? variantFor(slug) : null;
  if (puzzle === null && variant === null) notFound();
  const key = puzzle ?? variant!;
  const page = puzzle !== null ? puzzleRulesPage(puzzle) : rulesPageFor(variant!);
  const guides = variant === null ? [] : guidesFor(variant);
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
    <Page>
      <SiteHeader />
      {/*
        The side column stands level with the title from a laptop, as on the
        game's own page (John, 2026-09-24: "flush next to header"), rather than
        starting under it.
      */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <PageTitle
            title={name.text}
            kanji={name.kanji ?? ""}
            crumb={
              <>
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
                <GameTrail
                  root={say.say("nav.games")}
                  rootTestId="rules-to-games"
                  game={{ label: name.text, href: gamePath(key), testId: "rules-up" }}
                  steps={[{ label: say.say("nav.rules") }]}
                />
              </>
            }
          >
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
          </PageTitle>
        <article className={`${PANEL_CLASS} flex min-w-0 flex-1 flex-col gap-6`} data-testid="rules-page">
          <Part heading={say.pair("rules.object", "目的")} lines={page.object} />
          <Part heading={say.pair("rules.board", "盤")} lines={page.board} />
          <Part heading={say.pair("rules.play", "手順")} lines={page.play} />
          <Part heading={say.pair("rules.house", "細則")} lines={page.house} />
          <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
            {/*
              The ways out that are not "start one", which is the big Play under
              the picture. Short here, because the
              game's own page carries every one of them in full one segment up.
              This is the document; a document that tries to be the hub as well
              is how /rules/<slug> ended up with a ladder bolted to it.
            */}
            {variant !== null ? (
              <Link
                href={historyPath(variant)}
                className="text-sm underline-offset-2 hover:underline"
                data-testid="rules-record-link"
              >
                {played.text}{" "}
                {played.kanji !== null ? <span className="font-mincho">{played.kanji}</span> : null}
              </Link>
            ) : null}
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
        </div>

        {/*
          `contents` on a phone, so the picture and its Play can come first,
          above the title, as on the game's own page, while the guides stay
          last; a column of its own from a laptop.
        */}
        <aside className={`${GAME_SIDE_COLUMN} contents lg:flex lg:flex-col lg:gap-4`}>
          {/*
            Always shown. Whether the file is there is settled by the New Game
            Gate before anything ships, so there is nothing to ask while
            serving the page — and asking meant a filesystem read whose answer
            depends on how the deployment lays out `public/` rather than on
            anything here.
          */}
          <figure className={`${PANEL_CLASS} order-first flex flex-col gap-2 lg:order-none`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- a static screenshot with no need of optimisation */}
            <img
              src={page.image}
              alt={say.say("rules.imageAlt", { game: name.text })}
              className="w-full rounded-lg"
            />
            {/* The one big Play, under the picture, as on the game's page; see `PlayButton`. */}
            <PlayButton href={setUpPath(key)} testId="rules-play" label={say.say("rules.play.button")} />
          </figure>
          {guides.length > 0 ? (
            <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="rules-learn">
              <h2 className={SECTION_TITLE}>
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
