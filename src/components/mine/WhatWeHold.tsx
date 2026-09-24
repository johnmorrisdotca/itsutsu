import type { ReactNode } from "react";

import { GameCount } from "@/components/games/GameCount";
import { LocalTime } from "@/components/ui/LocalTime";
import type { MemberProfile } from "@/lib/auth/members.types";
import { NOT_A_REFUSED_OFFER } from "@/lib/history/offers";
import { prisma } from "@/lib/prisma";
import { AGE_BAND_DISPLAY, type AgeBand } from "@/lib/social/ageBand.constants";

/**
 * WHAT ITSUTSU HOLDS ABOUT YOU, on the Profile tab (PRIV-04): every column the
 * privacy page names, in plain words and with this member's own values, and
 * the counts behind the rest.
 *
 * Not a download. A list a person can read, so asking "what do you keep about
 * me" has an answer on the page rather than an email to wait for. Read only
 * for this tab, one query per count, all at once.
 *
 * Nothing secret is shown back: the four words are said to be set or not, never
 * what they are (they are never stored); a parent's consent is said to be on
 * file, not whose name is on it, since the child may be the one reading.
 */
export async function WhatWeHold({
  member,
  band,
  consented,
}: {
  member: MemberProfile;
  band: AgeBand | null;
  consented: boolean;
}) {
  const id = member.id;
  const [extra, games, sent, received, inbox, buddies, ignores, xpEvents, solves, applause] = await Promise.all([
    // The two columns the profile type does not carry, read here rather than widened into every caller's type.
    prisma.member.findUnique({ where: { id }, select: { phraseSetAt: true, invitedWith: true } }),
    // Games, not offers: a refused offer holds the seat and was never a game, and the list the count links to leaves it out too.
    prisma.game.count({ where: { ...NOT_A_REFUSED_OFFER, OR: [{ blackMemberId: id }, { whiteMemberId: id }] } }),
    prisma.directMessage.count({ where: { fromId: id } }),
    prisma.directMessage.count({ where: { toId: id } }),
    prisma.inboxItem.count({ where: { memberId: id } }),
    prisma.buddy.count({ where: { ownerId: id } }),
    prisma.ignore.count({ where: { ownerId: id } }),
    prisma.xpEvent.count({ where: { memberId: id } }),
    prisma.puzzleSolve.count({ where: { memberId: id } }),
    prisma.applause.count({ where: { memberId: id } }),
  ]);

  const said = (value: string) => (value.trim() === "" ? <span className="text-muted">nothing</span> : value);
  const rows: [string, ReactNode][] = [
    ["Your email address", member.email ? member.email : <span className="text-muted">none: you came in with an invite code</span>],
    ["Your name", said(member.name)],
    ["Your picture", member.picture ? "the one Google gave" : <span className="text-muted">none</span>],
    ["Your age band", band === null ? <span className="text-muted">not asked yet</span> : AGE_BAND_DISPLAY[band].label],
    ["A parent's or guardian's consent", consented ? "on file, with their name and the date" : <span className="text-muted">none</span>],
    ["Your four words", extra?.phraseSetAt ? "set (we keep a check of them, never the words)" : <span className="text-muted">not set</span>],
    ["Your city, country and time zone", said([member.city, member.country, member.timeZone].filter((part) => part.trim() !== "").join(", "))],
    ["What you wrote about yourself", said(member.bio)],
    ["The invite you came in with", said(extra?.invitedWith ?? "")],
    ["When you joined", <LocalTime key="joined" at={member.createdAt.toISOString()} style="date" />],
    ["When you were last here", <LocalTime key="seen" at={member.lastSeenAt.toISOString()} />],
    ["Email about your games", member.emailNotify ? "on" : "off"],
    ["Showing when you are online", member.showOnline ? "on" : "off"],
  ];
  const counts: [string, ReactNode][] = [
    ["Games you have a seat in", <GameCount key="games" count={games} memberId={id} player={member.name} title="Every game you have a seat in" />],
    ["Messages you sent, and received", `${sent} and ${received}`],
    ["Lines in your inbox", String(inbox)],
    ["Buddies, and people you ignore", `${buddies} and ${ignores}`],
    ["Experience points awarded, one line each", String(xpEvents)],
    ["Puzzles you solved", String(solves)],
    ["Games you applauded", String(applause)],
  ];

  return (
    <section className="flex flex-col gap-3 border-t border-rule pt-4" data-testid="what-we-hold">
      <h3 className="text-sm font-semibold">
        What Itsutsu holds about you <span className="font-mincho text-muted">保存情報</span>
      </h3>
      <p className="text-xs text-muted">
        Everything, in plain words. The privacy page says who can see each of these and why we keep it.
      </p>
      <dl className="grid grid-cols-[minmax(0,9rem)_1fr] gap-x-3 gap-y-1.5 text-sm sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-x-4">
        {[...rows, ...counts].map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted">{label}</dt>
            <dd className="min-w-0 break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
