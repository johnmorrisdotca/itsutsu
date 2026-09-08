import Link from "next/link";

import { AccountMenu, type Who } from "@/components/auth/AccountMenu";
import { AdminLink } from "@/components/auth/AdminLink";
import { currentSession } from "@/lib/auth/currentSession";

import { BrandHero, BrandWordmark } from "./BrandMarks";
import { NavLinks } from "./NavLinks";

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
      <header className="flex flex-col items-center gap-3 border-b border-rule pb-6">
        <Link href="/" aria-label="Itsutsu home" className="block w-full max-w-2xl">
          <BrandHero className="w-full" />
        </Link>
        <p className="text-sm text-muted">Five in a row, and the games that grew from it.</p>
        <Nav />
      </header>
    );
  }

  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-5">
      <Link href="/" aria-label="Itsutsu home" className="block">
        <BrandWordmark className="h-9 w-auto sm:h-10" />
      </Link>
      <Nav />
    </header>
  );
}
