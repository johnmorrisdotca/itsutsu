import Link from "@/components/ui/Link";

import { MemberKindBadge } from "@/components/auth/MemberKindBadge";
import { MEMBER_KINDS, type MemberKind } from "@/lib/auth/memberKind";
import { BOT_NAME_COUNTRIES } from "@/lib/bots/botNames";
import { playerPath } from "@/lib/rating/playerKey";
import { shownName } from "@/lib/rating/shownName";

import { LevelName } from "@/components/xp/LevelName";
import type { NameTag } from "@/lib/xp/nameTag.types";

import { CountryMark } from "./CountryMark";

/**
 * A person's name, leading to their page.
 *
 * A STANDING RULE, the twin of "every game name leads to that game": wherever
 * this site prints somebody's name, that name is the way to them. It was
 * being obeyed in the record table and nowhere else, which is how a rule of
 * this kind goes — one list gets it, the next list written does not, and
 * nobody notices until they click a name and nothing happens.
 *
 * Two names have nobody behind them, and both stay plain rather than pointing
 * at a page that would not exist:
 *
 *  - A blank seat. Nobody sat there; the fallback is a description of the
 *    chair, not a person.
 *  - A name typed into a game at one screen. Two people at one keyboard type
 *    whatever they like, and inventing an identity for it would be worse than
 *    leaving it alone — the same line playerKey and memberIdForName already
 *    draw, where a name nobody holds an account under stays open.
 *
 * What it PRINTS is the first name; where it GOES is unchanged. John's
 * daughter is twelve and her full name was on every list on the site. The
 * address still carries the whole name, and that is a separate decision he has
 * flagged and not yet made — see `shownName`.
 *
 * AND WHAT THEY ARE, BESIDE IT, THE SAME ON EVERY PAGE. John, 2026-09-25, at
 * an XP board naming programs with no mark while the players page marked them:
 * "if it's a bot, it NEEDS the bot tag after the name… All names should be
 * code reuse… the name shows the name, flag, role, etc… we can't be
 * inconsistent in pages." So the flag and the kind badge are drawn here, not
 * by each list. A program is known by its id alone (`botNames.ts`), so its
 * BOT badge and flag cost no read anywhere; a person's flag is their
 * `country`, which the list passes when it has it.
 */
export function PlayerName({
  name,
  memberId,
  fallback,
  linkable = true,
  whole: showWhole = false,
  className = "",
  testId = "player-name",
  country,
  kind,
  tag,
  tagged = true,
}: {
  name: string;
  /**
   * Their opaque id, which is what the link is built from when there is one.
   *
   * WITHOUT IT THIS COMPONENT DEFEATS ITSELF. The screen shows `shownName` —
   * "Hanako M." — and the href used to carry the whole name, so the surname
   * a twelve-year-old had taken down sat in the markup of every page that
   * named her. Shortening a name on screen does nothing while the address
   * under it is whole.
   *
   * Optional because some names have nobody behind them: a blank seat, a name
   * typed into a game at one screen, a record kept from another site. Those
   * keep a name in the address because the name is all they have. Where a
   * member IS behind the name, passing this is not optional in spirit — see
   * `playerLinks.coverage.test.ts`, which fails the build for a caller that
   * has an id and does not pass it.
   */
  memberId?: string | null;
  /** What to say when the seat was empty. */
  fallback: string;
  /** False where the name belongs to nobody — an abandoned game, a hot seat. */
  linkable?: boolean;
  /**
   * Print the name in full.
   *
   * For the operator's own list and nowhere else. Administering members means
   * telling two Hanakos apart, and a page only the operator can open is not
   * where a name is on display.
   */
  whole?: boolean;
  className?: string;
  testId?: string;
  /** Where they are, as they wrote it on their profile. A program's comes from its id. */
  country?: string | null;
  /**
   * What sort of member this is, where the list knows (the operator's list,
   * the directory): kept records and the operator get their badge from it. A
   * program is badged BOT from its id whether or not this is passed.
   */
  kind?: MemberKind;
  /**
   * THE MARKS EVERY LIST DRAWS AFTER A NAME: flag, kind badge and level, read
   * for the whole page at once (`nameTagsOf`). John, 2026-09-26: "Buddies has
   * totally different name formatting… Ladder also is weird since it doesn't
   * have Flag." A table that says the level in a column of its own passes the
   * tag `withoutLevel`. `nameMarks.coverage.test.ts` holds every list to it.
   */
  tag?: NameTag;
  /**
   * False only inside a sentence or a heading that already says who this is:
   * a badge in the middle of a line of prose reads as a typo.
   */
  tagged?: boolean;
}) {
  const whole = name.trim();
  if (whole === "") return <>{fallback}</>;
  const shown = showWhole ? whole : shownName(whole);
  const botCountry = memberId === null || memberId === undefined ? undefined : BOT_NAME_COUNTRIES.get(memberId);
  const shownKind = botCountry !== undefined ? MEMBER_KINDS.robot : (tag?.kind ?? kind);
  const shownCountry = tag?.country ?? country ?? botCountry ?? null;
  const level = tag?.level ?? null;
  const tags =
    tagged && (shownCountry !== null || shownKind !== undefined || level !== null) ? (
      <span className="ml-1 inline-flex items-center gap-1 align-middle whitespace-nowrap" data-testid="player-tags">
        <CountryMark country={shownCountry} className="text-sm leading-none" />
        {shownKind !== undefined ? <MemberKindBadge kind={shownKind} /> : null}
        {level !== null ? <LevelName level={level} compact className="text-muted" testId="player-level" /> : null}
      </span>
    ) : null;
  if (!linkable) {
    return (
      <>
        {shown}
        {tags}
      </>
    );
  }
  return (
    <>
      <Link
        href={playerPath(whole, memberId)}
        className={`underline-offset-2 hover:underline ${className}`.trim()}
        data-testid={testId}
      >
        {shown}
      </Link>
      {tags}
    </>
  );
}
