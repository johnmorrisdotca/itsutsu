import { Paired } from "@/components/i18n/Paired";
import Link from "next/link";

import { LEGACY_PLAYERS } from "@/lib/legacy/legacyPlayers.data";
import type { LegacyKind } from "@/lib/legacy/legacyPlayers.types";

/**
 * One roll of legacy players sharing a kind — "Remembered" or "Honorary
 * members". They never played here, but their record from elsewhere is kept,
 * so they are named on the site the way anybody else is.
 */
export function LegacyRoll({ kind, label, kanji }: { kind: LegacyKind; label: string; kanji: string }) {
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
        {players.map((legacy) => (
          <li key={legacy.slug}>
            <Link href={`/players/${legacy.slug}`} className="font-medium underline-offset-4 hover:underline">
              {legacy.name}
            </Link>
            <span className="text-muted">
              {" "}
              — never played here, but {legacy.possessive ?? "their"} record from{" "}
              {legacy.sources.map((source) => source.site).join(" and ")} is kept.
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
