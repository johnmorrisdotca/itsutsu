"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";

import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import type { KeepThisAccountProps } from "./keepThisAccount.types";
import { KEEP_ACCOUNT_COPY } from "./mine.constants";

/**
 * Where Google's sign-in comes back to: the route that attaches the address it
 * has just proved to the member already in this browser (`attachAddress`), and
 * then this member's own page, where that address now shows under the name.
 */
const AFTER_GOOGLE = `/api/session/google?next=${encodeURIComponent("/me")}`;

/**
 * An account made by an invite code lives in one cookie, so the welcome says so
 * before it is closed, and puts both remedies beside the sentence.
 *
 * Both are controls on the welcome itself because the welcome holds the tabs
 * back until a name is chosen — "on the Words tab" named a place this page was
 * not yet showing. Google is a button that starts the sign-in from here; the
 * words are a link straight to the tab that sets them.
 */
export function KeepThisAccount({ days, googleReady }: KeepThisAccountProps) {
  const hydrated = useHydrated();
  return (
    <div className="flex flex-col gap-3" data-testid="welcome-keep" {...readyMark(hydrated)}>
      <p className="text-sm font-medium" data-testid="welcome-no-address">
        {KEEP_ACCOUNT_COPY.lives(days)} {googleReady ? KEEP_ACCOUNT_COPY.unlessGoogle : KEEP_ACCOUNT_COPY.noGoogle}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        {googleReady ? (
          <div className="flex flex-1 flex-col gap-1">
            <button
              type="button"
              // NextAuth starts sign-in from a POST with its CSRF token; a plain link only bounces back.
              onClick={() => void signIn("google", { callbackUrl: AFTER_GOOGLE })}
              className={`${BUTTON_BASE} ${BUTTON_STRONG} px-4 py-2`}
              data-testid="welcome-link-google"
            >
              {KEEP_ACCOUNT_COPY.linkGoogle}
            </button>
            <p className="text-xs text-muted">{KEEP_ACCOUNT_COPY.linkGoogleNote}</p>
          </div>
        ) : null}
        <div className="flex flex-1 flex-col gap-1">
          <Link
            href="/me?view=words"
            className={`${BUTTON_BASE} ${BUTTON_QUIET} px-4 py-2 text-center`}
            data-testid="welcome-add-words"
          >
            {KEEP_ACCOUNT_COPY.addWords}
          </Link>
          <p className="text-xs text-muted">{KEEP_ACCOUNT_COPY.addWordsNote(days)}</p>
        </div>
      </div>
    </div>
  );
}
