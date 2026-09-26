import { notFound } from "next/navigation";

import { JourneyBoards } from "@/components/admin/JourneyBoards";
import { JourneyRolesTable } from "@/components/admin/JourneyRolesTable";
import { JourneyScatter } from "@/components/admin/JourneyScatter";
import { JourneySmallMultiples } from "@/components/admin/JourneySmallMultiples";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { isAdminRequest } from "@/lib/auth/requireAdmin";
import { journeyObservations } from "@/lib/sim/journeyObservations";
import { runJourneySimulation } from "@/lib/sim/journeys";

export const metadata = { title: "Player journeys", robots: { index: false, follow: false } };

/**
 * A PROJECTION, FOR FUN: 1000 SIMULATED PLAYERS, A YEAR OF PLAY, AND WHAT
 * THEIR XP AND IP LOOK LIKE AT THE END OF IT.
 *
 * John, 2026-09-25: "an Artifact that explains and projects a site full of
 * 1000 users, and their XP vs IP journey... make this an Admin endpoint that I
 * can hit for purely fun and informational purposes." Admin only, the same
 * `notFound()` pattern as `/admin`, so a stranger gets a 404 rather than a
 * refusal.
 *
 * Nothing here reads the real database or is a claim about the real site: the
 * whole page is `runJourneySimulation`, a pure, deterministic function over
 * 18 modelled roles (`src/lib/sim/journeyRoles.constants.ts`) and the site's
 * own real pricing (`gamePoints`, `XP_EVENTS`, the Elo module) — see that
 * file's own comment for exactly what it approximates and why. The reasoning
 * behind IP itself is `docs/plans/points/README.md` and
 * `docs/plans/points/PTS-02-game-points.md`.
 */
export default async function PlayerJourneysPage() {
  if (!(await isAdminRequest())) notFound();

  const result = runJourneySimulation();
  const observations = journeyObservations(result);

  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title="Player journeys"
        kanji="道程"
        lead="A projection, not a measurement: 1000 imagined players, played out for a simulated year, to see what XP and IP look like when a whole site is full of people."
      />

      <div className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="journey-intro">
        <p className="text-sm leading-relaxed text-ink-soft">
          <strong>XP, experience,</strong> is how long and how widely somebody has been part of the site: it is earned by playing, by
          finishing a game whether it was won or lost, by trying a new game or family for the first time, by a daily visit, a streak of
          days, a buddy added, applause given. It never goes down, and it decides a member&rsquo;s level.
        </p>
        <p className="text-sm leading-relaxed text-ink-soft">
          <strong>IP, Itsutsu Points,</strong> is pure ability: it is earned only by results — a win pays a game&rsquo;s full price, a
          draw half, a loss nothing except a close score — and it resets every month for the monthly race, while the all-time total
          stays. The two are deliberately different currencies, so that a sociable, moderate player and a quiet, competitive one can
          both find something worth collecting.
        </p>
        <p className="text-xs text-muted">
          Every number on this page comes from a model, not from real members: {result.players.length} simulated players across{" "}
          {result.roles.length} roles, a seeded and deterministic twelve-month run (seed {result.seed}). See{" "}
          <code className="text-[0.8em]">docs/plans/points/README.md</code> and{" "}
          <code className="text-[0.8em]">docs/plans/points/PTS-02-game-points.md</code> for how IP itself is priced, and{" "}
          <code className="text-[0.8em]">src/lib/sim/journeyRoles.constants.ts</code> for exactly what each role assumes.
        </p>
      </div>

      <section className={`${PANEL_CLASS} flex flex-col gap-3`} aria-labelledby="journey-roles-heading">
        <h2 id="journey-roles-heading" className={SECTION_TITLE}>
          The eighteen roles
        </h2>
        <JourneyRolesTable result={result} />
      </section>

      <section className={`${PANEL_CLASS} flex flex-col gap-3`} aria-labelledby="journey-scatter-heading">
        <h2 id="journey-scatter-heading" className={SECTION_TITLE}>
          Every player, XP against IP
        </h2>
        <JourneyScatter result={result} />
      </section>

      <section className={`${PANEL_CLASS} flex flex-col gap-3`} aria-labelledby="journey-lines-heading">
        <h2 id="journey-lines-heading" className={SECTION_TITLE}>
          Each role&rsquo;s climb over the year
        </h2>
        <JourneySmallMultiples result={result} />
      </section>

      <section className={`${PANEL_CLASS} flex flex-col gap-3`} aria-labelledby="journey-boards-heading">
        <h2 id="journey-boards-heading" className={SECTION_TITLE}>
          This month&rsquo;s two boards
        </h2>
        <JourneyBoards result={result} />
      </section>

      <section className={`${PANEL_CLASS} flex flex-col gap-2`} aria-labelledby="journey-observations-heading" data-testid="journey-observations">
        <h2 id="journey-observations-heading" className={SECTION_TITLE}>
          What this tells us
        </h2>
        <ul className="flex flex-col gap-2 text-sm leading-relaxed text-ink-soft">
          {observations.map((line, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-muted" aria-hidden>
                •
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>
    </Page>
  );
}
