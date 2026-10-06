import { notFound } from "next/navigation";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { GameTrailNav } from "@/components/games/GameTrail";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { myGamesCopy } from "@/components/mine/mine.copy";
import { KeptOpen } from "@/components/party/KeptOpen";
import { keptWords } from "@/components/party/partyWords";
import { PlayerName } from "@/components/players/PlayerName";
import Link from "@/components/ui/Link";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { currentMemberId } from "@/lib/auth/currentSession";
import { gameNameFor, type GameKey } from "@/lib/catalogue/gameKeys";
import { titleWithKanji } from "@/components/games/pageTitles";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { gamePath, partyKindFor, variantFor } from "@/lib/gomoku/slugs";
import { tableState } from "@/lib/history/everyGame";
import { viewHref } from "@/lib/history/myGamesViews";
import { KEPT_SEAT_KINDS, KEPT_STATUS } from "@/lib/party/kept/kept.constants";
import { keptTablePath } from "@/lib/party/kept/keptPaths";
import { retiredSave } from "@/lib/party/retiredSaves";
import { keptGameOf, keptGameToRead } from "@/lib/party/kept/server/keptTables";
import { playerPath } from "@/lib/rating/playerKey";
import { nameTagsOf } from "@/lib/xp/nameTagsOf";
import { KEPT_GAME_KEYS } from "@/lib/party/kept/keptReport";

export async function generateMetadata() {
  return { title: titleWithKanji(await currentSpeaker(), "gamepages.titleFromHistory", "履歴") };
}
export const dynamic = "force-dynamic";

/**
 * A GAME PLAYED ON ONE DEVICE, OPENED FROM THE HISTORY, at
 * /games/<slug>/kept/<id>. John, 2026-09-30: "We should be allowed to view,
 * resume; etc. so not only it's a history but a way to look at and review."
 *
 * The site keeps the game written out whole (`keptTables.ts`), so this page
 * says how it stands and who sat where, and offers it back to the device it is
 * opened on (`KeptOpen`): a game still going is carried on with at its table,
 * and a finished one opens at its table as it ended. Only the member who
 * played it is offered it on a device.
 *
 * Any other member reads it from that player's history (`PlayerHistory`), as
 * a finished game between two seats is read by anybody signed in: how it
 * stands for them, who sat where and who won, with the way back to their
 * page. Not offered to the reader's device — it is not the reader's game.
 */
export default async function KeptGamePage({ params }: PageProps<"/games/[slug]/kept/[id]">) {
  const { slug, id } = await params;
  const MY_GAMES_COPY = myGamesCopy(await currentSpeaker());
  const key: GameKey | null = partyKindFor(slug) ?? variantFor(slug);
  const memberId = await currentMemberId();
  if (key === null || memberId === null || !KEPT_GAME_KEYS.includes(key)) notFound();
  const row = (await keptGameOf(id, memberId)) ?? (await keptGameToRead(id));
  if (row === null || row.game !== key) notFound();
  const own = row.hostMemberId === memberId;
  const owner = row.seats.find((seat) => seat.memberId === row.hostMemberId && seat.kind === KEPT_SEAT_KINDS.member);

  const say = await currentSpeaker();
  const KEPT_COPY = keptWords(say.locale);
  const tags = await nameTagsOf(row.seats.map((seat) => seat.memberId));
  // How it stands for whoever filed it: the reader when it is theirs, the player whose history it is from when not.
  const mine = owner?.seat ?? 0;
  const over = row.status === KEPT_STATUS.finished;
  // Kept by rules that have since changed (`retiredSave`): shown as it stood, and not offered back to a device.
  const retired = retiredSave(row.game, row.state);
  const state = retired && !over ? "left" : tableState(row.status, mine, null, row.winners);
  const lead = retired ? KEPT_COPY.retired : over ? KEPT_COPY.over : row.status === KEPT_STATUS.left ? KEPT_COPY.left : KEPT_COPY.going;

  return (
    <Page>
      <SiteHeader />
      <GameTrailNav game={{ label: gameNameFor(key, say), href: gamePath(key) }} steps={[{ label: KEPT_COPY.title }]} />
      <PageTitle title={own ? KEPT_COPY.title : KEPT_COPY.theirs.title} kanji={say.locale === "ja" ? "" : KEPT_COPY.kanji} lead={own ? lead : KEPT_COPY.theirs.lead} />
      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="kept-game" data-state={state} data-game={key}>
        <div className="flex items-center gap-3">
          <GameThumb variant={key} size="regular" />
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-lg font-semibold">
              <GameName variant={key} />
            </span>
            <span className="text-sm font-semibold" data-testid="kept-state">
              {own ? MY_GAMES_COPY.history.state[state] : { ...MY_GAMES_COPY.history.state, ...MY_GAMES_COPY.history.theirs.state }[state]}
            </span>
            <span className="text-xs text-muted">{row.updatedAt.toISOString().slice(0, 10)}</span>
          </div>
        </div>
        {!own && owner !== undefined ? (
          <p className="text-sm" data-testid="kept-whose">
            {KEPT_COPY.theirs.whose}{" "}
            <PlayerName name={owner.name} memberId={owner.memberId} fallback={MY_GAMES_COPY.history.guest(owner.seat)} tag={owner.memberId === null ? undefined : tags.get(owner.memberId)} />
          </p>
        ) : null}
        <ol className="flex flex-col gap-1 text-sm" data-testid="kept-seats">
          {row.seats.map((seat) => (
            <li key={seat.seat} className="flex items-center gap-2" data-winner={row.winners.includes(seat.seat) ? "true" : undefined}>
              <span className="w-6 text-muted tabular-nums">{seat.seat + 1}.</span>
              {seat.kind === KEPT_SEAT_KINDS.member ? (
                <PlayerName name={seat.name} memberId={seat.memberId} fallback={MY_GAMES_COPY.history.guest(seat.seat)} tag={seat.memberId === null ? undefined : tags.get(seat.memberId)} />
              ) : seat.kind === KEPT_SEAT_KINDS.computer ? (
                <span>{seat.name || MY_GAMES_COPY.history.computer}</span>
              ) : (
                // Somebody at the same screen, known only by the name typed for them.
                <span>{seat.name || MY_GAMES_COPY.history.guest(seat.seat)}</span>
              )}
              {row.winners.includes(seat.seat) ? <span className="text-xs font-semibold text-moss">{MY_GAMES_COPY.history.state.won}</span> : null}
            </li>
          ))}
        </ol>
        {own && !retired ? <KeptOpen game={key} id={row.id} state={row.state} over={over} table={keptTablePath(key)} /> : null}
        <Link
          href={own || row.hostMemberId === null ? viewHref("history") : `${playerPath(owner?.name ?? "", row.hostMemberId)}#history`}
          className="text-sm text-muted underline underline-offset-4"
          data-testid="kept-back"
        >
          ← {own ? KEPT_COPY.back : KEPT_COPY.theirs.back}
        </Link>
      </section>
    </Page>
  );
}
