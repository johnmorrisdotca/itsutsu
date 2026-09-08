import Link from "next/link";

import { BrandStones } from "@/components/layout/BrandMarks";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS } from "@/components/ui/ui.constants";

/** What the site says about itself, in three lines. */
const PITCH = [
  {
    title: "Five in a row",
    kanji: "五目",
    body: "Gomoku, renju, connect6 and the family of games that grew from a line of stones. Thirty of them, each with its rules a click away.",
  },
  {
    title: "Two phones, one board",
    kanji: "通信対局",
    body: "Start a game, hand the other seat over as a QR code, and take turns from wherever you are. No account, no app.",
  },
  {
    title: "Every game kept",
    kanji: "棋譜",
    body: "A finished game is filed with its stones in order. Replay it, send a friend the exact move you mean, and see how a player's rating moves.",
  },
] as const;

/**
 * The front page. Open to anyone; the games behind it are not. This is the
 * one page that shows the whole hero, and it says what the site is and
 * where the door is — the board itself is reached through the games.
 */
export default function Home() {
  return (
    <Page width="standard" gap="gap-10">
      <SiteHeader hero />

      <section className="flex flex-col items-center gap-5 text-center" data-testid="front-door">
        <h1 className="max-w-2xl text-2xl font-semibold sm:text-3xl">
          A board for two, wherever you both are.
        </h1>
        <p className="max-w-xl text-sm text-muted sm:text-base">
          A quiet board for two people. Play across the table or across the world, learn the
          shapes that win, and keep every game you finish.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/games" className={`${BUTTON_BASE} ${BUTTON_STRONG} px-5 py-2 text-base`} data-testid="enter">
            Play <span className="font-mincho text-sm opacity-80">遊ぶ</span>
          </Link>
          <Link href="/rules" className={`${BUTTON_BASE} ${BUTTON_QUIET} px-5 py-2 text-base`}>
            Rules
          </Link>
          <Link href="/learn" className={`${BUTTON_BASE} ${BUTTON_QUIET} px-5 py-2 text-base`}>
            Learn
          </Link>
        </div>
      </section>

      <BrandStones className="opacity-80" />

      <section className="grid gap-4 md:grid-cols-3">
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

      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="front-story">
        <h2 className="flex items-baseline gap-2 font-semibold">
          Where this comes from
          <span className="font-mincho text-xs font-normal opacity-70">由来</span>
        </h2>
        <p className="text-sm leading-relaxed text-ink-soft">
          For years the founder of this site played five-in-a-row and Pente with his mother and father on
          two of the great turn-based sites of the early web, ItsYourTurn and GoldToken — a move a day, a
          game that ran for a month across three houses. Those sites understood that a board game between
          people who love each other does not need to be fast; it needs to be kept. Itsutsu is a
          continuation of that, and a tribute to it.
        </p>
        <p className="text-sm leading-relaxed text-ink-soft">
          The game itself is older than almost anything people still play: five in a row has been played
          on go boards in Japan since the Heian period, a thousand years ago, and the name of this site is
          just the Japanese for the number — <span className="font-mincho">五つ</span>, five stones.
        </p>
        <p className="text-sm">
          <Link href="/about" className="font-medium underline underline-offset-4" data-testid="read-story">
            Read the whole story →
          </Link>
        </p>
      </section>

      <footer className="border-t border-rule pt-5 text-xs text-muted">
        Itsutsu <span className="font-mincho">五つ</span> is by invitation. If you have a code,{" "}
        <Link href="/join" className="underline underline-offset-4">
          come in
        </Link>
        .
      </footer>
  </Page>
  );
}
