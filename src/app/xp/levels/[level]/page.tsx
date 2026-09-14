import Link from "next/link";
import { notFound } from "next/navigation";

import { Paired } from "@/components/i18n/Paired";
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
import { RECORD_SCOPES } from "@/lib/rating/recordScope";
import { importedFactsFor } from "@/lib/xp/importedRecipients";
import { importedNoteText } from "@/lib/xp/importedNote";
import { xpScopeHref } from "@/lib/xp/xpScope";
import { xpScopeFor } from "@/lib/xp/xpScopeServer";
import { CELL, HEAD, ROW_CLASS, TABLE_CLASS, TABLE_HEAD_CLASS } from "@/components/players/PlayerRecord";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { countText } from "@/lib/rating/figures";
import { ladderRung, levelXpRange } from "@/lib/xp/levelLadder";
import { LEVEL_ROLL, membersAtLevel, type LevelRoll } from "@/lib/xp/levelMembers";
import { levelPath, xpLevelName } from "@/lib/xp/levelNames";
import { XP_LEVELS } from "@/lib/xp/xpCurve";
import { viewerXp } from "@/lib/xp/xpViewer";

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
  const level = levelFrom((await params).level);
  if (level === null) return { title: "No such level" };
  const rung = ladderRung(level);
  return {
    title: `Level ${level} · ${xpLevelName(level)}`,
    description: rung?.note,
  };
}

export default async function LevelPage({ params, searchParams }: PageProps<"/xp/levels/[level]">) {
  const level = levelFrom((await params).level);
  if (level === null) notFound();

  const rung = ladderRung(level);
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
  const [who, scope, say] = await Promise.all([xpWhoFor(asked), xpScopeFor(asked), currentSpeaker()]);
  const [roll, viewer] = await Promise.all([membersAtLevel(level, who, scope), viewerXp()]);
  const query = new URLSearchParams({ who, scope }).toString();
  const notes = new Map(
    roll.members.flatMap((member) => {
      const facts = importedFactsFor(member.name, member.imported);
      return facts === null ? [] : [[member.id, <ImportedXpNote key={member.id} note={importedNoteText(say, facts)} />] as const];
    }),
  );

  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />

      <section className={`${PANEL_CLASS} flex flex-col gap-4`}>
        <nav className="flex items-center justify-between gap-3 text-sm" aria-label="The rungs either side">
          {level > 1 ? (
            <Link href={levelPath(level - 1)} className="underline underline-offset-4" data-testid="level-below">
              ← {level - 1}. {xpLevelName(level - 1)}
            </Link>
          ) : (
            <span className="text-muted">The bottom of the ladder</span>
          )}
          {level < XP_LEVELS ? (
            <Link href={levelPath(level + 1)} className="underline underline-offset-4" data-testid="level-above">
              {level + 1}. {xpLevelName(level + 1)} →
            </Link>
          ) : (
            <span className="text-muted">The top of the ladder</span>
          )}
        </nav>

        <div className="flex flex-col gap-1">
          <p className="font-mono text-xs tracking-[0.14em] text-muted uppercase">Level {level}</p>
          <h1 className="text-2xl font-semibold" data-testid="level-name-heading">
            {rung.kanji === "" ? (
              rung.name
            ) : (
              <Paired en={rung.name} kanji={rung.kanji} kanjiClassName="text-lg font-normal opacity-70" />
            )}
          </h1>
          <p className="max-w-3xl text-sm text-ink-soft">{rung.note}</p>
        </div>

        <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm" data-testid="level-costs">
          <div>
            <dt className="text-xs text-muted uppercase">To reach it</dt>
            <dd className="font-mono tabular-nums">{countText(rung.toReach)} XP</dd>
          </div>
          <div>
            <dt className="text-xs text-muted uppercase">Climbed from {level === 1 ? "—" : level - 1}</dt>
            {/* Nobody climbed to level 1, so there is no figure — an em dash, not
                a nought, which would read as a rung that was free. */}
            <dd className="font-mono tabular-nums">{rung.step === 0 ? "—" : `${countText(rung.step)} XP`}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted uppercase">
              {range.to === null ? "Above it" : `On to ${level + 1}`}
            </dt>
            <dd className="font-mono tabular-nums">
              {range.to === null ? (
                <span className="text-muted">Nothing — this is the top</span>
              ) : (
                `${countText(range.to - range.from)} XP`
              )}
            </dd>
          </div>
        </dl>

        <p className="text-sm text-muted">
          A member stands here on {countText(range.from)} XP
          {range.to === null ? " or more" : ` up to ${countText(range.to - 1)}`}. The whole ladder
          is on{" "}
          <Link href="/xp/levels" className="underline underline-offset-4" data-testid="to-ladder">
            the hundred levels
          </Link>
          , who is where is on{" "}
          <Link href="/xp" className="underline underline-offset-4" data-testid="to-leaderboard">
            the leaderboard
          </Link>
          , and who went up a level lately is on{" "}
          <Link href="/xp/promotions" className="underline underline-offset-4" data-testid="to-promotions">
            recent promotions
          </Link>
          .
        </p>
      </section>

      <section className={`${PANEL_CLASS} flex flex-col gap-3`}>
        <h2 className="flex items-baseline gap-2 text-base font-semibold">
          <Paired en="Standing here" kanji="居る" kanjiClassName="text-sm font-normal opacity-70" />
        </h2>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <WhoFilter who={who} hrefFor={(next) => xpWhoHref(levelPath(level), query, next)} label="Which players the rung lists" />
          <RecordScopeBar
            base={levelPath(level)}
            scope={scope}
            hrefFor={(next) => xpScopeHref(levelPath(level), query, next)}
            label="How much experience the rung counts"
          />
          {who !== DIRECTORY_WHO.everyone ? (
            <p className="text-xs text-muted" data-testid="level-narrowed">
              Narrowed to {XP_WHO_SAID[who]}.{" "}
              <Link href={xpWhoHref(levelPath(level), query, DIRECTORY_WHO.everyone)} className="underline underline-offset-4">
                Show everyone
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
        <WhoIsHere level={level} roll={roll} viewerId={viewer?.memberId ?? null} who={who} notes={notes} />
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
}: {
  level: number;
  roll: LevelRoll;
  viewerId: string | null;
  who: DirectoryWho;
  /** The justification under a total that includes another site's credit, by member id. */
  notes: ReadonlyMap<string, React.ReactNode>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <table className={TABLE_CLASS} data-testid="level-members">
          <thead className={TABLE_HEAD_CLASS}>
            <tr>
              <th className={HEAD} scope="col">
                Member
              </th>
              <th className={HEAD} scope="col">
                XP
              </th>
            </tr>
          </thead>
          <tbody>
            {roll.members.length === 0 ? (
              <tr className={ROW_CLASS}>
                <td className="py-3 pr-3 text-sm text-muted" colSpan={2} data-testid="level-empty">
                  {who === DIRECTORY_WHO.everyone
                    ? `Nobody is standing on level ${level} yet.`
                    : `None of ${XP_WHO_SAID[who]} is standing on level ${level} yet.`}
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
                      fallback="A member with no name yet"
                    />
                    {member.id === viewerId ? (
                      <span className="ml-2 text-[0.65rem] tracking-wide text-moss uppercase">You</span>
                    ) : null}
                    {notes.get(member.id) ?? null}
                  </td>
                  <td className={CELL}>{countText(member.xp)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {roll.more ? (
        <p className="text-xs text-muted" data-testid="level-more">
          The first {countText(LEVEL_ROLL)} of them, highest first. The{" "}
          <Link href="/xp" className="underline underline-offset-4">
            leaderboard
          </Link>{" "}
          ranks everybody.
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
          {viewerId === null ? (
            <>
              <Link href="/join" className="underline underline-offset-4" data-testid="level-join-link">
                Join Itsutsu
              </Link>{" "}
              and be the first to stand here.
            </>
          ) : (
            <>
              <Link href="/games/new" className="underline underline-offset-4" data-testid="level-play-link">
                Play a game
              </Link>{" "}
              and be the first to stand here.
            </>
          )}
        </p>
      ) : null}
    </div>
  );
}
