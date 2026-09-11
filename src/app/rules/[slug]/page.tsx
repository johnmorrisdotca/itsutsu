import Link from "next/link";
import { notFound } from "next/navigation";

import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { championsPath, gamePath, recordPath, slugFor, variantFor } from "@/lib/gomoku/slugs";
import { GameCount } from "@/components/games/GameCount";
import { PlayerName } from "@/components/players/PlayerName";
import { SEAT_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { countText } from "@/lib/rating/figures";
import { fetchPlayedCounts, recentGamesOf } from "@/lib/history/gameCounts";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { rulesPageFor } from "@/lib/learn/rulesPage";
import { guidesFor } from "@/lib/learn/strategy";

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
  /*
   * What has actually been played of this game. Read here rather than left to
   * a link, because a page about a game that people have played should show
   * that they have.
   */
  const [played, counts] = await Promise.all([recentGamesOf(variant), fetchPlayedCounts()]);
  const playedTotal = counts.get(variant)?.played ?? played.length;

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
                  title={`From ${page.from.country}`}
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
          <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
            <Link href={gamePath(variant)} className="font-semibold underline-offset-2 hover:underline">
              Play {page.title} →
            </Link>
            {/*
              The two ways out of a rules page that are not "start one".
              Every game's name on this site leads here, so this page is the
              hub the rule hangs on — and it had nothing but the board and
              Wikipedia on it. A reader who has just learnt what Reversi is
              wants to see it played and to see who is good at it, and both
              were a click away and unreachable.
            */}
            <Link
              href={recordPath(variant)}
              className="text-sm underline-offset-2 hover:underline"
              data-testid="rules-record-link"
            >
              Every game of {page.title} played here <span className="font-mincho">棋譜</span>
            </Link>
            <Link
              href={championsPath(variant)}
              className="text-sm underline-offset-2 hover:underline"
              data-testid="rules-champions-link"
            >
              Who is best at it <span className="font-mincho">名人</span>
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
                Read about {page.title} on Wikipedia ↗
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
            <img src={page.image} alt={`A game of ${page.title} in progress`} className="w-full rounded-lg" />
            <figcaption className="text-xs text-muted">A game in progress.</figcaption>
          </figure>
          {/*
            The games people have actually played, on the page that explains
            the game. This had a staged screenshot and a line of prose, and the
            real games were a small text link below four blocks of rules —
            John, standing on this page: "where are the played games????"
            There were four of them, filed, one click away and invisible.

            The count leads to all of them and each line leads to its own
            replay, which is the site's own rule about a number that refers to
            games.
          */}
          {played.length > 0 ? (
            <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="rules-played-here">
              <h2 className="flex items-baseline justify-between gap-2 text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
                <span>
                  Played here <span className="font-mincho normal-case tracking-normal">棋譜</span>
                </span>
                <GameCount
                  count={countText(playedTotal)}
                  variant={variant}
                  className="normal-case tracking-normal"
                  title={`Every game of ${page.title} played here`}
                />
              </h2>
              <ul className="flex flex-col divide-y divide-rule text-sm">
                {played.map((game) => (
                  <li key={game.id} className="flex items-baseline justify-between gap-2 py-1.5">
                    <span className="min-w-0 truncate">
                      <PlayerName name={game.blackName} fallback={SEAT_DISPLAY.one.label} />
                      <span className="px-1 text-muted">vs</span>
                      <PlayerName name={game.whiteName} fallback={SEAT_DISPLAY.two.label} />
                    </span>
                    <Link
                      href={recordPath(variant, game.id)}
                      className="shrink-0 text-xs text-muted underline-offset-2 hover:underline"
                    >
                      {game.moveCount} moves
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
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
