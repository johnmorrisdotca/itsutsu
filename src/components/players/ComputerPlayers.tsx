import Link from "next/link";

import { ChallengeButton } from "@/components/mine/ChallengeButton";
import { MemberKindBadge } from "@/components/auth/MemberKindBadge";
import { PlayerName } from "@/components/players/PlayerName";
import { CountryMark } from "@/components/players/CountryMark";
import { RowActions } from "@/components/ui/Controls";
import { MEMBER_KINDS } from "@/lib/auth/memberKind";
import { BOT_TIER_LIST } from "@/lib/gomoku/opponent.constants";
import type { DirectoryEntry } from "@/lib/rating/players";

/**
 * The players that are programs.
 *
 * They are members like anybody else — their own rows, their own ids, their
 * own pages — so this is a section of the directory rather than a different
 * kind of thing. It exists because a reader looking for somebody to play
 * should be able to find them together and see at a glance which
 * is which, rather than picking them out of a list of people by their badges.
 *
 * The rating shown is the one earned against the computer players, because
 * that is the only pool they play in: a bot never plays a person-versus-person
 * game, so its ordinary rating would sit at its starting value for ever and
 * printing that would be worse than printing nothing.
 */
export function ComputerPlayers({ entries }: { entries: DirectoryEntry[] }) {
  if (entries.length === 0) return null;
  /*
   * Easiest first, so the ladder reads itself. The directory hands them over
   * in the order they were last seen, which for players who are always
   * here means an order that changes with whoever moved last.
   */
  const order: readonly string[] = BOT_TIER_LIST;
  const shown = [...entries].sort(
    (a, b) => order.indexOf(a.botTier ?? "") - order.indexOf(b.botTier ?? ""),
  );
  /*
   * No panel and no heading of its own: this is the body of the Computers
   * tab, and the tab has already said what it is.
   */
  return (
    <section className="flex flex-col gap-3" data-testid="computer-players">
      {/*
        The count is read from the list rather than written into the sentence.
        It said "three opponents, at three strengths" and went on saying it
        while there were five, which is the kind of small untruth a page tells
        for months because nobody thinks of a paragraph as something that can
        go out of date.
      */}
      <p className="max-w-prose text-xs text-muted">
        {shown.length} opponents that will play any game on this board, from the gentlest to the strongest. They hold a
        seat like anybody else and their games count: beating one moves your rating, and losing to one moves it the
        other way. They keep a rating of their own, earned against each other and against the people who play them —
        kept apart from the ladder, so a game against a program never changes where you stand among the people.
      </p>
      <ul className="flex flex-col gap-1.5">
        {shown.map((entry) => (
          <li
            key={entry.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-rule px-3 py-2 text-sm"
            data-testid="computer-player"
            data-tier={entry.botTier}
          >
            <span className="flex min-h-7 min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
              <PlayerName name={entry.name} fallback="" className="font-medium" testId="computer-player-name" />
              <CountryMark country={entry.country} className="ml-1.5 text-sm" />
              <MemberKindBadge kind={MEMBER_KINDS.robot} />
            </span>
            {/*
              Their figures come from the computer pool, which is the only one
              they play in. Reading the ordinary ones would say they had never
              played, however many games they had just finished — which is
              exactly what the page said the first time somebody beat Kyu.
            */}
            <span className="font-mono text-xs tabular-nums text-muted" data-testid="computer-player-record">
              {entry.profile === null || entry.profile.computer.ratedGames === 0
                ? "no games yet"
                : `${entry.profile.computer.wins}W · ${entry.profile.computer.losses}L · ${entry.profile.computer.draws}D · ${entry.profile.computer.rating}`}
            </span>
            <RowActions>
              <ChallengeButton memberId={entry.id} label="Play" />
            </RowActions>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">
        Each of them has a page of their own, the same as anybody else:{" "}
        <Link href="/players" className="underline underline-offset-4">
          follow a name
        </Link>{" "}
        to see what they have played.
      </p>
    </section>
  );
}
