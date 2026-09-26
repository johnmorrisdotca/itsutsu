import NextLink from "next/link";
import type { ComponentProps } from "react";

/**
 * THE SITE'S LINK: Next's, with prefetching OFF unless a link asks for it.
 *
 * A production page prefetches every `<Link>` that scrolls into view, and
 * every page here is dynamic, so each prefetch is a request to the server —
 * through the gate (`proxy.ts`) and a function — for a route tree nobody may
 * ever open. The header and footer alone are about twenty links, so every
 * page view on the live site paid for about twenty requests whether or not
 * anybody clicked (found 2026-09-26 when the browser suite moved to the
 * production build and counted them). John's rule: no server work nobody
 * asked for. A click still navigates on the client; it asks the server then,
 * once, for the page that was chosen.
 *
 * Every file imports this rather than `next/link` (an ESLint rule refuses the
 * direct import), so a new link cannot bring prefetching back by default. A
 * link that is worth it passes `prefetch` itself, and says why beside it.
 */
export default function Link({ prefetch = false, ...rest }: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={prefetch} {...rest} />;
}
