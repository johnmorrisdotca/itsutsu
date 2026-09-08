import Link from "next/link";

import { GameViewClient } from "@/components/game/GameViewClient";
import { SiteHeader } from "@/components/layout/SiteHeader";

/** The board. Whatever game was last in progress resumes here. */
export default function Home() {
  return (
    <div className="paper flex flex-1 flex-col items-center px-4 py-8 sm:px-8">
      <main className="flex w-full max-w-6xl flex-col gap-8">
        <SiteHeader hero />
        <GameViewClient />
        <footer className="flex flex-col gap-2 border-t border-rule pt-5 text-sm text-muted">
          <p>
            Two players take turns placing stones on the intersections. The
            first to line up five in a row, in any direction, wins.
          </p>
          <p>
            This is <span className="font-mincho">五目並べ</span> — gomoku, five
            in a row on a go board. Every finished game is filed in the{" "}
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
