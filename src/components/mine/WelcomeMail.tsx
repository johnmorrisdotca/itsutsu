"use client";

import { useState } from "react";

import { MAIL_KINDS, type MailKindsWanted, type StopKind } from "@/lib/mail/mailStop";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { MailChoices } from "./MailChoices";

/**
 * THE EMAIL CHOICE, ASKED AS SOMEBODY JOINS. John, 2026-09-16: "options to NOT
 * receive email too. on signup and in profile". The welcome asks one question
 * — a name — so this sits under it rather than in its way, already set to the
 * defaults, and each switch is kept the moment it is pressed: one write a
 * press, nothing to save and nothing lost by going straight to a game.
 *
 * Only for a member with an address. An account made by an invite code has
 * none to write to, and a child is never emailed (childRules.ts); the page
 * leaves this out for both.
 */
export function WelcomeMail({ all: initialAll, kinds: initialKinds, sending }: { all: boolean; kinds: MailKindsWanted; sending: boolean }) {
  const [all, setAll] = useState(initialAll);
  const [kinds, setKinds] = useState(initialKinds);

  const keep = (body: Record<string, unknown>) =>
    fetch("/api/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => undefined);

  return (
    <div className="flex max-w-[29rem] flex-col gap-2" data-testid="welcome-mail" {...readyMark(useHydrated())}>
      <p className="text-sm text-ink-soft">And what should we email you about? Change it any time in Settings.</p>
      <MailChoices
        all={all}
        kinds={kinds}
        sending={sending}
        onAll={(next) => {
          setAll(next);
          void keep({ emailNotify: next });
        }}
        onKind={(kind: StopKind, next) => {
          setKinds((current) => ({ ...current, [kind]: next }));
          void keep({ preferences: { [MAIL_KINDS[kind].preference]: next ? "on" : "off" } });
        }}
      />
    </div>
  );
}
