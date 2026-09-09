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
 * The list is the readable half of `OPEN_PATHS` in `src/proxy.ts` — the
 * pages that render nothing anybody wrote and are worth finding from a
 * search: the rules, the guides, and what the site is. `/join` is left out
 * deliberately: a door is not a page to arrive at from a search result.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/$", "/about", "/rules", "/learn", "/art/", "/brand/"],
      disallow: "/",
    },
  };
}
