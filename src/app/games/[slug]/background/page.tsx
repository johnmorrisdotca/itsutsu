import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { EVERY_GAME_KEY, gameCopyOf, isPuzzleKind } from "@/lib/catalogue/gameKeys";
import { gameKeyFor, gamePath, rulesPath, slugFor } from "@/lib/gomoku/slugs";
import { backgroundFor } from "@/lib/gomoku/backgrounds";

export async function generateMetadata({ params }: PageProps<"/games/[slug]/background">): Promise<Metadata> {
  const copy = gameCopyOf(gameKeyFor((await params).slug) ?? "");
  return { title: copy === null ? "Background" : `${copy.label} · Background 背景` };
}

export function generateStaticParams() {
  // A puzzle has the address like every game, and no art has been drawn for one yet.
  return EVERY_GAME_KEY.map((variant) => ({ slug: slugFor(variant) }));
}

/**
 * A game's background art, at /games/<slug>/background.
 *
 * THE PLACE IS KEPT; THE PICTURES ARE NOT DRAWN YET. Every game gets one
 * address for its artwork, in the scheme, so that when a piece is made there
 * is already somewhere for it to live and already a link leading there. What
 * this page must not do is fill the gap with something invented — a
 * repurposed screenshot presented as art, or a paragraph of atmosphere nobody
 * wrote — because a placeholder that looks like content is how a gap stops
 * being noticed and never gets filled.
 *
 * `backgroundFor` is a TABLE, and that is the whole design of it. The
 * alternative is asking the filesystem whether a file is there while serving
 * the page, which makes the answer depend on how a deployment lays out
 * `public/` rather than on anything in this repo — and it answers differently
 * on a build machine and on a running site. A row is added when a picture is
 * made; until then the table says, truthfully, that there is none.
 */
export default async function BackgroundPage({ params }: PageProps<"/games/[slug]/background">) {
  const variant = gameKeyFor((await params).slug);
  if (variant === null) notFound();
  const copy = gameCopyOf(variant)!;
  const art = isPuzzleKind(variant) ? null : backgroundFor(variant);

  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title="Background"
        kanji="背景"
        crumb={
          <>
            <Link href={gamePath(variant)} className="underline-offset-2 hover:underline" data-testid="background-up">
              {copy.label}
            </Link>{" "}
            / Background
          </>
        }
      />

      {art === null ? (
        <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="background-none">
          <p className="text-sm">
            There is no background art for {copy.label} yet.
          </p>
          <p className="text-sm text-muted">
            This is where it will go when there is. The page exists ahead of the pictures on
            purpose: the address is part of how a game is laid out here, so it is kept whether or
            not anything has been drawn — and saying plainly that nothing has been is better than
            filling the space with something that was made for another purpose.
          </p>
          <p className="pt-1 text-sm">
            <Link href={rulesPath(variant)} className="underline underline-offset-4">
              The rules of {copy.label} <span className="font-mincho">規則</span>
            </Link>
          </p>
        </section>
      ) : (
        <figure className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="background-art">
          {/* eslint-disable-next-line @next/next/no-img-element -- a static piece of artwork, already sized */}
          <img src={art.src} alt={art.alt} className="w-full rounded-lg" />
          <figcaption className="text-xs text-muted">{art.credit}</figcaption>
        </figure>
      )}
  </Page>
  );
}
