"use client";

import type { ReactNode } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * A figure counted on another site, which has no game here to open
 * (`GameCount` with `here={false}`): the number, and a note saying why it is
 * not a link, in the reader's language. A component of its own because
 * `GameCount` is read by the server as well (`gamesHref`) and cannot hold a hook.
 */
export function ElsewhereCount({ count, className, testId }: { count: ReactNode; className: string; testId?: string }) {
  const say = useSpeaker();
  return (
    <span className={className} data-testid={testId} title={say.say("gamepages.countElsewhere")}>
      {count}
    </span>
  );
}
