import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { GameFamily } from "@/components/games/GameFamily";
import { GameLadder } from "@/components/games/GameLadder";
import { PlayedHere } from "@/components/games/PlayedHere";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS } from "@/components/ui/ui.constants";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import {
  backgroundPath,
  familyPath,
  historyPath,
  myGamePath,
  playPath,
  rulesPath,
  setUpPath,
  slugFor,
  standingsPath,
  variantFor,
} from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { rulesPageFor } from "@/lib/learn/rulesPage";

export async function generateMetadata({ params }: PageProps<"/games/[slug]">): Promise<Metadata> {
  const variant = variantFor((await params).slug);
  if (variant === null) return { title: "Games" };
  const copy = RULE_VARIANT_DISPLAY[variant];
  return { title: `${copy.label} ${copy.kanji}`, description: copy.tagline };
}

export function generateStaticParams() {
  return RULE_VARIANT_LIST.map((variant) => ({ slug: slugFor(variant) }));
}

/**
 * THE GAME. /games/<slug>, and the front door every game's name leads to.
 *
 * A game used to be spread across four namespaces — /games/<slug> was a board,
 * /rules/<slug> was what it is, /history/<slug> was what had been played of it
 * and /champions/<slug> was who was best at it — and a reader who arrived at
 * any one of them had to already know the other three existed. The rules page
 * had become the de-facto front door, because that is where `GameName` sent
 * everybody, and it grew a ladder and a record panel to cope. That was the
 * right fix under the old addresses and the wrong shape: a document was doing
 * a hub's job.
 *
 * So the hub is the game itself, and the document, the record, the ladder and
 * the board are facets one segment under it. This page's whole job is to be
 * the place from which the errand can be finished, whatever the errand was.
 *
 * PRERENDERED, AND THE REASON MATTERS. `generateStaticParams` with no `export
 * const dynamic` means the shell of all forty of these is built ahead of time,
 * which is right for what a game IS — the same for everybody, and readable
 * without a session. Nothing on this page may read the database outside the
 * two panels below, each of which is a component of its own holding a
 * `connection()`. A database read out here asks at build time a question only
 * a running site can answer: it killed the build on /rules/drop-four once and
 * nothing deployed at all.
 */
export default async function GamePage({ params }: PageProps<"/games/[slug]">) {
  const variant = variantFor((await params).slug);
  if (variant === null) notFound();
  const page = rulesPageFor(variant);

  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start" data-testid="game-front-door">
        {/*
          The picture is part of what this page is for. A name and a tagline
          tell a reader what a game is called; a board mid-game tells them
          whether they want to play it, which is the question they actually
          arrived with. eslint-disable: a static screenshot, already sized, with
          nothing for the optimiser to do.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element -- a static screenshot with no need of optimisation */}
        <img
          src={page.image}
          alt={`A game of ${page.title} in progress`}
          className="w-full rounded-xl border border-rule sm:w-56"
          data-testid="game-picture"
        />
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="flex items-baseline gap-2 text-2xl font-semibold">
            {page.title}
            <span className="font-mincho text-base font-normal opacity-70">{page.kanji}</span>
          </h1>
          <p className="text-sm font-medium">{page.tagline}</p>
          <p className="text-xs text-muted italic">
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
          {page.alsoKnownAs.length > 0 ? (
            <p className="text-xs text-muted" data-testid="also-known-as">
              Also known as {page.alsoKnownAs.join(", ")}.
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/*
              Two ways onto a board, because they are two different intentions
              and the site has always had both: a board in this browser now,
              and a game set up against somebody. Neither is what a game's NAME
              means, which is why the name leads here and not to either of them.
            */}
            <Link href={playPath(variant)} className={`${BUTTON_BASE} ${BUTTON_STRONG} px-4 py-2`} data-testid="game-play">
              Play {page.title} →
            </Link>
            <Link href={setUpPath(variant)} className={`${BUTTON_BASE} ${BUTTON_QUIET} px-4 py-2`} data-testid="game-set-up">
              Set one up 対局設定
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {/*
            What the game IS, in the two lines that answer it, with the whole
            document one click on. The rules used to be this page; the summary
            is here so that "what is this" is answered without a click, and the
            page it came from is still where a reader goes to settle a question.
          */}
          <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="game-object">
            <h2 className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
              The object <span className="font-mincho normal-case tracking-normal">目的</span>
            </h2>
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed">
              {page.object.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="pt-1 text-sm">
              <Link href={rulesPath(variant)} className="font-semibold underline-offset-2 hover:underline" data-testid="game-rules-link">
                The whole rules of {page.title} <span className="font-mincho">規則</span> →
              </Link>
            </p>
          </section>

          {/*
            Deferred to request time, in a component of its own, for the reason
            written at the top of this file. It shows nothing at all to a
            reader with no session.
          */}
          <Suspense fallback={null}>
            <PlayedHere variant={variant} title={page.title} />
          </Suspense>

          {/*
            The ladder: who is best at it, where everybody stands, where the
            reader stands, and a game offered to any of them. Four of the seven
            errands, one panel, and it leads on to the whole of it at
            /games/<slug>/standings.
          */}
          <Suspense fallback={null}>
            <GameLadder variant={variant} title={page.title} />
          </Suspense>
        </div>

        <aside className="flex w-full flex-col gap-4 lg:w-72">
          {/*
            Pure, so no Suspense and no request-time boundary: a family is a
            table in `families.ts` and is the same for everybody. It prerenders
            with the rest, which is what a page's static half is for.
          */}
          <GameFamily variant={variant} />

          <nav className={`${PANEL_CLASS} flex flex-col gap-1 text-sm`} data-testid="game-facets">
            <h2 className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
              All of it <span className="font-mincho normal-case tracking-normal">一覧</span>
            </h2>
            {/*
              Every facet of this game, named once, so that nothing about it is
              reachable only by knowing an address. A reader who came for one
              of these can see the other six.
            */}
            <Link href={rulesPath(variant)} className="underline-offset-2 hover:underline">
              Rules <span className="font-mincho opacity-70">規則</span>
            </Link>
            <Link href={historyPath(variant)} className="underline-offset-2 hover:underline" data-testid="facet-history">
              Every game played here <span className="font-mincho opacity-70">棋譜</span>
            </Link>
            <Link href={myGamePath(variant)} className="underline-offset-2 hover:underline" data-testid="facet-me">
              Your own games of it <span className="font-mincho opacity-70">自分の棋譜</span>
            </Link>
            <Link href={standingsPath(variant)} className="underline-offset-2 hover:underline" data-testid="facet-standings">
              Standings <span className="font-mincho opacity-70">名人</span>
            </Link>
            <Link href={familyPath(variant)} className="underline-offset-2 hover:underline" data-testid="facet-family">
              Its family <span className="font-mincho opacity-70">同族</span>
            </Link>
            <Link href={backgroundPath(variant)} className="underline-offset-2 hover:underline" data-testid="facet-background">
              Background <span className="font-mincho opacity-70">背景</span>
            </Link>
          </nav>

          {page.wikipedia !== null ? (
            <p className="text-xs text-muted">
              {/*
                Somewhere outside this site that can contradict us. A page about
                a game is only worth trusting if it can be checked.
              */}
              <a
                href={page.wikipedia}
                target="_blank"
                rel="noreferrer noopener"
                className="underline-offset-2 hover:underline"
                data-testid="wikipedia-link"
              >
                Read about {page.title} on Wikipedia ↗
              </a>
            </p>
          ) : null}
        </aside>
      </div>
  </Page>
  );
}
