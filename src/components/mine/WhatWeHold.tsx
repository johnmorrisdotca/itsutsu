import type { ReactNode } from "react";

import { Paired } from "@/components/i18n/Paired";
import { GameCount } from "@/components/games/GameCount";
import { LocalTime } from "@/components/ui/LocalTime";
import type { MemberProfile } from "@/lib/auth/members.types";
import { NOT_A_REFUSED_OFFER } from "@/lib/history/offers";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
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
  const say = await currentSpeaker();
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

  const said = (value: string) => (value.trim() === "" ? <span className="text-muted">{say.say("mine.holdNothing")}</span> : value);
  const rows: [string, ReactNode][] = [
    [say.say("mine.holdEmail"), member.email ? member.email : <span className="text-muted">{say.say("mine.holdNoEmail")}</span>],
    [say.say("mine.holdName"), said(member.name)],
    [say.say("mine.holdPicture"), member.picture ? say.say("mine.holdPictureGoogle") : <span className="text-muted">{say.say("mine.holdNone")}</span>],
    [say.say("mine.holdAge"), band === null ? <span className="text-muted">{say.say("mine.holdNotAsked")}</span> : say.say(AGE_BAND_DISPLAY[band].label)],
    [say.say("mine.holdConsent"), consented ? say.say("mine.holdConsentOn") : <span className="text-muted">{say.say("mine.holdNone")}</span>],
    [say.say("mine.holdWords"), extra?.phraseSetAt ? say.say("mine.holdWordsSet") : <span className="text-muted">{say.say("mine.holdNotSet")}</span>],
    [say.say("mine.holdPlace"), said([member.city, member.country, member.timeZone].filter((part) => part.trim() !== "").join(", "))],
    [say.say("mine.holdBio"), said(member.bio)],
    [say.say("mine.holdInvite"), said(extra?.invitedWith ?? "")],
    [say.say("mine.holdJoined"), <LocalTime key="joined" at={member.createdAt.toISOString()} style="date" />],
    [say.say("mine.holdSeen"), <LocalTime key="seen" at={member.lastSeenAt.toISOString()} />],
    [say.say("mine.holdMail"), say.say(member.emailNotify ? "mine.holdOn" : "mine.holdOff")],
    [say.say("mine.holdOnline"), say.say(member.showOnline ? "mine.holdOn" : "mine.holdOff")],
  ];
  const counts: [string, ReactNode][] = [
    [say.say("mine.holdGames"), <GameCount key="games" count={games} memberId={id} player={member.name} title={say.say("mine.holdGamesTitle")} />],
    [say.say("mine.holdMessages"), say.say("mine.holdAnd", { first: say.number(sent), second: say.number(received) })],
    [say.say("mine.holdInbox"), say.number(inbox)],
    [say.say("mine.holdBuddies"), say.say("mine.holdAndPeople", { first: say.number(buddies), second: say.number(ignores) })],
    [say.say("mine.holdXp"), say.number(xpEvents)],
    [say.say("mine.holdSolves"), say.number(solves)],
    [say.say("mine.holdApplause"), say.number(applause)],
  ];

  return (
    <section className="flex flex-col gap-3 border-t border-rule pt-4" data-testid="what-we-hold">
      <h3 className="text-sm font-semibold">
        <Paired en={say.say("mine.holdTitle")} kanji="保存情報" kanjiClassName="text-muted" />
      </h3>
      <p className="text-xs text-muted">
        {say.say("mine.holdLead")}
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
