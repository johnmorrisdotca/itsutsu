"use client";

import Link from "@/components/ui/Link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useId, useState, type FormEvent } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import {
  BUTTON_BASE,
  BUTTON_STRONG,
  INPUT_CLASS,
  PANEL_CLASS,
  TONE_CLASS,
} from "@/components/ui/ui.constants";
import { SITE_NAME } from "@/lib/i18n/siteName";
import { CODE_WORDS } from "@/lib/invite/inviteCode";
import type { RegistrationMode } from "@/lib/site/site.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

/**
 * The door.
 *
 * Google first: one button, and a member is in. A player with no account
 * types the three words they were given instead; the operator may use an
 * email and token. Everything ends the same way — a signed cookie — and
 * nobody is asked twice.
 */
export function JoinForm({
  next,
  googleReady,
  pending,
  initialCode = "",
  operator = false,
  registration = "invite-only",
  notice = "",
}: {
  next: string;
  googleReady: boolean;
  /** A Google account at the door that is not yet a member: one code makes it one. */
  pending: { name: string; email: string } | null;
  /** A code carried in the address, from an invitation link. */
  initialCode?: string;
  /** The operator's own door, reached by address only: /join?operator=1. */
  operator?: boolean;
  /**
   * How the operator has set signing up. The door only says what it is; the
   * routes behind it are what enforce it. Defaulted to the strict mode so that
   * a caller who forgets to pass it describes the site as tighter than it is,
   * never looser.
   */
  registration?: RegistrationMode;
  /** A line the operator put on the door. Empty is the ordinary case. */
  notice?: string;
}) {
  const router = useRouter();
  const say = useSpeaker();
  const mode: "invite" | "admin" = operator ? "admin" : "invite";
  /*
   * Nobody new, and this visitor is nobody yet. Said plainly rather than by
   * offering a code field that cannot work — a door that takes an answer it
   * will refuse is worse than one that says it is shut. The operator's own door
   * is never affected: `operator=1` puts the form in admin mode above.
   */
  const shut = mode === "invite" && registration === "closed";
  const [code, setCode] = useState(initialCode);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // An invite code is the door for someone with no Google account. Someone
  // who has one sees only the button; the code stays out of the way until
  // they say they need it — or until a code arrived with the link.
  const [showInviteCode, setShowInviteCode] = useState(initialCode !== "");
  // The note under the code box describes it rather than naming it; see below.
  const codeHintId = useId();
  // Whether there is anything on the page for "Enter" to submit — the same
  // condition the invite-code field itself shows under, plus the operator's
  // door, which always has its own fields.
  const showSubmit =
    mode === "admin" || (!shut && (!googleReady || pending !== null || showInviteCode));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "invite"
            ? { kind: "invite", code }
            : { kind: "admin", email, token },
        ),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(
          response.status === 429
            ? say.say("auth.join.tooMany")
            : (body?.error ?? say.say("auth.join.refused")),
        );
        setBusy(false);
        return;
      }

      /*
       * A code that has just made an account goes to the welcome first, where
       * the name is chosen — the same first page a member who came in by Google
       * is shown. The account has a placeholder name until then, and a name is
       * the one thing the site needs to ask.
       */
      const landed = (await response.json().catch(() => null)) as { welcome?: boolean } | null;
      router.replace(landed?.welcome === true ? `/me?welcome=1&next=${encodeURIComponent(next)}` : next);
      router.refresh();
    } catch {
      setError(say.say("auth.join.unreachable"));
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className={`${PANEL_CLASS} flex w-full max-w-md flex-col gap-4`}
      data-testid="join-form"
      {...readyMark(useHydrated())}
    >
      <div className="flex flex-col gap-1">
        {/*
          The same precedence as the sentence below it, which is the operator's
          door first. Before signing up could be closed there were only three
          states and `pending` could not collide with the operator's door; now
          it can — /join?operator=1 in a browser Google knows — and the heading
          and the sentence must not answer that differently.
          締切 is the word a club uses when it has stopped taking names.
        */}
        <h1 className="font-mincho text-2xl font-bold">
          {mode === "admin" ? "管理" : shut ? "締切" : pending !== null ? "ようこそ" : "合言葉"}
        </h1>
        <p className="text-sm text-muted">
          {mode === "admin"
            ? say.say("auth.join.operatorLead")
            : shut
              ? say.say("auth.join.shutLead", { site: SITE_NAME })
              : pending !== null
                ? registration === "open"
                  ? say.say("auth.join.pendingOpen", { name: pending.name || pending.email })
                  : say.say("auth.join.pendingCode", { name: pending.name || pending.email, count: say.number(CODE_WORDS) })
                : registration === "open"
                  ? say.say("auth.join.openLead")
                  : say.say("auth.join.codeLead")}
        </p>
      </div>

      {notice !== "" ? (
        <p
          className={`rounded-xl border px-3 py-2 text-sm ${TONE_CLASS.calm}`}
          data-testid="join-notice"
        >
          {notice}
        </p>
      ) : null}

      {googleReady && pending === null ? (
        <>
          <button
            type="button"
            // NextAuth starts sign-in from a POST with its CSRF token; a plain link only bounces back here.
            onClick={() => void signIn("google", { callbackUrl: `/api/session/google?next=${next}` })}
            className={`${BUTTON_BASE} ${BUTTON_STRONG} w-full py-2`}
            data-testid="google-signin"
            data-next={next}
          >
            {say.say("auth.join.google")}
          </button>
          {mode === "invite" && !showInviteCode && !shut ? (
            <button
              type="button"
              onClick={() => setShowInviteCode(true)}
              className="text-center text-xs text-muted underline underline-offset-4"
              data-testid="show-invite-code"
            >
              {say.say("auth.join.useCode")}
            </button>
          ) : mode === "admin" ? (
            <p className="text-center text-xs text-muted">{say.say("auth.join.orOperator")}</p>
          ) : null}
        </>
      ) : null}

      {mode === "invite" ? (
        !shut && (!googleReady || pending !== null || showInviteCode) && (
          /*
            The note is the label's SIBLING, not its last child. Everything
            inside a label is the control's name, so the box used to be called
            "Invite code Capitals, spaces or hyphens — any of them work." — the
            fault `Field` in Controls.tsx describes, written out by hand here.
            The column and its spacing are the label's old ones moved out one
            level, so nothing moves on screen; the note reaches the box as its
            description instead.
          */
          <div className="flex flex-col gap-1">
            <label className="flex flex-col gap-1">
              <span className="text-sm">{say.say("auth.join.codeLabel")}</span>
              <input
                className={`${INPUT_CLASS} font-mono`}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="hoshi-kuma-nami"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                autoFocus={showInviteCode}
                aria-describedby={codeHintId}
                data-testid="invite-code"
              />
            </label>
            <span id={codeHintId} className="text-xs text-muted">
              {say.say("auth.join.codeHint")}
            </span>
          </div>
        )
      ) : (
        <>
          <label className="flex flex-col gap-1">
            <span className="text-sm">{say.say("auth.join.email")}</span>
            <input
              type="email"
              className={INPUT_CLASS}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              data-testid="admin-email"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm">{say.say("auth.join.operatorToken")}</span>
            <input
              type="password"
              className={INPUT_CLASS}
              value={token}
              onChange={(event) => setToken(event.target.value)}
              autoComplete="current-password"
              data-testid="admin-token"
            />
          </label>
        </>
      )}

      {error !== null ? (
        <p
          className={`rounded-xl border px-3 py-2 text-sm ${TONE_CLASS.warn}`}
          role="alert"
          data-testid="join-error"
        >
          {error}
        </p>
      ) : null}

      {showSubmit ? (
        <div className="flex flex-col items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className={`${BUTTON_BASE} ${BUTTON_STRONG} w-full py-2`}
            data-testid="join-submit"
          >
            {busy ? say.say("auth.join.checking") : say.say("auth.join.enter")}
          </button>
          {pending !== null ? (
            <Link href="/api/auth/signout" className="text-xs text-muted underline underline-offset-4">
              {say.say("auth.join.notYou")}
            </Link>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
