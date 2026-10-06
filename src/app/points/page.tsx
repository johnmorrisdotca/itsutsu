import { SITE_NAME } from "@/lib/i18n/siteName";
import { Suspense } from "react";

import { GameName } from "@/components/games/GameName";
import { Paired } from "@/components/i18n/Paired";
import { GameThumb } from "@/components/games/GameThumb";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { IpBoard } from "@/components/points/IpBoard";
import { PANEL_CLASS, SECTION_TITLE, TABLE_SCROLL } from "@/components/ui/ui.constants";
import { GAME_FAMILIES, boardGamesOf } from "@/lib/gomoku/families";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { boardSizesFor } from "@/lib/gomoku/gomoku.constants";
import { isPuzzleKind } from "@/lib/catalogue/gameKeys";
import { GAME_MAX_BASE, gameMax, RESULT_MOST, RESULT_SHARES, RESULT_STEP } from "@/lib/points/gamePoints";
import { SITE_SCOPE } from "@/lib/points/ipBoards";
import { puzzlePriceRange } from "@/lib/points/ladderRange";
import { LEVEL_FAMILY_PRICE_MOST, PUZZLE_PRICE_LEAST, PUZZLE_PRICE_MOST } from "@/lib/points/ladder.constants";

export const metadata = { title: "IP 点数" };

// The board is read from the database on every request, never at build time.
export const dynamic = "force-dynamic";

const percent = (share: number) => `${Math.round(share * 100)}%`;

/**
 * IP, ITSUTSU POINTS, FOR THE WHOLE SITE: every game and every puzzle together,
 * all time, this month and this week, and how each is priced. John, 2026-09-25: "XP is
 * site wide experience and maturity, like in D&D etc... and IP aka Points is
 * only about games. Pure ability", and "EVERY game in every family is also going
 * to have a Leaderboard. So IP matters." Each game's and each family's board
 * leads here; this is where a reader learns what IP is.
 *
 * The prices are read from the one table that sets them (`gamePoints.ts`),
 * never typed into a sentence, so this page cannot drift from what is paid.
 */
export default async function PointsPage() {
  const say = await currentSpeaker();
  return (
    <Page>
      <SiteHeader />
      <PageTitle title={say.say("points.title", { site: SITE_NAME })} kanji="点数" lead={say.say("points.lead")} />

      <Suspense fallback={null}>
        <IpBoard scope={SITE_SCOPE} title={say.say("points.everyGame")} playHref="/games/new" whole testId="site-ip-board" />
      </Suspense>

      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="ip-explained">
        <h2 className={SECTION_TITLE}>
          <Paired en={say.say("points.vs.title")} kanji="経験と点数" kanjiClassName="normal-case tracking-normal" />
        </h2>
        <div className={TABLE_SCROLL}>
          <table className="w-full text-sm">
            <thead className="text-[0.62rem] font-semibold tracking-[0.12em] text-muted uppercase">
              <tr>
                <th className="py-1 pr-3 text-left" />
                <th className="py-1 pr-3 text-left">{say.say("points.vs.xpHead")}</th>
                <th className="py-1 text-left">{say.say("points.vs.ipHead", { site: SITE_NAME })}</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-t border-rule">
                <th className="py-1.5 pr-3 text-left font-semibold">{say.say("points.vs.means")}</th>
                <td className="py-1.5 pr-3">{say.say("points.vs.meansXp")}</td>
                <td className="py-1.5">{say.say("points.vs.meansIp")}</td>
              </tr>
              <tr className="border-t border-rule">
                <th className="py-1.5 pr-3 text-left font-semibold">{say.say("points.vs.earned")}</th>
                <td className="py-1.5 pr-3">{say.say("points.vs.earnedXp")}</td>
                <td className="py-1.5">{say.say("points.vs.earnedIp")}</td>
              </tr>
              <tr className="border-t border-rule">
                <th className="py-1.5 pr-3 text-left font-semibold">{say.say("points.vs.loss")}</th>
                <td className="py-1.5 pr-3">{say.say("points.vs.lossXp")}</td>
                <td className="py-1.5">{say.say("points.vs.lossIp")}</td>
              </tr>
              <tr className="border-t border-rule">
                <th className="py-1.5 pr-3 text-left font-semibold">{say.say("points.vs.shows")}</th>
                <td className="py-1.5 pr-3">{say.say("points.vs.showsXp")}</td>
                <td className="py-1.5">{say.say("points.vs.showsIp")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="ip-shares">
        <h2 className={SECTION_TITLE}>
          <Paired en={say.say("points.pays.title")} kanji="配点" kanjiClassName="normal-case tracking-normal" />
        </h2>
        <p className="text-sm text-muted">{say.say("points.pays.intro", { most: String(GAME_MAX_BASE) })}</p>
        <div className={TABLE_SCROLL}>
          <table className="w-full text-sm">
            <thead className="text-[0.62rem] font-semibold tracking-[0.12em] text-muted uppercase">
              <tr>
                <th className="py-1 pr-3 text-left">{say.say("points.pays.result")}</th>
                <th className="py-1 pr-3 text-right">{say.say("points.pays.winner")}</th>
                <th className="py-1 text-right">{say.say("points.pays.loser")}</th>
              </tr>
            </thead>
            <tbody>
              <ShareRow result={say.say("points.pays.won")} winner={percent(RESULT_SHARES.won.winner)} loser={say.say("points.pays.wonLoser", { share: percent(RESULT_SHARES.closeLoss) })} />
              <ShareRow result={say.say("points.pays.resignedFrom", { move: String(RESULT_SHARES.resignFromMove) })} winner={percent(RESULT_SHARES.resigned.winner)} loser={percent(RESULT_SHARES.resigned.loser)} />
              <ShareRow result={say.say("points.pays.resignedBefore", { move: String(RESULT_SHARES.resignFromMove) })} winner={percent(RESULT_SHARES.resignedEarly.winner)} loser={percent(RESULT_SHARES.resignedEarly.loser)} />
              <ShareRow result={say.say("points.pays.time")} winner={percent(RESULT_SHARES.time.winner)} loser={percent(RESULT_SHARES.time.loser)} />
              <ShareRow result={say.say("points.pays.drawn")} winner={percent(RESULT_SHARES.drawn)} loser={percent(RESULT_SHARES.drawn)} />
            </tbody>
          </table>
        </div>
        <ul className="list-disc pl-5 text-sm text-muted">
          <li>
            {say.say("points.pays.upset", { most: percent(1 + RESULT_SHARES.upset), least: percent(1 - RESULT_SHARES.upset) })}
          </li>
          <li>{say.say("points.pays.favoured", { share: percent(RESULT_SHARES.favoured) })}</li>
          <li>
            {say.say("points.pays.again", { second: percent(RESULT_SHARES.again[1]), later: percent(RESULT_SHARES.again[2]) })}
          </li>
          <li>{say.say("points.pays.rounded", { step: String(RESULT_STEP), most: String(RESULT_MOST) })}</li>
          <li>{say.say("points.pays.oneScreen")}</li>
        </ul>
      </section>

      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="ip-maximums">
        <h2 className={SECTION_TITLE}>
          <Paired en={say.say("points.max.title")} kanji="上限" kanjiClassName="normal-case tracking-normal" />
        </h2>
        <div className={TABLE_SCROLL}>
          <table className="w-full text-sm">
            <thead className="text-[0.62rem] font-semibold tracking-[0.12em] text-muted uppercase">
              <tr>
                <th className="py-1 pr-3 text-left">{say.say("points.max.game")}</th>
                <th className="py-1 text-right">{say.say("points.max.most")}</th>
              </tr>
            </thead>
            {GAME_FAMILIES.filter((family) => boardGamesOf(family).length > 0).map((family) => (
              <tbody key={family.key}>
                <tr>
                  <th colSpan={2} className="pt-3 pb-1 text-left text-xs font-semibold text-muted">
                    <Paired en={family.title} kanji={family.kanji} kanjiClassName="font-normal" />
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
      </section>

      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="ip-puzzles">
        <h2 className={SECTION_TITLE}>
          <Paired en={say.say("points.puzzle.title")} kanji="配点" kanjiClassName="normal-case tracking-normal" />
        </h2>
        <p className="text-sm text-muted">
          {say.say("points.puzzle.intro", { least: String(PUZZLE_PRICE_LEAST), most: String(PUZZLE_PRICE_MOST), top: String(LEVEL_FAMILY_PRICE_MOST) })}
        </p>
        <ul className="list-disc pl-5 text-sm text-muted">
          <li>{say.say("points.puzzle.hints")}</li>
          <li>{say.say("points.puzzle.words")}</li>
          <li>{say.say("points.puzzle.best")}</li>
        </ul>
        <div className={TABLE_SCROLL}>
          <table className="w-full text-sm">
            <thead className="text-[0.62rem] font-semibold tracking-[0.12em] text-muted uppercase">
              <tr>
                <th className="py-1 pr-3 text-left">{say.say("points.puzzle.puzzle")}</th>
                <th className="py-1 text-right">{say.say("points.puzzle.pays")}</th>
              </tr>
            </thead>
            {GAME_FAMILIES.filter((family) => family.games.some(isPuzzleKind)).map((family) => (
              <tbody key={family.key}>
                <tr>
                  <th colSpan={2} className="pt-3 pb-1 text-left text-xs font-semibold text-muted">
                    <Paired en={family.title} kanji={family.kanji} kanjiClassName="font-normal" />
                  </th>
                </tr>
                {family.games.filter(isPuzzleKind).map((kind) => {
                  const { least, most } = puzzlePriceRange(kind);
                  return (
                    <tr key={kind} className="border-t border-rule" data-testid="ip-puzzle-price" data-variant={kind}>
                      <td className="py-1 pr-3">
                        <span className="flex items-center gap-2">
                          <GameThumb variant={kind} size="small" />
                          <GameName variant={kind} />
                        </span>
                      </td>
                      <td className="py-1 text-right font-mono tabular-nums">
                        {say.say("points.puzzle.range", { least: String(least), most: String(most) })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
        </div>
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
