import { GameTrail } from "@/components/games/GameTrail";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import Link from "@/components/ui/Link";
import { CASUAL_DISPLAY } from "@/lib/casual/casual.constants";
import type { CasualKind } from "@/lib/casual/casual.types";
import { gamePath, rulesPath } from "@/lib/gomoku/slugs";

import { CasualSetUp } from "./CasualSetUp";

/**
 * /games/<slug>/new for a casual game: the heading, then the level.
 *
 * Gated like every set-up (`OPEN_PATTERNS` in proxy.ts leaves `/new` shut): a
 * stranger reads the rules and is invited in. It reads nothing from the
 * database; what the player has won is in their browser (`casualStore.ts`).
 */
export function CasualSetUpPage({ kind }: { kind: CasualKind }) {
  const copy = CASUAL_DISPLAY[kind];
  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title={copy.label}
        kanji={copy.kanji}
        crumb={<GameTrail game={{ label: copy.label, href: gamePath(kind), testId: "set-up-up" }} steps={[{ label: "Set up" }]} />}
        lead={
          <>
            {copy.tagline}{" "}
            <Link href={rulesPath(kind)} className="underline underline-offset-4">
              How to play
            </Link>
            .
          </>
        }
      />
      <CasualSetUp kind={kind} />
    </Page>
  );
}
