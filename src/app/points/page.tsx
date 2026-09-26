import { Suspense } from "react";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { IpBoard } from "@/components/points/IpBoard";
import { PANEL_CLASS, SECTION_TITLE, TABLE_SCROLL } from "@/components/ui/ui.constants";
import { GAME_FAMILIES, boardGamesOf } from "@/lib/gomoku/families";
import { boardSizesFor } from "@/lib/gomoku/gomoku.constants";
import { gameMax, RESULT_SHARES } from "@/lib/points/gamePoints";
import { SITE_SCOPE } from "@/lib/points/ipBoards";

export const metadata = { title: "IP 点数" };

// The board is read from the database on every request, never at build time.
export const dynamic = "force-dynamic";

const percent = (share: number) => `${Math.round(share * 100)}%`;

/**
 * IP, ITSUTSU POINTS, FOR THE WHOLE SITE: every game and every puzzle together,
 * this month and all time, and how each is priced. John, 2026-09-25: "XP is
 * site wide experience and maturity, like in D&D etc... and IP aka Points is
 * only about games. Pure ability", and "EVERY game in every family is also going
 * to have a Leaderboard. So IP matters." Each game's and each family's board
 * leads here; this is where a reader learns what IP is.
 *
 * The prices are read from the one table that sets them (`gamePoints.ts`),
 * never typed into a sentence, so this page cannot drift from what is paid.
 */
export default function PointsPage() {
  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title="IP, Itsutsu Points"
        kanji="点数"
        lead="Won by results alone, in every game and every puzzle. XP is for taking part; IP is for winning."
      />

      <Suspense fallback={null}>
        <IpBoard scope={SITE_SCOPE} title="every game" playHref="/games/new" whole testId="site-ip-board" />
      </Suspense>

      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="ip-explained">
        <h2 className={SECTION_TITLE}>
          XP and IP <span className="font-mincho normal-case tracking-normal">経験と点数</span>
        </h2>
        <div className={TABLE_SCROLL}>
          <table className="w-full text-sm">
            <thead className="text-[0.62rem] font-semibold tracking-[0.12em] text-muted uppercase">
              <tr>
                <th className="py-1 pr-3 text-left" />
                <th className="py-1 pr-3 text-left">XP, experience</th>
                <th className="py-1 text-left">IP, Itsutsu Points</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-t border-rule">
                <th className="py-1.5 pr-3 text-left font-semibold">What it means</th>
                <td className="py-1.5 pr-3">How long and how widely you have been part of the site</td>
                <td className="py-1.5">How well you play</td>
              </tr>
              <tr className="border-t border-rule">
                <th className="py-1.5 pr-3 text-left font-semibold">Earned by</th>
                <td className="py-1.5 pr-3">Everything: games finished, new games tried, streaks, buddies, applause</td>
                <td className="py-1.5">Results: wins, draws, close losses and every puzzle solved</td>
              </tr>
              <tr className="border-t border-rule">
                <th className="py-1.5 pr-3 text-left font-semibold">A loss</th>
                <td className="py-1.5 pr-3">Still earns: you took part</td>
                <td className="py-1.5">Earns nothing, unless the score was close</td>
              </tr>
              <tr className="border-t border-rule">
                <th className="py-1.5 pr-3 text-left font-semibold">Shows</th>
                <td className="py-1.5 pr-3">Your level and title, beside your name</td>
                <td className="py-1.5">Where you stand on every game&apos;s board, every family&apos;s, and this one</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="ip-shares">
        <h2 className={SECTION_TITLE}>
          What a game pays <span className="font-mincho normal-case tracking-normal">配点</span>
        </h2>
        <p className="text-sm text-muted">
          Every game has a most it can pay, below. A result earns a share of it.
        </p>
        <div className={TABLE_SCROLL}>
          <table className="w-full text-sm">
            <thead className="text-[0.62rem] font-semibold tracking-[0.12em] text-muted uppercase">
              <tr>
                <th className="py-1 pr-3 text-left">Result</th>
                <th className="py-1 pr-3 text-right">Winner</th>
                <th className="py-1 text-right">Loser</th>
              </tr>
            </thead>
            <tbody>
              <ShareRow result="Won on the board" winner={percent(RESULT_SHARES.won.winner)} loser={`up to ${percent(RESULT_SHARES.closeLoss)}, the closer the score the more`} />
              <ShareRow result={`The other side resigned, from move ${RESULT_SHARES.resignFromMove}`} winner={percent(RESULT_SHARES.resigned.winner)} loser={percent(RESULT_SHARES.resigned.loser)} />
              <ShareRow result={`The other side resigned before move ${RESULT_SHARES.resignFromMove}`} winner={percent(RESULT_SHARES.resignedEarly.winner)} loser={percent(RESULT_SHARES.resignedEarly.loser)} />
              <ShareRow result="Won on time" winner={percent(RESULT_SHARES.time.winner)} loser={percent(RESULT_SHARES.time.loser)} />
              <ShareRow result="Drawn" winner={percent(RESULT_SHARES.drawn)} loser={percent(RESULT_SHARES.drawn)} />
            </tbody>
          </table>
        </div>
        <ul className="list-disc pl-5 text-sm text-muted">
          <li>
            Beating a stronger player pays up to {percent(1 + RESULT_SHARES.upset)} of the win, and beating a much weaker
            one as little as {percent(1 - RESULT_SHARES.upset)}, by the two ratings before the game.
          </li>
          <li>A head start or a handicap in the winner&apos;s favour pays {percent(RESULT_SHARES.favoured)} of the win.</li>
          <li>
            The same two players again the same day: the second game pays {percent(RESULT_SHARES.again[1])}, and every one
            after that {percent(RESULT_SHARES.again[2])}.
          </li>
          <li>A game on one screen, or on the practice board, pays nothing: nobody can say who played it.</li>
        </ul>
      </section>

      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="ip-maximums">
        <h2 className={SECTION_TITLE}>
          The most each game pays <span className="font-mincho normal-case tracking-normal">上限</span>
        </h2>
        <div className={TABLE_SCROLL}>
          <table className="w-full text-sm">
            <thead className="text-[0.62rem] font-semibold tracking-[0.12em] text-muted uppercase">
              <tr>
                <th className="py-1 pr-3 text-left">Game</th>
                <th className="py-1 text-right">Most, by board</th>
              </tr>
            </thead>
            {GAME_FAMILIES.filter((family) => boardGamesOf(family).length > 0).map((family) => (
              <tbody key={family.key}>
                <tr>
                  <th colSpan={2} className="pt-3 pb-1 text-left text-xs font-semibold text-muted">
                    {family.title} <span className="font-mincho font-normal">{family.kanji}</span>
                  </th>
                </tr>
                {boardGamesOf(family).map((variant) => (
                  <tr key={variant} className="border-t border-rule" data-testid="ip-maximum" data-variant={variant}>
                    <td className="py-1 pr-3">
                      <span className="flex items-center gap-2">
                        <GameThumb variant={variant} size="small" />
                        <GameName variant={variant} />
                      </span>
                    </td>
                    <td className="py-1 text-right font-mono tabular-nums">
                      {boardSizesFor(variant).length === 1
                        ? gameMax(variant, boardSizesFor(variant)[0]!)
                        : boardSizesFor(variant)
                            .map((size) => `${size}: ${gameMax(variant, size)}`)
                            .join(" · ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
        <p className="text-xs text-muted">
          Puzzles pay their own points, weighted so a medium solve at a puzzle&apos;s usual size is worth about as much as a
          Gomoku win.
        </p>
      </section>
    </Page>
  );
}

function ShareRow({ result, winner, loser }: { result: string; winner: string; loser: string }) {
  return (
    <tr className="border-t border-rule">
      <td className="py-1.5 pr-3">{result}</td>
      <td className="py-1.5 pr-3 text-right font-mono tabular-nums">{winner}</td>
      <td className="py-1.5 text-right font-mono tabular-nums">{loser}</td>
    </tr>
  );
}
