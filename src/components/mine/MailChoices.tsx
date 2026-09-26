"use client";

import { Toggle } from "@/components/ui/Controls";
import { MAIL_KINDS, STOP_KIND_LIST, type MailKindsWanted, type StopKind } from "@/lib/mail/mailStop";

/**
 * WHAT A MEMBER HEARS ABOUT BY EMAIL: one switch for all of it, and a row a
 * kind under it with a plain sentence saying what it sends and when
 * (`MAIL_KINDS`). John, 2026-09-16: "options to NOT receive email too. on
 * signup and in profile" — so the same rows are in Settings and in the
 * welcome, and each email's footer stops its own kind without signing in.
 *
 * The kinds sit under the switch for all of it and grey out while that is off,
 * because off there means the site never writes, whatever a row says.
 */
export function MailChoices({
  all,
  kinds,
  onAll,
  onKind,
  sending,
}: {
  all: boolean;
  kinds: MailKindsWanted;
  onAll: (next: boolean) => void;
  onKind: (kind: StopKind, next: boolean) => void;
  /** Whether game emails go at all yet (`NOTICES.sending`): until they do, the rows say they are kept for then. */
  sending: boolean;
}) {
  return (
    <div className="flex flex-col gap-3" data-testid="mail-choices">
      <div data-testid="mail-all" data-on={all}>
        <Toggle label="Email from Itsutsu" checked={all} onChange={onAll} hint="Off, and the site never writes to you, whatever the rows below say." />
      </div>
      <div className="flex flex-col gap-3 border-l border-rule pl-3">
        {STOP_KIND_LIST.map((kind) => (
          <div key={kind} data-testid={`mail-kind-${kind}`} data-on={kinds[kind]}>
            <Toggle label={MAIL_KINDS[kind].label} checked={kinds[kind]} onChange={(next) => onKind(kind, next)} hint={MAIL_KINDS[kind].hint} disabled={!all} />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted">
        {sending ? "" : "Emails about games are not switched on yet; these choices are kept for when they are. "}
        Every email says how to stop getting it, without signing in.
      </p>
    </div>
  );
}
