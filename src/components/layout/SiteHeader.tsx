import Link from "next/link";

import { AccountMenu, type Who } from "@/components/auth/AccountMenu";
import { AdminLink } from "@/components/auth/AdminLink";
import { currentSession } from "@/lib/auth/currentSession";
import { xpFlashFor } from "@/lib/xp/xpFlash";

import { BrandHero, BrandWordmark } from "./BrandMarks";
import { NavLinks } from "./NavLinks";
import { XpToasts } from "./XpToasts";

/** Who is signed in, read on the server so the header is right on first paint. */
async function whoIsHere(): Promise<Who> {
  const session = await currentSession();
  if (session === null) return { signedIn: false, admin: false, email: null, name: null, picture: null, member: false };
  return {
    signedIn: true,
    admin: session.kind === "admin",
    email: session.email ?? null,
    name: session.name ?? null,
    picture: session.picture ?? null,
    member: session.kind === "player" && session.email !== undefined,
  };
}

async function Nav() {
  const who = await whoIsHere();
  return (
    <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      <NavLinks />
      <AdminLink initial={who} />
      <AccountMenu initial={who} />
    </nav>
  );
}

/**
 * The masthead.
 *
 * Two forms of the same thing. The front page carries the full hero — the 五つ
 * avatar beside the wordmark — because that is the page that introduces the
 * site. Every other page carries the compact wordmark, so the mark appears
 * once per page rather than twice stacked. The game being played says its own
 * name where it is played, not up here.
 */
export async function SiteHeader({ hero = false }: { hero?: boolean }) {
  if (hero) {
    return (
      <>
        <header data-chrome className="flex flex-col items-center gap-3 border-b border-rule pb-6">
          <Link href="/" aria-label="Itsutsu home" className="block w-full max-w-2xl">
            <BrandHero className="w-full" />
          </Link>
          <p className="text-sm text-muted">Five in a row, and the games that grew from it.</p>
          <Nav />
        </header>
        <XpFlashToasts />
      </>
    );
  }

  return (
    <>
      <header data-chrome className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-5">
        <Link href="/" aria-label="Itsutsu home" className="block">
          <BrandWordmark className="h-9 w-auto sm:h-10" />
        </Link>
        <Nav />
      </header>
      <XpFlashToasts />
    </>
  );
}

/**
 * The XP a member has earned and not been shown, if there is any.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * HERE AND NOT IN THE ROOT LAYOUT, AND THE DOCS ARE WHAT SETTLE IT
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `XP_DESIGN.md` says the masthead and gives a cost reason. There is a second
 * reason, and it is the one that decides: **"Layouts do not rerender on
 * navigation"** — `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/layout.md`.
 * A root-layout mount renders once per document load, so a member who earns XP
 * and then moves around the site with `next/link` would be shown nothing until
 * they reloaded. `SiteHeader` is mounted by each PAGE, which does re-render on
 * navigation, so the flash is read on the next page they open — which is the
 * whole of the mechanism.
 *
 * The cost is nothing either way. `xpFlashFor` asks who is signed in first and
 * returns before touching the database for a signed-out reader; for a member,
 * the flash is a column on the row `memberRowFor` has already cached for this
 * request. No fetch, no timer, no polling: the awarder wrote it, and this reads
 * it once.
 *
 * A page with no masthead shows no toast, which `XP_DESIGN.md` accepts: the
 * ledger still has it and the next page with chrome says so.
 *
 * ONE HOST PER RENDER. The two branches above are one page's two shapes, so
 * only one of them ever renders — and `xpToastMount.test.ts` is the gate that
 * keeps a second host from appearing anywhere else.
 */
async function XpFlashToasts() {
  const flash = await xpFlashFor();
  if (flash === null) return null;
  return <XpToasts at={flash.at} items={flash.toasts} />;
}
