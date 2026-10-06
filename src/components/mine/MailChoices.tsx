"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { Toggle } from "@/components/ui/Controls";
import { SITE_NAME } from "@/lib/i18n/siteName";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";
import { STOP_KIND_LIST, type MailKindsWanted, type StopKind } from "@/lib/mail/mailStop";

/** The words of each kind's switch: the kinds are the mail module's, their words are the phrase table's. */
const KIND_WORDS: Record<StopKind, { label: PhraseKey; hint: PhraseKey }> = {
  "your-turn": { label: "mine.mailYourTurn", hint: "mine.mailYourTurnHint" },
  "game-over": { label: "mine.mailGameOver", hint: "mine.mailGameOverHint" },
};

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
  /** Whether game emails go at all yet (`gameEmailsOn`, the operator's switch): until they do, the rows say they are kept for then. */
  sending: boolean;
}) {
  const say = useSpeaker();
  return (
    <div className="flex flex-col gap-3" data-testid="mail-choices">
      <div data-testid="mail-all" data-on={all}>
        <Toggle label={say.say("mine.mailAll", { site: SITE_NAME })} checked={all} onChange={onAll} hint={say.say("mine.mailAllHint")} />
      </div>
      <div className="flex flex-col gap-3 border-l border-rule pl-3">
        {STOP_KIND_LIST.map((kind) => (
          <div key={kind} data-testid={`mail-kind-${kind}`} data-on={kinds[kind]}>
            <Toggle label={say.say(KIND_WORDS[kind].label)} checked={kinds[kind]} onChange={(next) => onKind(kind, next)} hint={say.say(KIND_WORDS[kind].hint)} disabled={!all} />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted">
        {sending ? "" : `${say.say("mine.mailNotYet")} `}
        {say.say("mine.mailStop")}
      </p>
    </div>
  );
}
