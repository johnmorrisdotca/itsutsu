"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { PLAY_BUTTON } from "@/components/ui/ui.constants";
import type { Locale } from "@/lib/i18n/i18n.types";

/**
 * THE PLAY BUTTON'S ROOM AND WORDS, not yet a link, while a table's own Play button is loaded in the browser (the
 * `loading` of each `*Client.tsx`): the browser has not said whether a game is going, so the page keeps the button
 * where it will be and reads the word in the reader's language, as the button that replaces it does.
 */
export function PlayLoading({ label }: { label: (locale: Locale) => string }) {
  const say = useSpeaker();
  return (
    <div className="flex flex-col" data-testid="party-kind-offer" data-ready="false">
      <span className={PLAY_BUTTON} aria-hidden="true">
        {label(say.locale)}
      </span>
    </div>
  );
}
