import Link from "next/link";

import { BrandStones } from "@/components/layout/BrandMarks";
import { Page } from "@/components/layout/Page";
import { GAME_FAMILIES } from "@/lib/gomoku/families";
import { InviteFriends } from "@/components/mine/InviteFriends";
import { AutoMatchPanel } from "@/components/mine/AutoMatchPanel";
import { fetchWaitingCounts } from "@/lib/social/autoMatch";
import { FamilyMark } from "@/components/games/FamilyMark";
import { fetchPlayedCounts } from "@/lib/history/gameCounts";
import { recordPath } from "@/lib/gomoku/slugs";
import { BUTTON_BASE, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { currentEmail } from "@/lib/auth/currentSession";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { LocalGameCardClient } from "@/components/mine/LocalGameCardClient";
import { MyGamesList } from "@/components/mine/MyGamesList";
import { OpenGamesBoard } from "@/components/mine/OpenGamesBoard";
import { PANEL_CLASS, PANEL_LINK_CLASS } from "@/components/ui/ui.constants";
import { gamePath, rulesPath } from "@/lib/gomoku/slugs";
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
  const [email, counts, waitingCounts] = await Promise.all([currentEmail(), fetchPlayedCounts(), fetchWaitingCounts()]);
  const waiting = Object.fromEntries(waitingCounts);
  const playedIn = (games: readonly string[]) => games.reduce((n, game) => n + (counts.get(game)?.played ?? 0), 0);
  return (
    <Page width="standard">
      <SiteHeader />

      <MyGamesList />
      <OpenGamesBoard />
      <LocalGameCardClient />
      {email !== null ? <InviteFriends /> : null}

      <section className="flex flex-col gap-4" data-testid="lobby-start">
        <h2 className="flex items-baseline gap-2 text-lg font-semibold">
          Start a game <span className="font-mincho text-sm font-normal opacity-70">対局を始める</span>
        </h2>
        <p className="max-w-prose text-sm text-muted">
          Four ways in, as the elder sites had them: let the site pair you, take a seat somebody posted, post one
          yourself, or challenge a member by name. Or just play at this screen.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className={`${PANEL_CLASS} flex flex-col gap-2 md:col-span-2`}>
            <h3 className="flex items-baseline gap-2 font-semibold">
              Auto-match <span className="font-mincho text-xs font-normal opacity-70">自動対局</span>
            </h3>
            {email !== null ? (
              <AutoMatchPanel waiting={waiting} />
            ) : (
              <p className="text-sm text-muted">
                Sign in, name a game and a pace, and the site pairs you with the next member who wants the same.
              </p>
            )}
          </div>
          <a href="#open-seats" className={`${PANEL_LINK_CLASS} flex flex-col gap-1`}>
            <span className="font-semibold">Waiting room <span className="font-mincho text-xs font-normal opacity-70">待合室</span></span>
            <span className="text-xs text-muted">Seats other members have posted for anyone. Sit down and play.</span>
          </a>
          <Link href={`${gamePath("freestyle")}#post-seat`} className={`${PANEL_LINK_CLASS} flex flex-col gap-1`} data-testid="post-a-seat">
            <span className="font-semibold">Post a seat <span className="font-mincho text-xs font-normal opacity-70">席を出す</span></span>
            <span className="text-xs text-muted">
              Choose the game and the pace, and start it. The other seat goes on the games page, and whoever answers first sits down opposite you.
            </span>
          </Link>
          <Link href="/players" className={`${PANEL_LINK_CLASS} flex flex-col gap-1`}>
            <span className="font-semibold">Challenge a member <span className="font-mincho text-xs font-normal opacity-70">挑戦</span></span>
            <span className="text-xs text-muted">Pick a name on the players page. The game is in their list at once.</span>
          </Link>
          <Link href={gamePath("freestyle")} className={`${PANEL_LINK_CLASS} flex flex-col gap-1`}>
            <span className="font-semibold">Two at one screen <span className="font-mincho text-xs font-normal opacity-70">対面</span></span>
            <span className="text-xs text-muted">Play Gomoku, or any game below, across the table right now.</span>
          </Link>
        </div>
      </section>

      <BrandStones className="py-1 opacity-80" />

      <section className="flex flex-col gap-4">
        <h2 className="flex items-baseline gap-2 text-lg font-semibold">
          More games <span className="font-mincho text-sm font-normal opacity-70">遊び方</span>
        </h2>
        <p className="max-w-prose text-sm text-muted">
          Everything below is five in a row with one idea changed. Open a family to see
          its games; each one has a rules page and a place in the learning shelf.
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
                    {family.games.length} games · {playedIn(family.games)} played here
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
                      <Link href={gamePath(variant)} className={`${BUTTON_BASE} ${BUTTON_STRONG} px-3 py-1 text-xs`}>play</Link>
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
