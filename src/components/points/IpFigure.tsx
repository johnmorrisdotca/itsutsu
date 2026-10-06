"use client";

import Link from "@/components/ui/Link";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { thousands } from "@/lib/ui/thousands";
import type { IpScope } from "@/lib/points/ipBoards";

import { ipHref } from "./ipHref";

/**
 * AN IP FIGURE, LEADING TO THE GAMES IT WAS WON IN — the rule `GameCount`
 * keeps for a count of games, kept for a sum of points. Where the figure's
 * scope has no one page (`ipHref` says why), it is printed plain and says so
 * on hover: a decision made here, never a link quietly left off.
 */
export function IpFigure({
  scope,
  memberId,
  ip,
  month = null,
  week = null,
  suffix = "",
  className = "",
  testId = "ip-figure",
}: {
  scope: IpScope;
  memberId: string;
  ip: number;
  /** "2026-09" when the figure is one month's. */
  month?: string | null;
  /** "2026-09-21", the Monday, when the figure is one week's. */
  week?: string | null;
  /** A unit after the number, " IP". */
  suffix?: string;
  className?: string;
  testId?: string;
}) {
  const say = useSpeaker();
  const href = ipHref(scope, memberId, month, week);
  const text = `${thousands(ip)}${suffix}`;
  if (href === null || ip === 0) {
    return (
      <span
        className={className}
        title={ip === 0 ? undefined : say.say("points.figure.several")}
        data-testid={testId}
      >
        {text}
      </span>
    );
  }
  return (
    <Link href={href} className={`underline-offset-2 hover:underline ${className}`} title={say.say("points.figure.games")} data-testid={testId}>
      {text}
    </Link>
  );
}
