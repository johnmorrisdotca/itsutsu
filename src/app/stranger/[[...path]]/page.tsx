import { notFound } from "next/navigation";

import { strangerPageFor } from "./strangerPages";

/**
 * THE OPEN PAGES, KEPT FOR A READER WITH NO SESSION.
 *
 * Reached only by the gate's rewrite (`src/lib/stranger/strangerRewrite.ts`):
 * a request with no session, in the default language, for one of the open
 * pages `strangerRouteFor` names, is answered from this route instead of from
 * the page's own. It is drawn the first time somebody asks and again at most
 * once an hour after that (`revalidate`), so a crawler's visit and a passer-by's
 * run no render and no query.
 *
 * `force-static` is what makes that a copy of the page a stranger would have
 * had, rather than a different page. Inside a route drawn ahead of time a
 * cookie and a header read as empty, so `currentSession()` says nobody and
 * `currentLocale()` says English, which are exactly the two things a request
 * the gate sends here carries. The members' pages are untouched: the gate sends
 * here only a request with no session cookie, and everything else — a member,
 * the operator, somebody with Google's cookies, a reader of Japanese, an
 * address that reads its query — is answered live, as it always was.
 *
 * WHAT IS NOT DRAWN AT BUILD. `generateStaticParams` names no address, so no
 * page is drawn while the site is built: several read the database, and a read
 * at build time asks a question only a running site can answer (it failed a
 * whole deploy once). Each is drawn on its first request instead.
 */
export const dynamic = "force-static";
export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/stranger/[[...path]]">) {
  const { path = [] } = await params;
  return (await strangerPageFor(path)?.metadata?.()) ?? {};
}

export default async function StrangerPage({ params }: PageProps<"/stranger/[[...path]]">) {
  const { path = [] } = await params;
  const drawn = strangerPageFor(path);
  if (drawn === null) notFound();
  return drawn.page();
}
