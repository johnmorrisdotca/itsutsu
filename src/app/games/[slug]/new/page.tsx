import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SetUpGame } from "@/components/live/SetUpGame";
import { SetUpHeading } from "@/components/live/SetUpHeading";
import { setUpFrom } from "@/components/live/setUpFrom";
import { currentEmail } from "@/lib/auth/currentSession";
import { gameDefaultsFor } from "@/lib/auth/members";
import { variantFor } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { seatsToSitAt } from "@/lib/history/seatsToSitAt";
import { fetchOpponents } from "@/lib/social/opponents";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/games/[slug]/new">): Promise<Metadata> {
  const { slug } = await params;
  const variant = variantFor(slug);
  return { title: variant === null ? "Set up a game" : `Set up ${RULE_VARIANT_DISPLAY[variant].label}` };
}

/**
 * Setting a game up, at /games/<slug>/new — before the game exists.
 *
 * The address names the game the way every other address here does, and the
 * screen is the whole of the decision: the rules, the clock, and who it is
 * against. Nothing is written until the button is pressed, so there is no
 * half-made game to land on, no board that is not really a board, and no
 * settings that can move under an address already pointing at them.
 *
 * IT IS ALSO WHERE A FORK AND THE LOBBY SENTENCE LAND, and for the opposite
 * reason to a rematch, which goes to /games/new. Both of those have settled the
 * game already: a fork carries a POSITION, and a position belongs to the game it
 * was played in — offering to make a Reversi position a Halma one would not be
 * a preference. The sentence has just been used to pick a game, so the address
 * says which. Both keep the game in the path, which is where this site puts
 * identity, and everything else they already know arrives in the query.
 */
export default async function SetUpPage({ params, searchParams }: PageProps<"/games/[slug]/new">) {
  const [{ slug }, asked] = await Promise.all([params, searchParams]);
  const variant = variantFor(slug);
  if (variant === null) notFound();

  const email = await currentEmail();
  const [defaults, opponents, seats] = await Promise.all([
    gameDefaultsFor(email),
    fetchOpponents(email),
    seatsToSitAt(),
  ]);
  /*
   * Reads a row only where the address asked for one — a position to carry, a
   * player to name. An ordinary visit to a game's setup screen costs nothing
   * extra, which is the same promise the page made before it could be
   * pre-filled at all.
   */
  const from = await setUpFrom({ variant, asked, defaults });

  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />
      <SetUpHeading from={from} variant={variant} />
      <SetUpGame
        initial={from.initial}
        opponents={opponents}
        seats={seats}
        signedIn={email !== null}
        opponent={from.opponent}
        again={from.again}
        fork={from.fork}
        asPlayed={from.asPlayed}
        problem={from.problem}
      />
    </Page>
  );
}
