"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { inReadersLanguage } from "@/lib/rating/guestName";

/** A printed name, with the guest placeholder said in the reader's language (`guestName.ts`). */
export function ShownName({ name }: { name: string }) {
  const say = useSpeaker();
  return <>{inReadersLanguage(name, say)}</>;
}
