import Link from "next/link";

import { AccountMenu, type Who } from "@/components/auth/AccountMenu";
import { currentSession } from "@/lib/auth/currentSession";
import { memberKeyOf } from "@/lib/auth/memberKey";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { languageOptions } from "@/lib/i18n/dictionaries";
import { LANG_PARAM } from "@/lib/i18n/i18n.constants";
import { STAGE, versionStamps } from "@/lib/version";
import { xpFlashFor, type XpToastHold } from "@/lib/xp/xpFlash";

import { BetaMark } from "./BetaMark";
import { BrandHero, BrandWordmark } from "./BrandMarks";
import { LearnTimeZone } from "./LearnTimeZone";
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
    /* A member behind the session — by id, or by address on an older Google cookie. It was "has an
       address", which drew the stranger's menu for everybody who came in with an invite code. */
    member: session.kind === "player" && memberKeyOf(session) !== null,
  };
}

async function Nav() {
  const [who, say] = await Promise.all([whoIsHere(), currentSpeaker()]);
  const { semver } = versionStamps();
  return (
    <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      <NavLinks />
      {/* Everything about the reader's own account, the operator's links among it, so the bar is the same for everybody. */}
      <AccountMenu
        initial={who}
        languages={{ options: languageOptions(), current: say.locale, param: LANG_PARAM, label: say.say("site.language") }}
        version={{ stage: STAGE, semver }}
      />
      {/*
        Draws nothing. Here rather than beside the two mastheads below because
        `Nav` is the one thing both of them render, so this is mounted exactly
        once per page whichever shape the header takes. It has to be inside a
        server-rendered page at all, which is why it is not in the root layout:
        a layout renders once per document load, and the day it records is a
        fact about the browser that has just arrived.
      */}
      <LearnTimeZone />
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
export async function SiteHeader({
  hero = false,
  xpHeldBy,
}: {
  hero?: boolean;
  /** A game-end batch of toasts the page's result card is saying instead — see `XpToasts`. */
  xpHeldBy?: XpToastHold;
}) {
  if (hero) {
    return (
      <>
        <header data-chrome className="flex flex-col items-center gap-3 border-b border-rule pb-6">
          <Link href="/" aria-label="Itsutsu home" className="block w-full max-w-2xl">
            <BrandHero className="w-full" />
          </Link>
          <p className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted">
            Five in a row, and the games that grew from it.
            <BetaMark />
          </p>
          <Nav />
        </header>
        <XpFlashToasts heldBy={xpHeldBy} />
      </>
    );
  }

  return (
    <>
      <header data-chrome className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-5">
        {/*
          The Beta mark on the wordmark's own row, beside it — John: "should be
          same row inline". It widens the masthead's first row by the pill, so
          where the bar was already a tight fit it wraps a line sooner; the
          header spec measures that it never lands on the bar.
        */}
        <span className="flex items-center gap-2">
          <Link href="/" aria-label="Itsutsu home" className="block">
            <BrandWordmark className="h-9 w-auto sm:h-10" />
          </Link>
          <BetaMark />
        </span>
        <Nav />
      </header>
      <XpFlashToasts heldBy={xpHeldBy} />
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
async function XpFlashToasts({ heldBy }: { heldBy?: XpToastHold }) {
  const flash = await xpFlashFor();
  /*
   * THE HOST STAYS WHEN THERE IS NOTHING NEW, AND THAT IS THE FIX. It used to
   * be left out whenever no flash was waiting. But the toast clears the flash
   * the moment it shows, so ANY re-render of the page in the next few seconds
   * drew the header with no flash and unmounted the host with the toast still
   * in it, mid-read. The deploy runner caught exactly that on 2026-09-24: the
   * XP toast spec's toast and its announcer both gone from /players 0.7
   * seconds after arriving, with no request of the page's own. What re-rendered
   * it there was not found; this makes any re-render harmless. Mounted with
   * nothing, the host keeps the toasts it is already showing: an empty list
   * admits nothing and removes nothing.
   */
  if (flash === null) return <XpToasts at="" items={[]} holdFor={null} />;
  // Held only for the exact batch the page's result card read, by its stamp.
  const holdFor = heldBy !== undefined && heldBy.at === flash.at ? heldBy : null;
  return <XpToasts at={flash.at} items={flash.toasts} holdFor={holdFor} />;
}
