import Link from "next/link";
import { redirect } from "next/navigation";

import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { InviteFriends } from "@/components/mine/InviteFriends";
import { NameForm } from "@/components/mine/NameForm";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { currentSession } from "@/lib/auth/currentSession";
import { findMember } from "@/lib/auth/members";
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

  const member = await findMember(me.email);
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
        {name !== "" ? (
          <p className="text-xs">
            <Link href={`/players/${encodeURIComponent(name)}`} className="underline underline-offset-4">
              Your public page
            </Link>{" "}
            · <Link href="/games" className="underline underline-offset-4">Your games</Link>
          </p>
        ) : null}
      </section>

      <InviteFriends />
    </Page>
  );
}
