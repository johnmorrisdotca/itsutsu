import type { MetadataRoute } from "next";

/**
 * What a crawler may read.
 *
 * The site is invite-gated: `proxy.ts` sends an anonymous request for
 * anything but the front page, the door, the documentation and the artwork
 * to `/join`. A crawler holds no cookie, so without this file it walks the
 * whole site, is redirected at every step, and each redirect is a middleware
 * invocation we pay for to say "no". Naming the open pages, and refusing the
 * rest, means it asks only for what it can actually have.
 *
 * The list is the readable half of what `isOpenPath` in `src/proxy.ts` lets
 * through — the pages that render nothing anybody wrote and are worth finding
 * from a search: the games, the guides, and what the site is. `/join` is left
 * out deliberately: a door is not a page to arrive at from a search result.
 *
 * IT MUST NOT NAME A PATH THE GATE SHUTS, and it drifted the moment the
 * addresses moved: this allowed `/rules`, which stopped existing when a game
 * became one address with its facets under it, and did not allow `/games`,
 * which is exactly what that change OPENED. So the pages deliberately made
 * readable were the ones crawlers were told to skip, while a dead path was
 * advertised. `proxy.test.ts` checked only that this file refuses by default,
 * which is why nothing said so; it now checks that everything allowed here is
 * a path the gate would really let through.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // `/games` covers the catalogue and every game beneath it: the game, its
      // rules, its family and its background are all open reading.
      allow: ["/$", "/about", "/games", "/learn", "/art/", "/brand/"],
      disallow: "/",
    },
  };
}
