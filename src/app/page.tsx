import Link from "@/components/ui/Link";

import { BrandStones } from "@/components/layout/BrandMarks";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS, SECTION_HEADING } from "@/components/ui/ui.constants";
import { GameCount } from "@/components/games/GameCount";
import { HomeBeta } from "@/components/home/HomeBeta";
import { HomeFamilies } from "@/components/home/HomeFamilies";
import { HomeStart } from "@/components/home/HomeStart";
import { ASK_FOR_INVITE_PATH } from "@/components/auth/askForInvite.constants";
import { currentReader } from "@/lib/auth/currentReader";
import { FEED_PATH } from "@/lib/feed/feed.constants";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { siteNumbers } from "@/lib/site/siteNumbers";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { GUIDES } from "@/lib/learn/strategy";
import { EVERY_KIND_KEY } from "@/lib/catalogue/gameKeys";

/** What the site offers, a card each: the games, how they are played, and what is kept. */
const PITCH = [
  {
    title: "Five in a row",
    kanji: "五目",
    // The count is read off the same list the catalogue counts from, never
    // written down here a second time. This page once spelled out a number
    // in plain words while /games/list computed a different one from
    // the same catalogue, because prose does not know when a game is added.
    body: `Gomoku, renju, connect6 and the family of games that grew from a line of stones, beside Reversi, checkers and go: ${RULE_VARIANT_LIST.length} board games, each with its rules a click away.`,
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
    body: "Five graded bots, gentlest first, play every game here, and two specialists play only Reversi or only five in a row. Games against them are rated, and their records are kept like anybody's.",
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
  const [reader, numbers, say] = await Promise.all([currentReader(), siteNumbers(), currentSpeaker()]);
  return (
    <Page>
      <SiteHeader hero />

      <section className="flex flex-col items-center gap-5 text-center" data-testid="front-door">
        <h1 className="text-2xl font-semibold sm:text-3xl">
          Board games, puzzles and cards, played at your own pace.
        </h1>
        {/*
          The whole catalogue, counted from the list /games draws, and the
          count leads to that list: it counted only the board games for two long after
          puzzles, party games and cards arrived, because a sentence does not
          know when a game is added.
        */}
        <p className="text-sm text-muted sm:text-base" data-testid="front-catalogue">
          <Link href="/games/list" className="underline underline-offset-4" data-testid="front-catalogue-count">
            {say.count("count.gameKind", EVERY_KIND_KEY.length)}
          </Link>{" "}
          from five in a row to Reversi, go, Solitaire and Mahjong, puzzles for one, and party games round one phone.
          Play across the table or across the world, learn the shapes that win, and keep every game you finish.
        </p>
        {/*
          THREE NUMBERS, the way Pente.org prints them (John, 2026-09-16) —
          said as what they are: an early release, by invitation, so a small
          count reads as a place not open yet rather than one people left.
          People only, and the games number links to exactly those games; see
          `siteNumbers.ts`.
        */}
        <p className="text-xs text-muted" data-testid="site-numbers">
          Itsutsu is in early release, by invitation only — so far{" "}
          <Link href="/players" className="underline underline-offset-4" data-testid="site-numbers-players">
            {say.count("count.player", numbers.players)}
          </Link>
          ,{" "}
          <GameCount count={say.count("count.gamePlayed", numbers.games)} pool="people" testId="site-numbers-games" /> between people, and{" "}
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
        {/*
          ONLY WHAT THE HEADER DOES NOT ALREADY OFFER. The hero carried Play,
          New game and Games, the same three places as the header right above
          it; John, 2026-09-29: "Home page seems to have redundant buttons?",
          then "remove dedenant. redesign it slightly yes." What is left is what
          only this page leads to: the door for somebody outside, the guides,
          and a member's own feed. The games themselves are the families just
          below.
        */}
        <div className="flex flex-wrap justify-center gap-3" data-testid="front-door-ways">
          {reader.signedIn ? null : (
            <Link href={ASK_FOR_INVITE_PATH} className={`${BUTTON_BASE} ${BUTTON_STRONG} px-5 py-2 text-base`} data-testid="enter-ask">
              Ask for an invite
            </Link>
          )}
          <Link href="/learn" className={`${BUTTON_BASE} ${BUTTON_QUIET} px-5 py-2 text-base`} data-testid="enter-learn">
            Learn the games
          </Link>
          {/*
            A member's own feed: what they and their buddies have been doing.
            Only for somebody with an account, since it names people and the
            gate keeps it from a stranger anyway.
          */}
          {reader.memberId !== null ? (
            <Link href={FEED_PATH} className={`${BUTTON_BASE} ${BUTTON_QUIET} px-5 py-2 text-base`} data-testid="enter-feed">
              {say.say("feed.homeLink")}
            </Link>
          ) : null}
        </div>
      </section>

      {/* The games, straight after: where the hero's Games button used to send a reader. */}
      <HomeFamilies />

      <BrandStones className="opacity-80" />

      <section className="grid gap-4 md:grid-cols-2">
        {PITCH.map((item) => (
          <div key={item.title} className={`${PANEL_CLASS} flex flex-col gap-2`}>
            <h2 className={SECTION_HEADING}>
              {item.title}
              <span className="font-mincho text-xs font-normal opacity-70">{item.kanji}</span>
            </h2>
            <p className="text-sm text-muted">{item.body}</p>
          </div>
        ))}
      </section>

      <HomeBeta signedIn={reader.signedIn} />

      <HomeStart signedIn={reader.signedIn} />

      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="front-story">
        <h2 className={SECTION_HEADING}>
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
