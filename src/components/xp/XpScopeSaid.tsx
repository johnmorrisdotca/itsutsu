import Link from "next/link";

import type { currentSpeaker } from "@/lib/i18n/currentLocale";
import { RECORD_SCOPES, type RecordScope } from "@/lib/rating/recordScope";

/**
 * What the board is counting, said in words under the chips — and under Itsutsu
 * only, the way back to Everywhere, since "every page a link lands on says what
 * it was narrowed to, and lets it be taken off."
 */
export function XpScopeSaid({ scope, say, href }: { scope: RecordScope; say: Awaited<ReturnType<typeof currentSpeaker>>; href: string }) {
  if (scope === RECORD_SCOPES.here) {
    return (
      <p className="text-xs text-muted" data-testid="xp-scope-said" data-scope={scope}>
        {say.say("xp.scope.here")}{" "}
        <Link href={href} className="underline underline-offset-4" data-testid="xp-count-everywhere">
          {say.say("xp.scope.countEverywhere")}
        </Link>
      </p>
    );
  }
  return (
    <p className="text-xs text-muted" data-testid="xp-scope-said" data-scope={scope}>
      {say.say("xp.scope.everywhere")}
    </p>
  );
}
