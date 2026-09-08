import Link from "next/link";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS, PANEL_LINK_CLASS } from "@/components/ui/ui.constants";
import { gamePath } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

export const metadata = { title: "Games" };

/** The games grouped the way a newcomer should meet them: one first, then families. */
const FAMILIES: { title: string; kanji: string; blurb: string; games: RuleVariant[] }[] = [
  {
    title: "Five in a row",
    kanji: "五目",
    blurb: "The classic and its tournament forms. Start with Freestyle; the rest tighten the rules.",
    games: ["freestyle", "standard", "renju", "omok", "caro", "connect6", "misereFive"],
  },
  {
    title: "Captures",
    kanji: "取り",
    blurb: "Five in a row, or take enough of the other side's stones.",
    games: ["ninuki", "sannuki"],
  },
  {
    title: "Drops",
    kanji: "落とし",
    blurb: "Stones fall to the bottom of their column. Quick, and good on a phone.",
    games: ["dropFour", "ringDrop", "holeDrop", "hotDrop", "clearDrop", "giveawayDrop", "edgeDrop", "wormDrop"],
  },
  {
    title: "Pieces and twists",
    kanji: "駒と回し",
    blurb: "Our own games: lay dominoes or blocks from a shared queue, or turn the board after every stone.",
    games: ["dominoFive", "blockFive", "twistFive", "twistFour"],
  },
  {
    title: "Small boards",
    kanji: "小盤",
    blurb: "Games you can read to the end, and games where the trick is what you must not do.",
    games: ["tictactoe", "wildTicTacToe", "notakto", "trapThree", "squareFour", "makerBreaker"],
  },
];

/**
 * The games: where a person lands after joining. One plain choice first, so
 * nobody has to understand thirty games to start playing; the families sit
 * below for whoever wants to look around.
 */
export default function LobbyPage() {
  return (
    <div className="paper flex flex-1 flex-col items-center px-4 py-8 sm:px-8">
      <main className="flex w-full max-w-5xl flex-col gap-8">
        <SiteHeader />

        <section className="grid gap-4 md:grid-cols-3" data-testid="lobby-start">
          <Link
            href={gamePath("freestyle")}
            className={`${PANEL_LINK_CLASS} flex flex-col gap-2 md:col-span-2`}
          >
            <span className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
              Start here
            </span>
            <span className="text-2xl font-semibold">
              Play Gomoku <span className="font-mincho text-base font-normal opacity-70">五目並べ</span>
            </span>
            <span className="text-sm text-muted">
              Two players, one screen, five in a row. The board tells you when you are in
              trouble, and there is a hint if you want one. Everything else can wait.
            </span>
          </Link>
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className={`${PANEL_LINK_CLASS} flex flex-col gap-1`}
            >
              <span className="font-semibold">Play apart <span className="font-mincho text-xs font-normal opacity-70">通信対局</span></span>
              <span className="text-xs text-muted">
                Start a game with a link for each seat and take turns from two phones.
              </span>
            </Link>
            <Link
              href="/learn"
              className={`${PANEL_LINK_CLASS} flex flex-col gap-1`}
            >
              <span className="font-semibold">Learn first <span className="font-mincho text-xs font-normal opacity-70">学び</span></span>
              <span className="text-xs text-muted">
                Ten minutes on threats and shapes will make every game here better.
              </span>
            </Link>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="flex items-baseline gap-2 text-lg font-semibold">
            More games <span className="font-mincho text-sm font-normal opacity-70">遊び方</span>
          </h2>
          <p className="max-w-prose text-sm text-muted">
            Everything below is five in a row with one idea changed. Open a family to see
            its games; each one has a rules page and a place in the learning shelf.
          </p>
          {FAMILIES.map((family) => (
            <details key={family.title} className={`${PANEL_CLASS} group`} data-testid="lobby-family">
              <summary className="flex cursor-pointer list-none items-baseline justify-between gap-3">
                <span className="flex items-baseline gap-2 font-semibold">
                  {family.title}
                  <span className="font-mincho text-xs font-normal opacity-70">{family.kanji}</span>
                  <span className="text-xs font-normal text-muted">{family.games.length} games</span>
                </span>
                <span className="text-xs text-muted group-open:hidden">show</span>
                <span className="hidden text-xs text-muted group-open:inline">hide</span>
              </summary>
              <p className="mt-2 text-sm text-muted">{family.blurb}</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {family.games.map((variant) => {
                  const copy = RULE_VARIANT_DISPLAY[variant];
                  return (
                    <li key={variant} className="flex items-baseline justify-between gap-3 rounded-lg border border-rule px-3 py-2 text-sm">
                      <span className="flex flex-col">
                        <span className="font-medium">{copy.label}</span>
                        <span className="text-xs text-muted">{copy.tagline}</span>
                        {copy.inspiredBy !== undefined ? (
                          <span className="text-[0.7rem] text-muted italic">Inspired by {copy.inspiredBy}</span>
                        ) : null}
                      </span>
                      <span className="flex shrink-0 gap-2 text-xs">
                        <Link href={`/rules/${variant}`} className="underline-offset-2 hover:underline">rules</Link>
                        <Link href={gamePath(variant)} className="font-semibold underline-offset-2 hover:underline">play</Link>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </details>
          ))}
        </section>
      </main>
    </div>
  );
}
