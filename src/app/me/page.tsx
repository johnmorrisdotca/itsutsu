import { playerPath } from "@/lib/rating/playerKey";
import { KEEP_FINISHED_DEFAULT } from "@/lib/history/retention";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ChallengeButton } from "@/components/mine/ChallengeButton";
import { InviteFriends } from "@/components/mine/InviteFriends";
import { NameForm } from "@/components/mine/NameForm";
import { ProfileForm } from "@/components/mine/ProfileForm";
import { GameDefaultsForm } from "@/components/mine/GameDefaultsForm";
import { gameDefaultsFrom } from "@/components/game/gameDefaults";
import { BuddyButton } from "@/components/mine/BuddyButton";
import { RecencyLegend, RecencyMark } from "@/components/mine/Recency";
import { fetchBuddies } from "@/lib/social/buddies";
import { fetchIgnored } from "@/lib/social/ignores";
import { EMPTY_VERDICTS, fetchVerdictTally } from "@/lib/history/verdicts";
import { IgnoreButton } from "@/components/mine/IgnoreButton";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { currentMemberId, currentSession } from "@/lib/auth/currentSession";
import { fetchProfile } from "@/lib/auth/members";
import { safeDestination } from "@/lib/auth/redirect";
import { variantLabel } from "@/lib/gomoku/variants.constants";
import { TIER_DISPLAY } from "@/lib/rating/elo";
import { fetchPlayer } from "@/lib/rating/players";
import { fetchVariantStandings } from "@/lib/rating/variantRatings";

export const metadata = { title: "You" };
export const dynamic = "force-dynamic";

/**
 * The member's own page: the name others see, the record it has earned, game
 * by game, and the way to bring a friend in. A new member lands here first,
 * with a welcome, because the name is the one thing the site needs to ask.
 */
export default async function MePage({ searchParams }: PageProps<"/me">) {
  const params = await searchParams;
  const me = await currentSession();
  if (!me?.email) redirect("/join?next=%2Fme");

  const mineId = await currentMemberId();
  const [member, buddies, ignored, tally] = await Promise.all([
    fetchProfile(me.email),
    fetchBuddies(me.email),
    fetchIgnored(me.email),
    // Their own reads on their own games, found by the id a seat now holds.
    mineId === null ? Promise.resolve(EMPTY_VERDICTS) : fetchVerdictTally(mineId),
  ]);
  const name = member?.name ?? me.name ?? "";
  const welcome = params.welcome === "1";
  const next = welcome ? safeDestination(typeof params.next === "string" ? params.next : null) : null;
  const [profile, standings] = name === "" ? [null, []] : await Promise.all([fetchPlayer(name), fetchVariantStandings(name)]);

  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />

      {welcome ? (
        <section className={`${PANEL_CLASS} flex flex-col gap-2 border-moss/50 bg-moss-soft`} data-testid="welcome">
          <h1 className="flex items-baseline gap-2 text-lg font-semibold">
            Welcome <span className="font-mincho text-sm font-normal opacity-70">ようこそ</span>
          </h1>
          <p className="text-sm text-ink-soft">
            You are in. One question before the board: what should the other players call you? Google&apos;s name is
            filled in; change it if you like.
          </p>
        </section>
      ) : null}

      <section className={`${PANEL_CLASS} flex flex-col gap-4`}>
        <div className="flex items-center gap-3">
          {member?.picture ? (
            // eslint-disable-next-line @next/next/no-img-element -- a Google avatar
            <img src={member.picture} alt="" className="size-12 rounded-full" referrerPolicy="no-referrer" />
          ) : null}
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold" data-testid="me-name">{name || "Unnamed"}</h1>
            <span className="text-xs text-muted">{me.email}</span>
          </div>
        </div>
        <NameForm initial={name} next={next} />
      </section>

      {!welcome ? (
        <section className={`${PANEL_CLASS} flex flex-col gap-3`}>
          <h2 className="flex items-baseline gap-2 font-semibold">
            Profile <span className="font-mincho text-xs font-normal opacity-70">自己紹介</span>
          </h2>
          <ProfileForm
            initial={{
              awayFrom: member?.awayFrom ? member.awayFrom.toISOString().slice(0, 10) : "",
              awayUntil: member?.awayUntil ? member.awayUntil.toISOString().slice(0, 10) : "",
              city: member?.city ?? "",
              country: member?.country ?? "",
              timeZone: member?.timeZone ?? "",
              bio: member?.bio ?? "",
              showOnline: member?.showOnline ?? true,
              emailNotify: member?.emailNotify ?? true,
              keepFinishedDays: member?.keepFinishedDays ?? KEEP_FINISHED_DEFAULT,
              daysOff: member?.daysOff ?? [],
            }}
          />
        </section>
      ) : null}

      {!welcome ? (
        <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="game-defaults-panel">
          <h2 className="flex items-baseline gap-2 font-semibold">
            New games start here{" "}
            <span className="font-mincho text-xs font-normal opacity-70">既定</span>
          </h2>
          <GameDefaultsForm initial={gameDefaultsFrom(member?.gameDefaults)} />
        </section>
      ) : null}

      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="buddies">
        <h2 className="flex items-baseline gap-2 font-semibold">
          Buddies <span className="font-mincho text-xs font-normal opacity-70">仲間</span>
          <span className="text-xs font-normal text-muted">{buddies.length}</span>
        </h2>
        {buddies.length === 0 ? (
          <p className="text-sm text-muted">
            Nobody yet. Star people on the{" "}
            <Link href="/players" className="underline underline-offset-4">players</Link> page and they are listed
            here, most recently seen first.
          </p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {buddies.map((buddy) => (
              <li key={buddy.email} className="flex flex-wrap items-center gap-3 border-t border-rule py-1.5 first:border-t-0">
                <RecencyMark recency={buddy.recency} />
                <span className="font-medium">{buddy.name || buddy.email}</span>
                <span className="text-xs text-muted">
                  {[buddy.city, buddy.country].filter(Boolean).join(", ")}
                  {buddy.localTime !== null ? ` · ${buddy.localTime} there` : ""}
                </span>
                {buddy.email === null ? null : (
                  <span className="ml-auto flex gap-2">
                    <ChallengeButton email={buddy.email} />
                    <BuddyButton email={buddy.email} isBuddy />
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        <RecencyLegend />
      </section>

      <section className={`${PANEL_CLASS} flex flex-col gap-3`}>
        <h2 className="flex items-baseline gap-2 font-semibold">
          Your record <span className="font-mincho text-xs font-normal opacity-70">戦績</span>
        </h2>
        {profile === null ? (
          <p className="text-sm text-muted">
            No rated games yet. Rated games are shared games between two members: challenge someone from the{" "}
            <Link href="/players" className="underline underline-offset-4">players</Link> page.
          </p>
        ) : (
          <p className="text-sm">
            Overall: <span className="font-mono tabular-nums">{profile.tier === "unrated" ? "–" : profile.rating}</span>{" "}
            <span className="text-muted">
              {TIER_DISPLAY[profile.tier].label} · {profile.wins}W {profile.losses}L {profile.draws}D
            </span>
          </p>
        )}
        {standings.length > 0 ? (
          <table className="w-full text-sm" data-testid="me-standings">
            <thead className="text-left text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
              <tr>
                <th className="py-1 pr-3">Game</th>
                <th className="py-1 pr-3">Rating</th>
                <th className="py-1 pr-3">W</th>
                <th className="py-1 pr-3">L</th>
                <th className="py-1 pr-3">D</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row) => (
                <tr key={row.variant} className="border-t border-rule">
                  <td className="py-1 pr-3">{variantLabel(row.variant)}</td>
                  <td className="py-1 pr-3 font-mono tabular-nums">{row.tier === "unrated" ? "–" : row.rating}</td>
                  <td className="py-1 pr-3 font-mono tabular-nums">{row.wins}</td>
                  <td className="py-1 pr-3 font-mono tabular-nums">{row.losses}</td>
                  <td className="py-1 pr-3 font-mono tabular-nums">{row.draws}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        {tally.answered > 0 ? (
          <p className="text-xs text-muted" data-testid="verdict-tally">
            Your own read: you thought you played well in {tally.up} of the {tally.answered} games you judged
            {tally.upWins > 0 || tally.downWins > 0 ? `, and won ${tally.upWins} of the ${tally.up} you felt good about and ${tally.downWins} of the ${tally.down} you did not` : ""}. Only you see this.
          </p>
        ) : null}
        {name !== "" ? (
          <p className="text-xs">
            <Link href={playerPath(name)} className="underline underline-offset-4">
              Your public page
            </Link>{" "}
            · <Link href="/games" className="underline underline-offset-4">Your games</Link>
          </p>
        ) : null}
      </section>

      {ignored.length > 0 ? (
        <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="ignored">
          <h2 className="flex items-baseline gap-2 font-semibold">
            Ignored <span className="font-mincho text-xs font-normal opacity-70">無視</span>
            <span className="text-xs font-normal text-muted">{ignored.length}</span>
          </h2>
          <p className="text-xs text-muted">They cannot challenge you, and their messages in a game are hidden from you.</p>
          <ul className="flex flex-col gap-1 text-sm">
            {ignored.map((entry) => (
              <li key={entry.email} className="flex items-center gap-3">
                <span>{entry.name}</span>
                <span className="ml-auto"><IgnoreButton email={entry.email} ignoring /></span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <InviteFriends />
    </Page>
  );
}
