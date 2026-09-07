import Link from "next/link";

import { GameViewClient } from "@/components/game/GameViewClient";
import { SiteHeader } from "@/components/layout/SiteHeader";

import { RULE_VARIANTS } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

/**
 * The board. `?game=<variant>` — the link from a rules page — starts a fresh
 * game of that variant in place of whatever was in progress.
 */
export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const requested = typeof params.game === "string" ? params.game : undefined;
  const variant =
    requested !== undefined && requested in RULE_VARIANTS ? (requested as RuleVariant) : undefined;
  return (
    <div className="paper flex flex-1 flex-col items-center px-4 py-8 sm:px-8">
      <main className="flex w-full max-w-6xl flex-col gap-8">
        <SiteHeader />
        <GameViewClient variant={variant} />
        <footer className="flex flex-col gap-2 border-t border-rule pt-5 text-sm text-muted">
          <p>
            Two players take turns placing stones on the intersections. The
            first to line up five in a row, in any direction, wins.
          </p>
          <p>
            Every finished game is filed in the{" "}
            <Link href="/history" className="underline underline-offset-4">
              record
            </Link>
            .
          </p>
        </footer>
      </main>
    </div>
  );
}
