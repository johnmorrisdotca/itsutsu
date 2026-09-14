"use client";

import { useEffect, useRef } from "react";

import { keptHref } from "./setUpKept";
import type { SetUpParam } from "./setUp.types";

/**
 * WRITES THE SET-UP SCREEN'S CHOICES INTO ITS ADDRESS, WITHOUT ASKING THE SERVER.
 *
 * WHY THE NATIVE `history.replaceState`, AND NOT `router.replace`. The page is
 * dynamic, so `router.replace` to a new query is a navigation: a server render of
 * the whole set-up page for every tile pressed, and a fresh `initial` arriving
 * under a form somebody is in the middle of filling in. A choice on a form is not
 * a reason to ask the server anything.
 *
 * Next folds a native `replaceState` into its router as the router's own URL
 * (node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md,
 * "Native History API"), so `useSearchParams`, a later `router.push` and the
 * browser's Back all see the new address. 8104573b is the warning about the same
 * call: there it moved a match from /match/<id> to /match/<id>/<n> — a DIFFERENT
 * ROUTE — and a later `router.refresh()` then asked for one route with the tree
 * of another and fell back to a document load. Here the path never changes, only
 * the query of the same route, so a refresh (none is made on this screen) would
 * ask for the route the tree already is. `e2e/set-up-keeps-choices.spec.ts`
 * counts the RSC requests and marks the document across every press.
 *
 * REPLACE, NOT PUSH. Every press a new history entry would make Back walk through
 * each tile somebody tried; Back should leave the screen, landing wherever they
 * came from, and returning to it finds every choice in place.
 *
 * NOTHING IS WRITTEN UNTIL SOMETHING CHANGES. The address a reader arrived at is
 * left exactly as it was until they choose something: rewriting it on arrival
 * would be a history write nobody asked for, and would drop from the address the
 * values the screen has just told them it could not use.
 */
export function useKeptAddress(params: readonly SetUpParam[]): void {
  const key = new URLSearchParams(params.map(([name, value]) => [name, value])).toString();
  const opened = useRef<string | null>(null);
  const touched = useRef(false);

  useEffect(() => {
    if (opened.current === null) {
      opened.current = key;
      return;
    }
    if (key !== opened.current) touched.current = true;
    if (!touched.current) return;
    const { pathname, search } = window.location;
    const next = keptHref(pathname, search, [...new URLSearchParams(key).entries()]);
    if (next !== `${pathname}${search}`) window.history.replaceState(null, "", next);
  }, [key]);
}
