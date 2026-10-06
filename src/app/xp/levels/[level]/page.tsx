import { SITE_NAME } from "@/lib/i18n/siteName";
import Link from "@/components/ui/Link";
import { notFound } from "next/navigation";

import { PageTitle, SectionHeading } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PlayerName } from "@/components/players/PlayerName";
import { WhoFilter } from "@/components/players/WhoFilter";
import { DIRECTORY_WHO, type DirectoryWho } from "@/lib/rating/directoryFilter";
import { XP_WHO_SAID, xpWhoHref } from "@/lib/xp/xpWho";
import { xpWhoFor } from "@/lib/xp/xpWhoServer";
import { RecordScopeBar } from "@/components/players/RecordScopeBar";
import { ImportedXpNote } from "@/components/xp/ImportedXpNote";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import type { Speaker } from "@/lib/i18n/i18n";
import { weave } from "@/lib/i18n/weave";
import { RECORD_SCOPES } from "@/lib/rating/recordScope";
import { importedFactsFor } from "@/lib/xp/importedRecipients";
import { importedNoteText } from "@/lib/xp/importedNote";
import { xpScopeHref, xpTotalIn } from "@/lib/xp/xpScope";
import { xpScopeFor } from "@/lib/xp/xpScopeServer";
import { CELL, HEAD, ROW_CLASS, TABLE_CLASS, TABLE_HEAD_CLASS } from "@/components/players/PlayerRecord";
import { PANEL_CLASS, TABLE_SCROLL } from "@/components/ui/ui.constants";
import { countText } from "@/lib/rating/figures";
import { ladderRung, levelXpRange } from "@/lib/xp/levelLadder";
import { LEVEL_ROLL, membersAtLevel, type LevelRoll } from "@/lib/xp/levelMembers";
import { LISTED_ALREADY, ipTotalsOf } from "@/lib/points/ipBoards";
import { ipHeadTitle, IpCell } from "@/components/players/recordTrailing";
import { currentTestModeReader } from "@/lib/testMode/testMode";
import { nameTagsOf, type NameTag } from "@/lib/xp/nameTagsOf";
import { levelPath, xpLevelName } from "@/lib/xp/levelNames";
import { XP_LEVELS } from "@/lib/xp/xpCurve";
import { viewerXp } from "@/lib/xp/xpViewer";
import { xpLevelFor } from "@/lib/xp/xpCurve";
import { withoutLevel } from "@/lib/xp/nameTag.types";

/*
 * One member's standing decides whether their own row is marked, so this is
 * rendered per request rather than built once.
 */
export const dynamic = "force-dynamic";

/**
 * THE LEVEL THE ADDRESS NAMES, OR NOTHING.
 *
 * `/xp/levels/07` and `/xp/levels/7.0` both parse to seven, and both would be a
 * second address for one page — so only the canonical spelling is a level here
 * and everything else is a 404. That is the address rule this repository keeps:
 * identity in the path, one path per thing.
 *
 * A LEVEL PAST THE TOP IS A 404 AND A LEVEL WITH NOBODY ON IT IS NOT. The two
 * are different questions and the page answers them differently: level 101 does
 * not exist, so there is nothing to draw; level 63 exists and is empty, which is
 * a fact about the site and gets the headings, the shape and an invitation. See
 * "Show The Data, Not The Way To It" — an empty table is data.
 */
function levelFrom(raw: string): number | null {
  const level = Number(raw);
  if (!Number.isInteger(level)) return null;
  if (String(level) !== raw) return null;
  if (level < 1 || level > XP_LEVELS) return null;
  return level;
}

export async function generateMetadata({ params }: PageProps<"/xp/levels/[level]">) {
  const say = await currentSpeaker();
  const level = levelFrom((await params).level);
  if (level === null) return { title: say.say("xp.level.none") };
  const rung = ladderRung(level, say.locale);
  return {
    title: say.say("xp.level.pageTitle", { level: String(level), name: xpLevelName(level, say.locale) }),
    description: rung?.note,
  };
}

export default async function LevelPage({ params, searchParams }: PageProps<"/xp/levels/[level]">) {
  const level = levelFrom((await params).level);
  if (level === null) notFound();

  const say = await currentSpeaker();
  const rung = ladderRung(level, say.locale);
  /*
   * Belt and braces, and not dead code: `levelFrom` bounds the number against
   * the CURVE's hundred and this reads the NAMES' hundred. They are two files
   * that are meant to stay the same length and are deliberately independent, so
   * a page that assumed it never has to answer "no name for this one" would be
   * the one thing that broke if they ever parted.
   */
  if (rung === null) notFound();

  const range = levelXpRange(level)!;
  /* The same two choices as the board — who, and how much is counted — on the
     same memory: one board, one answer. */
  const asked = await searchParams;
  const [who, scope] = await Promise.all([xpWhoFor(asked), xpScopeFor(asked)]);
  const reader = await currentTestModeReader();
  const [roll, viewer] = await Promise.all([membersAtLevel(level, who, scope, reader), viewerXp()]);
  // The flag and badge beside each name, one read for the rung (`nameTagsOf`).
  // And what each has won, for the IP column after XP: one more read for the rung, never one per row.
  const [tags, ip] = await Promise.all([
    nameTagsOf(roll.members.map((member) => member.id)),
    ipTotalsOf(roll.members.map((member) => member.id), LISTED_ALREADY),
  ]);
  const query = new URLSearchParams({ who, scope }).toString();
  // The reader's own rung, by the total this page is counting.
  const mine = viewer === null ? null : xpLevelFor(xpTotalIn(viewer, scope));
  const notes = new Map(
    roll.members.flatMap((member) => {
      const facts = importedFactsFor(member.name, member.imported);
      return facts === null ? [] : [[member.id, <ImportedXpNote key={member.id} note={importedNoteText(say, facts)} />] as const];
    }),
  );

  return (
    <Page>
      <SiteHeader />

      <nav className="flex items-center justify-between gap-3 text-sm" aria-label={say.say("xp.level.either")}>
        {level > 1 ? (
          <Link href={levelPath(level - 1)} className="underline underline-offset-4" data-testid="level-below">
            ← {level - 1}. {xpLevelName(level - 1, say.locale)}
          </Link>
        ) : (
          <span className="text-muted">{say.say("xp.level.bottom")}</span>
        )}
        {level < XP_LEVELS ? (
          <Link href={levelPath(level + 1)} className="underline underline-offset-4" data-testid="level-above">
            {level + 1}. {xpLevelName(level + 1, say.locale)} →
          </Link>
        ) : (
          <span className="text-muted">{say.say("xp.level.top")}</span>
        )}
      </nav>

      <PageTitle
        title={rung.name}
        kanji={rung.kanji}
        lead={rung.note}
        crumb={<span className="font-mono tracking-[0.14em] uppercase">{say.say("xp.level.crumb", { level: String(level) })}</span>}
        testId="level-name-heading"
      />
      <section className={`${PANEL_CLASS} flex flex-col gap-4`}>
        <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm" data-testid="level-costs">
          <div>
            <dt className="text-xs text-muted uppercase">{say.say("xp.level.toReachIt")}</dt>
            <dd className="font-mono tabular-nums">{say.say("xp.amount", { count: countText(rung.toReach, say.locale) })}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted uppercase">
              {say.say("xp.level.climbedFrom", { from: level === 1 ? "—" : String(level - 1) })}
            </dt>
            {/* Nobody climbed to level 1, so there is no figure — an em dash, not
                a nought, which would read as a rung that was free. */}
            <dd className="font-mono tabular-nums">
              {rung.step === 0 ? "—" : say.say("xp.amount", { count: countText(rung.step, say.locale) })}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted uppercase">
              {range.to === null ? say.say("xp.level.aboveIt") : say.say("xp.level.nextRung", { next: String(level + 1) })}
            </dt>
            <dd className="font-mono tabular-nums">
              {range.to === null ? (
                <span className="text-muted">{say.say("xp.level.nothingAbove")}</span>
              ) : (
                say.say("xp.amount", { count: countText(range.to - range.from, say.locale) })
              )}
            </dd>
          </div>
        </dl>

        <p className="text-sm text-muted">
          {range.to === null
            ? say.say("xp.level.rangeOpen", { from: countText(range.from, say.locale) })
            : say.say("xp.level.rangeClosed", { from: countText(range.from, say.locale), to: countText(range.to - 1, say.locale) })}{" "}
          {weave(say.say("xp.level.where"), {
            ladder: (
              <Link href="/xp/levels" className="underline underline-offset-4" data-testid="to-ladder">
                {say.say("xp.level.whereLadder")}
              </Link>
            ),
            leaderboard: (
              <Link href="/xp" className="underline underline-offset-4" data-testid="to-leaderboard">
                {say.say("xp.level.whereBoard")}
              </Link>
            ),
            promotions: (
              <Link href="/xp/promotions" className="underline underline-offset-4" data-testid="to-promotions">
                {say.say("xp.level.wherePromotions")}
              </Link>
            ),
          })}
        </p>
      </section>

      <section className={`${PANEL_CLASS} flex flex-col gap-3`}>
        <SectionHeading title={say.say("xp.level.players")} kanji="在籍" />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <WhoFilter say={say} who={who} hrefFor={(next) => xpWhoHref(levelPath(level), query, next)} label={say.say("xp.level.whoLabel")} />
          <RecordScopeBar
            say={say}
            base={levelPath(level)}
            scope={scope}
            hrefFor={(next) => xpScopeHref(levelPath(level), query, next)}
            label={say.say("xp.level.scopeLabel")}
          />
          {who !== DIRECTORY_WHO.everyone ? (
            <p className="text-xs text-muted" data-testid="level-narrowed">
              {say.say("xp.narrowed", { who: say.say(XP_WHO_SAID[who]) })}{" "}
              <Link href={xpWhoHref(levelPath(level), query, DIRECTORY_WHO.everyone)} className="underline underline-offset-4">
                {say.say("xp.showEveryone")}
              </Link>
            </p>
          ) : null}
        </div>
        <p className="text-xs text-muted" data-testid="level-scope-said" data-scope={scope}>
          {say.say(scope === RECORD_SCOPES.here ? "xp.scope.here" : "xp.scope.everywhere")}
          {scope === RECORD_SCOPES.here ? (
            <>
              {" "}
              <Link href={xpScopeHref(levelPath(level), query, RECORD_SCOPES.everywhere)} className="underline underline-offset-4">
                {say.say("xp.scope.countEverywhere")}
              </Link>
            </>
          ) : null}
        </p>
        {/*
          WHERE THE READER STANDS, when it is not here. John, 2026-09-25, on the
          page for 73 while standing on 74: "If I'm level 74, why do I not show
          up in the list???" The list was right and said nothing about why. On
          their own rung their row is marked instead, so this line is not drawn.
        */}
        {mine !== null && mine !== level ? (
          <p className="text-sm" data-testid="level-you-are">
            {weave(say.say("xp.level.youAreOn"), {
              link: (
                <Link href={`${levelPath(mine)}?${query}`} className="font-medium underline underline-offset-4" data-testid="level-you-are-link">
                  {say.say("xp.level.youLink", { level: String(mine), name: xpLevelName(mine, say.locale) })}
                </Link>
              ),
            })}
          </p>
        ) : null}
        <WhoIsHere level={level} roll={roll} viewerId={viewer?.memberId ?? null} who={who} notes={notes} tags={tags} ip={ip} say={say} />
      </section>
    </Page>
  );
}

/**
 * Who is on this rung.
 *
 * **The empty table shows itself.** An empty rung is a true fact about the site
 * — most of the hundred hold nobody today — so it keeps its headings and its
 * shape and offers the way in.
 * Hiding it would turn a hundred pages into a hundred apologies; showing it
 * turns them into a hundred invitations.
 */
function WhoIsHere({
  level,
  roll,
  viewerId,
  who,
  notes,
  tags,
  ip,
  say,
}: {
  /** The reader's language. */
  say: Speaker;
  level: number;
  roll: LevelRoll;
  /** What each member on the rung has won across the site, by member id (`ipTotalsOf`). */
  ip: ReadonlyMap<string, number>;
  /** The flag and badge beside each name (`nameTagsOf`). */
  tags: ReadonlyMap<string, NameTag>;
  viewerId: string | null;
  who: DirectoryWho;
  /** The justification under a total that includes another site's credit, by member id. */
  notes: ReadonlyMap<string, React.ReactNode>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className={TABLE_SCROLL}>
        <table className={TABLE_CLASS} data-testid="level-members">
          <thead className={TABLE_HEAD_CLASS}>
            <tr>
              <th className={HEAD} scope="col">
                {say.say("xp.col.member")}
              </th>
              <th className={HEAD} scope="col">
                {say.say("xp.unit")}
              </th>
              <th className={HEAD} scope="col" title={ipHeadTitle(say)}>
                IP
              </th>
            </tr>
          </thead>
          <tbody>
            {roll.members.length === 0 ? (
              <tr className={ROW_CLASS}>
                <td className="py-3 pr-3 text-sm text-muted" colSpan={3} data-testid="level-empty">
                  {who === DIRECTORY_WHO.everyone
                    ? say.say("xp.level.nobody", { level: String(level) })
                    : say.say("xp.level.nobodyNarrowed", { who: say.say(XP_WHO_SAID[who]), level: String(level) })}
                </td>
              </tr>
            ) : (
              roll.members.map((member) => (
                <tr
                  key={member.id}
                  className={`${ROW_CLASS} ${member.id === viewerId ? "bg-moss-soft" : ""}`.trim()}
                  aria-current={member.id === viewerId ? "true" : undefined}
                  data-testid="level-member"
                >
                  <td className="py-1.5 pr-3">
                    <PlayerName
                      name={member.name}
                      memberId={member.id}
                      fallback={say.say("xp.unnamed")}
                      // Everybody here stands on this rung, which the page is named for.
                      tag={withoutLevel(tags.get(member.id))}
                    />
                    {member.id === viewerId ? (
                      <span className="ml-2 text-[0.65rem] tracking-wide text-moss uppercase">{say.say("xp.you")}</span>
                    ) : null}
                    {notes.get(member.id) ?? null}
                  </td>
                  <td className={CELL}>{countText(member.xp, say.locale)}</td>
                  <IpCell say={say} ip={{ ip: ip.get(member.id) ?? 0, memberId: member.id, game: null }} />
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {roll.more ? (
        <p className="text-xs text-muted" data-testid="level-more">
          {weave(say.say("xp.level.more"), {
            count: countText(LEVEL_ROLL, say.locale),
            leaderboard: (
              <Link href="/xp" className="underline underline-offset-4">
                {say.say("xp.level.whereBoard")}
              </Link>
            ),
          })}
        </p>
      ) : null}

      {roll.members.length === 0 ? (
        /*
         * The invitation, and it is worded for whoever is reading. A member is
         * told how to get here; a reader with no account is told what the site
         * wants from them first. Reusing the signed-in label on a stranger is
         * the bait-and-switch AGENTS.md warns about.
         */
        <p className="text-sm" data-testid="level-invite">
          {viewerId === null
            ? weave(say.say("xp.level.inviteGuest"), {
                join: (
                  <Link href="/join" className="underline underline-offset-4" data-testid="level-join-link">
                    {say.say("xp.joinSite", { site: SITE_NAME })}
                  </Link>
                ),
              })
            : weave(say.say("xp.level.inviteMember"), {
                play: (
                  <Link href="/games/new" className="underline underline-offset-4" data-testid="level-play-link">
                    {say.say("xp.playAGame")}
                  </Link>
                ),
              })}
        </p>
      ) : null}
    </div>
  );
}
