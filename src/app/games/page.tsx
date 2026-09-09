import Link from "next/link";

import { BrandStones } from "@/components/layout/BrandMarks";
import { Page } from "@/components/layout/Page";
import { GAME_FAMILIES } from "@/lib/gomoku/families";
import { InviteFriends } from "@/components/mine/InviteFriends";
import { cookies } from "next/headers";

import { HereNowPanel } from "@/components/mine/HereNowPanel";
import { StartGame } from "@/components/mine/StartGame";
import { START_COPY } from "@/components/mine/mine.constants";
import type { GameGroup, Opponent, SeatOnBoard } from "@/components/mine/startGame.types";
import { boardSizesFor, DEFAULT_BOARD_SIZE, STONES } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { fetchOpenGames } from "@/lib/history/openGames";
import { sweepOpenSeats } from "@/lib/bots/botSeats";
import { seatClaims } from "@/lib/history/seatCookie";
import { fetchBuddies } from "@/lib/social/buddies";
import { ignoredEmails } from "@/lib/social/ignores";
import { fetchHereNow } from "@/lib/social/presence";
import { FamilyMark } from "@/components/games/FamilyMark";
import { fetchPlayedCounts } from "@/lib/history/gameCounts";
import { recordPath } from "@/lib/gomoku/slugs";
import { currentEmail } from "@/lib/auth/currentSession";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { LocalGameCardClient } from "@/components/mine/LocalGameCardClient";
import { MyGamesList } from "@/components/mine/MyGamesList";
import { OpenGamesBoard } from "@/components/mine/OpenGamesBoard";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { rulesPath } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";

export const metadata = { title: "Games" };

// Read from the database on every request, never at build time.
export const dynamic = "force-dynamic";


/**
 * The games: where a person lands after joining. One plain choice first, so
 * nobody has to understand thirty games to start playing; the families sit
 * below for whoever wants to look around.
 */
export default async function LobbyPage() {
  const claims = seatClaims((await cookies()).getAll());
  /*
   * A seat that has sat on this board longer than the grace period is taken by
   * one of the computer players, so a game posted on a quiet evening is still a
   * game by the morning. Throttled and not awaited: the listing below is what
   * the reader came for.
   */
  sweepOpenSeats();

  const [email, counts, seatGames, here] = await Promise.all([
    currentEmail(),
    fetchPlayedCounts(),
    fetchOpenGames(claims.keys()),
    fetchHereNow(),
  ]);
  const [buddies, ignored] = await Promise.all([
    email === null ? Promise.resolve([]) : fetchBuddies(email),
    email === null ? Promise.resolve(new Set<string>()) : ignoredEmails(email),
  ]);
  const playedIn = (games: readonly string[]) => games.reduce((n, game) => n + (counts.get(game)?.played ?? 0), 0);

  /*
   * A seat posted by somebody this member ignores is not on their board: the
   * ignore list is a rule about who may reach you, and a seat is a way in.
   */
  const openSeats = seatGames.filter((game) => {
    const poster = game.openSeat === STONES.black ? game.whiteMemberId : game.blackMemberId;
    return poster === null || !ignored.has(poster);
  });

  // The sentence reads the same lists the page below it shows.
  const families: GameGroup[] = GAME_FAMILIES.map((family) => ({
    title: family.title,
    kanji: family.kanji,
    games: family.games.map((variant) => ({
      variant,
      label: RULE_VARIANT_DISPLAY[variant].label,
      kanji: RULE_VARIANT_DISPLAY[variant].kanji,
      size: boardSizesFor(variant as RuleVariant)[0] ?? DEFAULT_BOARD_SIZE,
    })),
  }));
  const seats: SeatOnBoard[] = openSeats.map((game) => ({
    id: game.id,
    variant: game.variant,
    moveTimeMs: game.moveTimeMs,
    who: (game.openSeat === STONES.black ? game.whiteName : game.blackName).trim() || "Somebody",
  }));
  const hereEmails = new Set(here.map((entry) => entry.email));
  /*
   * Somebody you could ask for a game, which means somebody who can be
   * reached: a kept record has a name and a history and no address, and
   * cannot be challenged.
   */
  const opponents: Opponent[] = [
    ...here
      .filter((entry) => entry.email !== null && entry.email !== email && !ignored.has(entry.email))
      .map((entry) => ({ email: entry.email!, name: entry.name || entry.email!, here: true })),
    ...buddies
      .filter((buddy) => buddy.email !== null && !hereEmails.has(buddy.email) && !ignored.has(buddy.email))
      .map((buddy) => ({ email: buddy.email!, name: buddy.name || buddy.email!, here: false })),
  ];
  return (
    <Page width="standard">
      <SiteHeader />

      {/*
        * Starting a game comes first, and that is the fix rather than a
        * preference. "Your games" grows without limit as somebody plays, so
        * anything under it is pushed further down every week — John found the
        * dropdown a full scroll below the fold, which is the same complaint
        * that made this panel one sentence in the first place. A section whose
        * height is fixed cannot bury anything, and a section that grows cannot
        * bury what is above it.
        */}
      <section className="flex flex-col gap-4" data-testid="lobby-start">
        <h2 className="flex items-baseline gap-2 text-lg font-semibold">
          {START_COPY.title.label}{" "}
          <span className="font-mincho text-sm font-normal opacity-70">{START_COPY.title.kanji}</span>
        </h2>
        <p className="max-w-prose text-sm text-muted">{START_COPY.lead}</p>
        <div className={PANEL_CLASS}>
          <StartGame families={families} seats={seats} opponents={opponents} signedIn={email !== null} />
        </div>
        <div className="grid gap-4 md:grid-cols-[3fr_2fr]">
          <OpenGamesBoard games={openSeats} />
          <HereNowPanel here={here} me={email} />
        </div>
      </section>

      <MyGamesList />
      <LocalGameCardClient />

      {email !== null ? <InviteFriends /> : null}

      <BrandStones className="py-1 opacity-80" />

      <section className="flex flex-col gap-4">
        <h2 className="flex items-baseline gap-2 text-lg font-semibold">
          More games <span className="font-mincho text-sm font-normal opacity-70">遊び方</span>
        </h2>
        <p className="max-w-prose text-sm text-muted">
          Everything below is five in a row with one idea changed. Open a family to see
          its games; each one has a rules page and a place in the learning shelf. The whole list, as
          plain text, is on{" "}
          <Link href="/games/all" className="underline underline-offset-4">one page</Link>.
        </p>
        {GAME_FAMILIES.map((family, index) => (
          <details key={family.title} className={`${PANEL_CLASS} group`} data-testid="lobby-family" open={index === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span className="flex items-center gap-3">
                <FamilyMark family={family.title} className="size-12 shrink-0 rounded-md" />
                <span className="flex flex-col">
                  <span className="flex items-baseline gap-2 font-semibold">
                    {family.title}
                    <span className="font-mincho text-xs font-normal opacity-70">{family.kanji}</span>
                  </span>
                  <span className="text-xs font-normal text-muted">
                    {family.games.length} {family.games.length === 1 ? "game" : "games"} · {playedIn(family.games)} played here
                  </span>
                </span>
              </span>
              <span className="text-xs text-muted group-open:hidden">show</span>
              <span className="hidden text-xs text-muted group-open:inline">hide</span>
            </summary>
            <p className="mt-2 text-sm text-muted">{family.blurb}</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {family.games.map((variant) => {
                const copy = RULE_VARIANT_DISPLAY[variant];
                const count = counts.get(variant);
                return (
                  <li key={variant} className="flex items-center justify-between gap-3 rounded-lg border border-rule px-3 py-2 text-sm">
                    <span className="flex min-w-0 flex-col">
                      <span className="font-medium">{copy.label} <span className="font-mincho text-xs font-normal opacity-70">{copy.kanji}</span></span>
                      <span className="text-xs text-muted">{copy.tagline}</span>
                      {count !== undefined && count.last !== null ? (
                        <Link href={recordPath(variant, count.last.id)} className="text-[0.7rem] text-muted underline-offset-2 hover:underline">
                          {count.played} played · last {count.last.blackName.trim() || "Black"} vs {count.last.whiteName.trim() || "White"}
                        </Link>
                      ) : copy.inspiredBy !== undefined ? (
                        <span className="text-[0.7rem] text-muted italic">Inspired by {copy.inspiredBy}</span>
                      ) : null}
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-xs">
                      <Link href={rulesPath(variant)} className="text-muted underline-offset-2 hover:underline">rules</Link>
                    </span>
                  </li>
                );
              })}
            </ul>
          </details>
        ))}
      </section>
  </Page>
  );
}
