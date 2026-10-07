import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { OFFERED_LOCALES } from "./dictionaries";
import {
  LANG_CHOSEN_COOKIE,
  LANG_CHOSEN_FOR_SECONDS,
  LANG_COOKIE,
  LANG_PARAM,
  LANG_REMEMBER_FOR_SECONDS,
} from "./i18n.constants";
import { readLocale } from "./locale";

/**
 * A language asked for in the address, remembered and then taken back out of
 * it. Null when the address says nothing about language, which is almost
 * every request.
 *
 * Called by the gate (`src/proxy.ts`), in a file of its own so the gate stays
 * under the size limit with this beside it: a Server Component can READ a cookie
 * while it renders and cannot SET one, and the gate is the only thing on the way
 * in that can.
 *
 * It redirects rather than carrying on, and both halves of that are
 * deliberate. Setting the cookie and carrying on would render *this* page in
 * the old language — the cookie only reaches the request after it — so the
 * page you changed the language on would be the one page that did not change,
 * which reads as broken. And the language is not part of what a page is: an
 * address with `?lang=es` stuck to it would get copied, shared and bookmarked,
 * and would then overrule the language of whoever opened it.
 *
 * It cannot turn a yes into a no. It only ever runs after the gate has
 * already said yes, the redirect goes to the same path with one parameter
 * removed, and that request is decided again from scratch exactly as it would
 * have been. GET only, so a form post is never answered with a redirect.
 *
 * It sets two cookies rather than one: the language, kept for a year, and a
 * minute-long marker saying it was chosen just now. Neither is read here. A
 * member's language lives on their account, and the marker is the only thing
 * the gate can offer towards that without asking the database who is asking —
 * which it must not. See `LANG_CHOSEN_COOKIE`.
 */
export function rememberLanguage(request: NextRequest): NextResponse | null {
  if (request.method !== "GET") return null;
  const asked = readLocale(request.nextUrl.searchParams.get(LANG_PARAM));
  if (asked === null || !OFFERED_LOCALES.includes(asked)) return null;

  const clean = new URL(request.url);
  clean.searchParams.delete(LANG_PARAM);
  const response = NextResponse.redirect(clean);
  response.cookies.set({
    name: LANG_COOKIE,
    value: asked,
    // Every page: a language is not about one page.
    path: "/",
    maxAge: LANG_REMEMBER_FOR_SECONDS,
    sameSite: "lax",
    httpOnly: true,
  });
  /*
   * And a second cookie whose only meaning is "this was chosen just now,
   * here", so that the render on the other side of the redirect can keep the
   * choice on the member's account — see `LANG_CHOSEN_COOKIE`, which says why
   * the cookie above cannot answer that question, and `memberLanguage.ts`,
   * which does the keeping.
   *
   * THIS FILE LEARNS NOTHING. It still does not ask who is signed in, still
   * reads no database, and still decides nothing: the value is the language
   * already being written on the line above, and every branch of the gate
   * arrives here exactly as it did before. A request that was going to be
   * redirected is redirected, with one more `Set-Cookie` on it. Whether the
   * marker means anything is decided later, by something that does know who
   * is asking and is allowed to write.
   */
  response.cookies.set({
    name: LANG_CHOSEN_COOKIE,
    value: asked,
    path: "/",
    maxAge: LANG_CHOSEN_FOR_SECONDS,
    sameSite: "lax",
    httpOnly: true,
  });
  return response;
}
