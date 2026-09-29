import type { ReactNode } from "react";

import { currentReader } from "@/lib/auth/currentReader";
import { keptScalesFrom } from "@/lib/preferences/boardScale";
import { cleanPreferences } from "@/lib/preferences/preferences";
import { storedPreferencesFor } from "@/lib/preferences/memberPreferences";

import { BoardScale } from "./BoardScale";

/**
 * THE PLAY ON A BOARD PAGE, AT THE SIZE THIS READER KEEPS FOR THIS KIND OF
 * SCREEN (`BoardScale`), with its choices read on the server.
 *
 * No read of its own: the reader and their preferences both ride the member
 * row the page has already fetched to say who is here, cached for the request
 * (`currentReader`, `storedPreferencesFor`). Read through the cleaned column
 * rather than the filled-in one, so a kind of screen never chosen for is
 * absent — "never chose" — rather than a Regular nobody picked.
 *
 * Every page that lays out a board to play wraps its play in this; the pages
 * are held to it by `boardScale.coverage.test.ts`.
 */
export async function BoardScaled({
  className,
  widthReason,
  children,
}: {
  /** The play's own column at Regular, as the page always drew it. */
  className?: string;
  /** Why that column is narrower than the page, where it is. */
  widthReason?: string;
  children: ReactNode;
}) {
  const [reader, stored] = await Promise.all([currentReader(), storedPreferencesFor()]);
  return (
    <BoardScale kept={reader.hasAccount ? keptScalesFrom(cleanPreferences(stored)) : {}} saves={reader.hasAccount} className={className} widthReason={widthReason}>
      {children}
    </BoardScale>
  );
}
