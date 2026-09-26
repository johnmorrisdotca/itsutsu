"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import Link from "@/components/ui/Link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import { TAP_HEIGHT } from "@/components/ui/ui.constants";
import { LanguagePicker } from "@/components/layout/LanguagePicker";
import { FEED_PATH } from "@/lib/feed/feed.constants";

import type { MenuLanguages, MenuVersion } from "./accountMenu.types";

export type Who = { signedIn: boolean; admin: boolean; email: string | null; name: string | null; picture: string | null; member: boolean };

const fetcher = async (url: string): Promise<Who | null> => {
  const response = await fetch(url);
  return response.ok ? response.json() : null;
};

/*
 * The operator's corners of the Admin page, one click nearer. Tabs of the one
 * page rather than pages of their own, so they are its `?view=` addresses.
 */
const ADMIN_SHORTCUTS = [
  { href: "/admin?view=work", label: "The work", testId: "admin-work-link" },
  { href: "/admin?view=members", label: "The members", testId: "admin-members-link" },
] as const;

/** The popup's width, and what it needs to its left before it may open leftward. */
const MENU_WIDTH_PX = 256;
const MENU_EDGE_PX = 16;

// `py-1.5` for the desk, where `TAP_HEIGHT` gives no height and the items sat touching (John, 2026-09-24: "compressed").
const ITEM = `flex items-center rounded-lg px-2 py-1.5 text-ink-soft hover:bg-rule/40 hover:text-ink ${TAP_HEIGHT}`;
const DIVIDER = "my-1.5 border-t border-rule";

/**
 * Who is signed in, in the header — one control that opens everything about
 * the reader's own account.
 *
 * John, 2026-09-23: "The Profile (John Morris) Inbox and SIgnout can all be one
 * menu item. Where you click on the Name to get a menu … that way the header is
 * always the same regardless of role." So the bar holds the sections of the
 * site and then this, and nothing else: the Admin link that used to sit in the
 * bar for the operator alone lives in here, which is what keeps the bar the
 * same for everybody.
 *
 * A stranger sees the way in. Anybody signed in sees their picture (or their
 * initial) and name; the popup holds, between dividers, who they are, their
 * inbox, the language, the operator's links, the edition the site is on, and
 * the way out. An invite-only visitor has no name or page, so for them the
 * first two sections are missing and the rest stays.
 *
 * It closes on a click outside, on Escape (handing focus back to the button),
 * and on arriving at another address.
 */
export function AccountMenu({ initial, languages, version }: { initial: Who; languages: MenuLanguages; version: MenuVersion }) {
  const router = useRouter();
  const pathname = usePathname();
  // The server already knows who is here; the first paint uses that, so nothing flashes in.
  const { data, mutate } = useSWR("/api/session", fetcher, { fallbackData: initial });
  const say = useSpeaker();
  /*
   * Read here rather than at the element, because there are early returns
   * below it and a hook may not sit after one. The menu opens from a button,
   * so a press before React attaches does nothing; the mark is what a spec
   * waits on instead of guessing.
   */
  const hydrated = useHydrated();
  /*
   * Open AT an address rather than open: a link inside is a client-side
   * navigation, and the menu must not hang open over the next page. Keeping
   * where it was opened makes arriving anywhere else close it, with no effect
   * to reset it a render late.
   */
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  // Leftward from the button's right edge, unless the bar has wrapped the button too near the left.
  const [alignLeft, setAlignLeft] = useState(false);
  const box = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (box.current && !box.current.contains(event.target as Node)) setOpenAt(null);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpenAt(null);
      trigger.current?.focus();
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (data === undefined) return null;
  if (data === null || !data.signedIn) {
    return (
      <Link href="/join" className="whitespace-nowrap font-medium hover:underline underline-offset-4" data-testid="sign-in">
        {say.say("account.signIn")}
      </Link>
    );
  }

  async function signOut() {
    setOpenAt(null);
    await fetch("/api/session", { method: "DELETE" });
    await mutate();
    router.push("/");
    router.refresh();
  }

  /*
   * A language is chosen INSIDE the menu, so the menu stays. The gate reads
   * `?lang=` off any GET, sets the cookie and redirects to the clean address
   * (`rememberLanguage` in proxy.ts); a fetch collects that cookie without the
   * page going anywhere, and `router.refresh()` empties the client router
   * cache and redraws every server-rendered word in the new language, this
   * panel included, since `languages` arrives as a prop. The panel is client
   * state keyed to the path, and the path has not changed, so it is still
   * open when the words come back. John, 2026-09-24: "Clicking on the
   * languages in the menu should NOT close the menu."
   *
   * The refresh is the part that matters, and `LanguagePicker.tsx` says why:
   * a language change that leaves the client cache full of the old language
   * is the 0.126.0 bug. If the fetch cannot be made at all, the anchor's own
   * address is followed instead, and the language changes the way it always
   * did, with a page load.
   */
  async function chooseLanguage(href: string) {
    try {
      await fetch(href, { redirect: "manual", cache: "no-store", credentials: "same-origin" });
    } catch {
      window.location.assign(href);
      return;
    }
    router.refresh();
  }

  function toggle() {
    const right = trigger.current?.getBoundingClientRect().right ?? Infinity;
    setAlignLeft(right < MENU_WIDTH_PX + MENU_EDGE_PX);
    setOpenAt(open ? null : pathname);
  }

  const named = data.member || data.admin;
  const label = data.name || data.email || "Account";

  return (
    <span ref={box} className="relative" data-testid="account-menu" data-open={open} {...readyMark(hydrated)}>
      <button
        ref={trigger}
        type="button"
        onClick={toggle}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="account-menu-panel"
        title={data.email ?? undefined}
        className={`inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full py-0.5 pl-0.5 pr-2 text-ink-soft hover:bg-rule/40 hover:text-ink ${TAP_HEIGHT}`}
        data-testid="account-menu-button"
      >
        <Face picture={data.picture} label={label} />
        <span className="max-w-32 truncate">{label}</span>
        <svg aria-hidden viewBox="0 0 12 12" className={`size-3 text-muted transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <div
          id="account-menu-panel"
          className={`absolute top-full z-50 mt-2 rounded-2xl border border-rule-strong/70 bg-paper p-2 text-sm shadow-lg ${alignLeft ? "left-0" : "right-0"}`}
          style={{ width: MENU_WIDTH_PX, maxWidth: `calc(100vw - ${MENU_EDGE_PX * 2}px)` }}
          data-testid="account-menu-panel"
          // Any link followed from here closes it — `/admin?view=work` from `/admin` keeps the path, so the address alone would not.
          onClick={(event) => {
            const target = event.target as HTMLElement;
            // A link is a departure and shuts the menu; a language is not, and does not.
            if (target.closest("a") && !target.closest("[data-testid=menu-language-picker]")) setOpenAt(null);
          }}
        >
          {/* The pointer at the trigger, as UmaKuma's panel has: the menu is this button's, and says so. */}
          <span
            aria-hidden
            data-testid="account-menu-caret"
            className={`absolute -top-1.5 size-3 rotate-45 border-l border-t border-rule-strong/70 bg-paper ${alignLeft ? "left-5" : "right-5"}`}
          />
          {named ? (
            <>
              <Link href="/me" className="block rounded-lg px-2 py-1.5 hover:bg-rule/40" data-testid="me-link">
                <span className="block truncate font-medium text-ink">{label}</span>
                {/* The address under the name, unless the address is all the name there is. */}
                {data.email && data.email !== label ? <span className="block truncate text-xs text-muted">{data.email}</span> : null}
              </Link>
              <hr className={DIVIDER} />
            </>
          ) : null}
          {data.member ? (
            // What happened while they were away. The count is on /play, not here on every page.
            <Link href="/inbox" className={ITEM} data-testid="inbox-link">
              Inbox
            </Link>
          ) : null}
          {data.member ? (
            // What you and your buddies have been doing, and the games finished lately: see /feed.
            <Link href={FEED_PATH} className={ITEM} data-testid="feed-link">
              {say.say("feed.title")}
            </Link>
          ) : null}
          {named ? (
            <>
              {/* Who you are and what others see: the Profile tab. The name above opens the whole page. */}
              <Link href="/me?view=profile" className={ITEM} data-testid="profile-link">
                Profile
              </Link>
              {/* How the site behaves for you: the Settings tab. The pair both sites' menus name. */}
              <Link href="/me?view=settings" className={ITEM} data-testid="settings-link">
                Settings
              </Link>
            </>
          ) : null}
          {/* Every page the masthead has, here too, for when the masthead is folded on a phone. */}
          <Link href="/about" className={ITEM} data-testid="about-link">
            {say.say("nav.about")}
          </Link>
          <hr className={DIVIDER} />
          <div className="px-2 py-1.5">
            <p className="mb-1 text-xs text-muted">{languages.label}</p>
            {/* The picker reads the query to carry it across, which needs a boundary of its own. */}
            <Suspense fallback={null}>
              <LanguagePicker {...languages} testId="menu-language-picker" onChoose={chooseLanguage} />
            </Suspense>
          </div>
          {data.admin ? (
            <>
              <hr className={DIVIDER} />
              <Link href="/admin" className={ITEM} data-testid="admin-link">
                {say.say("nav.admin")}
              </Link>
              {ADMIN_SHORTCUTS.map((shortcut) => (
                <Link key={shortcut.href} href={shortcut.href} className={`${ITEM} pl-5 text-muted`} data-testid={shortcut.testId}>
                  {shortcut.label}
                </Link>
              ))}
            </>
          ) : null}
          <hr className={DIVIDER} />
          <Link href="/releases" className="flex items-baseline justify-between rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-rule/40" data-testid="menu-version">
            <span>
              {version.stage} · v{version.semver}
            </span>
            <span>What&apos;s new →</span>
          </Link>
          <hr className={DIVIDER} />
          <button type="button" onClick={signOut} className={`${ITEM} w-full text-left`} data-testid="sign-out">
            {say.say("account.signOut")}
          </button>
        </div>
      ) : null}
    </span>
  );
}

/** The Google picture when there is one; otherwise the first letter of the name in a circle. */
function Face({ picture, label }: { picture: string | null; label: string }) {
  if (picture) {
    // eslint-disable-next-line @next/next/no-img-element -- a Google avatar URL, not ours to optimise
    return <img src={picture} alt="" className="size-6 rounded-full" referrerPolicy="no-referrer" />;
  }
  return (
    <span aria-hidden className="grid size-6 place-items-center rounded-full bg-moss/15 text-xs font-semibold text-moss">
      {label.slice(0, 1).toUpperCase()}
    </span>
  );
}
