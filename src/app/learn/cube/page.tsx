import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { PageTitle, SectionHeading } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CubeMethodGuide } from "@/components/learn/CubeMethodGuide";
import Link from "@/components/ui/Link";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { CUBE_GUIDE_COPY } from "@/lib/learn/cubeMethod";

export const metadata = { title: "Solve the cube" };

/**
 * THE CUBE'S GUIDE: the beginner's method, told a stage at a time with a
 * live cube to practise each on (`CubeMethodGuide`). Its own folder, so it
 * is found before the strategy guides' `[slug]`, which are about games of
 * two players and read from `strategy.ts`. Open to a reader with no invite,
 * as all of Learn is (`OPEN_PATTERNS` in `src/proxy.ts`): it names no member.
 */
export default function CubeGuidePage() {
  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title={CUBE_GUIDE_COPY.title}
        kanji={CUBE_GUIDE_COPY.kanji}
        lead={CUBE_GUIDE_COPY.lead}
        crumb={
          <>
            <Link href="/learn" className="underline-offset-2 hover:underline">
              Learn
            </Link>{" "}
            / {CUBE_GUIDE_COPY.title}
          </>
        }
      >
        <p className="flex flex-wrap gap-2 pt-1 text-xs">
          <span className="inline-flex items-center gap-2 rounded-lg border border-rule p-1 pr-3">
            <GameThumb variant="cube" size="small" />
            <GameName variant="cube" />
          </span>
        </p>
      </PageTitle>
      <article className={`${PANEL_CLASS} flex flex-col gap-6`} data-testid="guide-page">
        <section className="flex flex-col gap-2">
          <SectionHeading title={CUBE_GUIDE_COPY.notationHeading} />
          {CUBE_GUIDE_COPY.notation.map((paragraph) => (
            <p key={paragraph} className="text-sm leading-relaxed">
              {paragraph}
            </p>
          ))}
        </section>
        <CubeMethodGuide />
        <section className="flex flex-col gap-2">
          <SectionHeading title={CUBE_GUIDE_COPY.playHeading} />
          <p className="text-sm leading-relaxed">
            {CUBE_GUIDE_COPY.play} <GameName variant="cube" />
          </p>
        </section>
      </article>
    </Page>
  );
}
