import { BuddyButton } from "@/components/mine/BuddyButton";
import { Paired } from "@/components/i18n/Paired";
import Link from "@/components/ui/Link";

import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { weave } from "@/lib/i18n/weave";
import { LEGACY_PLAYERS } from "@/lib/legacy/legacyPlayers.data";
import type { LegacyKind } from "@/lib/legacy/legacyPlayers.types";
import type { KeptRecordStar } from "@/lib/social/keptRecordStars";

/**
 * One roll of legacy players sharing a kind — "Remembered" or "Honorary
 * members". They never played here, but their record from elsewhere is kept,
 * so they are named on the site the way anybody else is — and, like anybody
 * else, can be kept as a buddy (`keptRecordStars`).
 */
export async function LegacyRoll({
  kind,
  label,
  kanji,
  stars,
}: {
  kind: LegacyKind;
  label: string;
  kanji: string;
  /** The star beside each name, by slug; none for a reader with no account. */
  stars: ReadonlyMap<string, KeptRecordStar>;
}) {
  const say = await currentSpeaker();
  const players = LEGACY_PLAYERS.filter((legacy) => legacy.kind === kind);
  if (players.length === 0) return null;
  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-rule-strong bg-ivory/60 px-3 py-2.5"
      data-testid={`legacy-roll-${kind}`}
    >
      <span className="flex items-baseline gap-2 text-[0.68rem] font-semibold tracking-[0.1em] text-muted uppercase">
        <Paired en={label} kanji={kanji} kanjiClassName="font-normal normal-case tracking-normal opacity-70" />
      </span>
      <ul className="flex flex-col gap-1 text-sm">
        {players.map((legacy) => {
          const star = stars.get(legacy.slug);
          return (
          <li key={legacy.slug} className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
            <Link href={`/players/${legacy.slug}`} className="font-medium underline-offset-4 hover:underline">
              {legacy.name}
            </Link>
            <span className="text-muted">
              {say.say("players.rollLine", {
                possessive: say.locale === "ja" ? "" : (legacy.possessive ?? "their"),
                sites: say.list(legacy.sources.map((source) => source.site)),
              })}
            </span>
            </span>
            {star === undefined ? null : (
              <span className="ml-auto">
                <BuddyButton memberId={star.memberId} isBuddy={star.isBuddy} />
              </span>
            )}
          </li>
          );
        })}
      </ul>
    </div>
  );
}
