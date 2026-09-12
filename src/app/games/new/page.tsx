import type { Metadata } from "next";

import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SetUpGame } from "@/components/live/SetUpGame";
import { SetUpHeading } from "@/components/live/SetUpHeading";
import { setUpFrom } from "@/components/live/setUpFrom";
import { currentEmail } from "@/lib/auth/currentSession";
import { gameDefaultsFor } from "@/lib/auth/members";
import { seatsToSitAt } from "@/lib/history/seatsToSitAt";
import { fetchOpponents } from "@/lib/social/opponents";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Set up a game" };

/**
 * Setting a game up when no game has been chosen yet, at /games/new.
 *
 * The game itself is the first thing on the screen, which is the piece that
 * was missing. Everything else was already here: /games/<game>/new settles a
 * game somebody has already picked, and settles it properly. But there was no
 * way to say "I want a game" without first saying which — so the way in from
 * the lobby stayed a sentence with a dropdown in it, and John's word for that
 * was very bad design.
 *
 * The two screens are one screen. This is it with the game still to choose;
 * the other is it with the game named by the address, where offering to change
 * it would make the address a lie.
 *
 * Nothing is written until the button at the bottom, which is the whole point
 * of the ticket this answers: there is no half-made game to land on, no board
 * that is not really a board, and no settings that can move under an address
 * already pointing at them.
 *
 * AND IT IS WHERE A REMATCH LANDS, which is why the game being a choice here
 * matters beyond the lobby. A rematch knows the game, the board, the clock and
 * the opponent — but the game is a DEFAULT rather than an identity, because the
 * thing John asked for by name was "I want to definitely play Bob at Reversi,
 * but I want to try that variant". Sending a rematch to the address that names
 * a game would have settled the one field he wanted open.
 */
export default async function SetUpAnyGamePage({ searchParams }: PageProps<"/games/new">) {
  const [asked, email] = await Promise.all([searchParams, currentEmail()]);
  const [defaults, opponents, seats] = await Promise.all([
    gameDefaultsFor(email),
    fetchOpponents(email),
    seatsToSitAt(),
  ]);
  /*
   * Reads a row only where the address asked for one — a game to repeat, a
   * position to carry, a player to name. An ordinary visit costs nothing extra.
   */
  const from = await setUpFrom({ variant: null, asked, defaults });

  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />
      <SetUpHeading from={from} variant={null} />
      <SetUpGame
        initial={from.initial}
        opponents={opponents}
        seats={seats}
        signedIn={email !== null}
        chooseGame
        opponent={from.opponent}
        again={from.again}
        fork={from.fork}
        asPlayed={from.asPlayed}
        problem={from.problem}
      />
    </Page>
  );
}
