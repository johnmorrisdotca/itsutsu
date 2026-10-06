import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { GameTrail } from "@/components/games/GameTrail";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import Link from "@/components/ui/Link";
import { currentReader } from "@/lib/auth/currentReader";
import { appearanceFor } from "@/lib/auth/members";
import { housekiCopy } from "@/lib/houseki/housekiCopy";
import type { HousekiKind } from "@/lib/houseki/houseki.types";
import { gamePath, rulesPath } from "@/lib/gomoku/slugs";
import { currentSpeaker } from "@/lib/i18n/currentLocale";

import { HousekiSetUp } from "./HousekiSetUp";

/**
 * /games/<slug>/new for a Houseki game: the heading, then how to play.
 *
 * Gated like every set-up (`OPEN_PATTERNS` in proxy.ts leaves `/new` shut): a
 * stranger reads the rules and is invited in. It reads who is here, for the
 * wood the preview is drawn on, and nothing else from the database: what the
 * player has won is in their browser (`housekiStore.ts`).
 */
export async function HousekiSetUpPage({ kind }: { kind: HousekiKind }) {
  const say = await currentSpeaker();
  const copy = housekiCopy(kind, say.locale);
  const reader = await currentReader();
  const appearance = (await appearanceFor(reader.memberId)) ?? DEFAULT_APPEARANCE;
  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title={copy.label}
        kanji={copy.kanji}
        crumb={<GameTrail game={{ label: copy.label, href: gamePath(kind), testId: "set-up-up" }} steps={[{ label: say.say("pset.crumb.setUp") }]} />}
        lead={
          <>
            {copy.tagline}{" "}
            <Link href={rulesPath(kind)} className="underline underline-offset-4">
              {say.say("gamepages.howToPlay")}
            </Link>
            .
          </>
        }
      />
      <HousekiSetUp kind={kind} appearance={appearance} />
    </Page>
  );
}
