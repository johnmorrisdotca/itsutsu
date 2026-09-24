import Link from "next/link";

import { BrandStones } from "@/components/layout/BrandMarks";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS } from "@/components/ui/ui.constants";
import { GameCount } from "@/components/games/GameCount";
import { HomeBeta } from "@/components/home/HomeBeta";
import { HomeFamilies } from "@/components/home/HomeFamilies";
import { HomeStart } from "@/components/home/HomeStart";
import { ASK_FOR_INVITE_PATH } from "@/components/auth/askForInvite.constants";
import { currentReader } from "@/lib/auth/currentReader";
import { siteNumbers } from "@/lib/site/siteNumbers";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { GUIDES } from "@/lib/learn/strategy";

/** "1 player", "3 players": a count said in words. */
function plural(count: number, noun: string): string {
  // Commas by hand: a locale's formatter can differ between the server and the browser.
  const grouped = String(count).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${grouped} ${noun}${count === 1 ? "" : "s"}`;
}

/** What the site offers, a card each: the games, how they are played, and what is kept. */
const PITCH = [
  {
    title: "Five in a row",
    kanji: "五目",
    // The count is read off the same list the catalogue counts from, never
    // written down here a second time. This page once spelled out a number
    // in plain words while /games?view=list computed a different one from
    // the same catalogue, because prose does not know when a game is added.
    body: `Gomoku, renju, connect6 and the family of games that grew from a line of stones. ${RULE_VARIANT_LIST.length} of them, each with its rules a click away.`,
  },
  {
    title: "Two phones, one board",
    kanji: "通信対局",
    body: "Start a game, hand the other seat over as a QR code, and take turns from wherever you are. No account, no app.",
  },
  {
    title: "Every game kept",
    kanji: "棋譜",
    body: "A finished game is filed with its stones in order, and kept for good: no move history here goes missing after a few years. Replay it, send a friend the exact move you mean, and see how a player's rating moves.",
  },
  {
    title: "Fork any position",
    kanji: "分岐",
    body: "A close game deserves a second try. From any move of any game, start another game at exactly that position, against the same opponent, and play both.",
  },
  {
    title: "Always somebody to play",
    kanji: "対戦相手",
    body: "Five graded computer players, gentlest first, play every game here, and two specialists play only Othello or only five in a row. Games against them are rated, and their records are kept like anybody's.",
  },
  {
    title: "A ladder for every game",
    kanji: "番付",
    body: "Each game has its own rating and its own ladder, and games against the programs are scored apart, so beating a computer never moves where you stand among people.",
  },
  {
    title: "Your pace",
    kanji: "手番",
    body: "Play with no clock and move when you can, a move a day if that suits you, or put a blitz, rapid or classical clock on it. Keep a dozen games going at once, the way the old turn-based sites did; the ones waiting on you come first.",
  },
  {
    title: "Learn the shapes",
    kanji: "定石",
    // Counted from the shelf, like the games above.
    body: `${GUIDES.length === 1 ? "A strategy guide" : `${GUIDES.length} strategy guides`} on the threats, openings and endings that decide these games, each naming the games it applies to.`,
  },
] as const;

/**
 * The front page. Open to anyone; the games behind it are not. This is the
 * one page that shows the whole hero, and it says what the site is and
 * where the door is — the board itself is reached through the games.
 */
export default async function Home() {
  // The header has already asked; the member row behind it is cached for the
  // request, so asking again here reads no more than the cookie.
  const reader = await currentReader();
  const numbers = await siteNumbers();
  return (
    <Page width="standard" gap="gap-10">
      <SiteHeader hero />

      <section className="flex flex-col items-center gap-5 text-center" data-testid="front-door">
        <h1 className="max-w-2xl text-2xl font-semibold sm:text-3xl">
          A board for two, wherever you both are.
        </h1>
        <p className="max-w-xl text-sm text-muted sm:text-base">
          {RULE_VARIANT_LIST.length} board games for two people, from five in a row to Othello, checkers and go.
          Play across the table or across the world, learn the shapes that win, and keep every game you finish.
        </p>
        {/*
          THREE NUMBERS, the way Pente.org prints them (John, 2026-09-16) —
          said as what they are: an early release, by invitation, so a small
          count reads as a place not open yet rather than one people left.
          People only, and the games number links to exactly those games; see
          `siteNumbers.ts`.
        */}
        <p className="max-w-xl text-xs text-muted" data-testid="site-numbers">
          Itsutsu is in early release, by invitation only — so far{" "}
          <Link href="/players" className="underline underline-offset-4" data-testid="site-numbers-players">
            {plural(numbers.players, "player")}
          </Link>
          ,{" "}
          <GameCount count={plural(numbers.games, "game")} pool="people" testId="site-numbers-games" /> between people, and{" "}
          {numbers.hereNow} here now.
          {!reader.signedIn && (
            <>
              {" "}
              <a href="#beta" className="underline underline-offset-4" data-testid="site-numbers-beta">
                Ask for an invite, or help test it
              </a>
              .
            </>
          )}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {/*
            Play goes to the games you have, which is what the word means now
            that the lobby is two pages. It pointed at the catalogue, which was
            a bug the split left behind: the front door's main button landed
            somewhere other than where its own word said.

            No kanji on it. John's call, and right: it carried 遊ぶ while Rules
            and Learn beside it carried nothing, which read as deliberate while
            Play stood alone and reads as an oddity next to Games.
          */}
          <Link href="/play" className={`${BUTTON_BASE} ${BUTTON_STRONG} px-5 py-2 text-base`} data-testid="enter">
            Play
          </Link>
          {/*
            NEW GAME, BESIDE PLAY, BECAUSE THE TWO ARE DIFFERENT ERRANDS AND
            THE FRONT DOOR OFFERED ONLY ONE.

            Play is "show me my games", which is what a returning player wants
            and is one press from a board. Starting a NEW one from here was
            Play, then New game in the bar, then Begin — three, and John,
            2026-09-21, having counted them: "no game or process should take 3
            screens/clicks." It is two from here now.

            Quiet rather than strong: there is one loud button on a screen, and
            on the front door it is the one that leads to the games you already
            have waiting.
          */}
          <Link
            href="/games/new"
            className={`${BUTTON_BASE} ${BUTTON_QUIET} px-5 py-2 text-base`}
            data-testid="enter-new-game"
          >
            New game
          </Link>
          {/*
            The catalogue, which was reachable only from the navigation — and
            it is the page a first-time visitor actually wants: forty games,
            each with its rules.
          */}
          <Link href="/games" className={`${BUTTON_BASE} ${BUTTON_QUIET} px-5 py-2 text-base`} data-testid="enter-games">
            Games
          </Link>
          <Link href="/learn" className={`${BUTTON_BASE} ${BUTTON_QUIET} px-5 py-2 text-base`}>
            Learn
          </Link>
        </div>
      </section>

      <BrandStones className="opacity-80" />

      <section className="grid gap-4 md:grid-cols-2">
        {PITCH.map((item) => (
          <div key={item.title} className={`${PANEL_CLASS} flex flex-col gap-2`}>
            <h2 className="flex items-baseline gap-2 font-semibold">
              {item.title}
              <span className="font-mincho text-xs font-normal opacity-70">{item.kanji}</span>
            </h2>
            <p className="text-sm text-muted">{item.body}</p>
          </div>
        ))}
      </section>

      <HomeBeta signedIn={reader.signedIn} />

      <HomeFamilies />

      <HomeStart signedIn={reader.signedIn} />

      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="front-story">
        <h2 className="flex items-baseline gap-2 font-semibold">
          Where this comes from
          <span className="font-mincho text-xs font-normal opacity-70">由来</span>
        </h2>
        <p className="text-sm leading-relaxed text-ink-soft">
          For years the founder of this site and his parents played across two households on the great
            turn-based sites of the early web, ItsYourTurn and GoldToken — Othello with his father, and
            five-in-a-row, Pente and Othello with his mother — sometimes hours a day, dozens of games open at once, and memberships bought to
            lift the daily cap on moves, because twenty was never going to last until lunch. Those sites
            understood that a game between people who love each other does not need to be fast; it
            needs to be kept. Itsutsu is a continuation of that, and a tribute to it.
          </p>
        <p className="text-sm leading-relaxed text-ink-soft">
          The family is half Japanese, and the games came with the heritage. Five in a row has been
          played on go boards in Japan since the Heian period, a thousand years ago, and the name of
          this site is just the Japanese for the number — <span className="font-mincho">五つ</span>,
          five stones.
        </p>
          <p className="text-sm">
          <Link href="/about" className="font-medium underline underline-offset-4" data-testid="read-story">
            Read the whole story →
          </Link>
        </p>
      </section>

      {/*
        The door, for somebody standing outside it. A member already in was
        being told the site is by invitation and asked for a code they had
        already used.
      */}
      {!reader.signedIn && (
        <footer className="border-t border-rule pt-5 text-xs text-muted" data-testid="invite-line">
          Itsutsu <span className="font-mincho">五つ</span> is by invitation. If you have a code,{" "}
          <Link href="/join" className="underline underline-offset-4">
            come in
          </Link>
          . If you do not,{" "}
          <Link href={ASK_FOR_INVITE_PATH} className="underline underline-offset-4" data-testid="invite-line-ask">
            ask for one
          </Link>
          .
        </footer>
      )}
  </Page>
  );
}
