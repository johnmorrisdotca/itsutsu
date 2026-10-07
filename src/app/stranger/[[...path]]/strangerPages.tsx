import type { Metadata } from "next";
import type { ReactNode } from "react";

import { JoinDoor } from "@/components/auth/JoinDoor";
import { strangerRouteFor } from "@/lib/stranger/strangerRoutes";
import { withTabFromPath } from "@/lib/ui/tabs";

import AboutPage, { generateMetadata as aboutMetadata } from "@/app/about/page";
import DicePage, { generateMetadata as diceMetadata } from "@/app/dice/page";
import GamesPage, { generateMetadata as gamesMetadata } from "@/app/games/page";
import GamePage, { generateMetadata as gameMetadata } from "@/app/games/[slug]/page";
import BackgroundPage, { generateMetadata as backgroundMetadata } from "@/app/games/[slug]/background/page";
import GameFamilyPage, { generateMetadata as familyMetadata } from "@/app/games/[slug]/family/page";
import RulesPage, { generateMetadata as rulesMetadata } from "@/app/games/[slug]/rules/page";
import { generateMetadata as joinMetadata } from "@/app/join/page";
import Home from "@/app/page";
import CubeGuidePage, { generateMetadata as cubeMetadata } from "@/app/learn/cube/page";
import GuidePage, { generateMetadata as guideMetadata } from "@/app/learn/[slug]/page";
import LearnIndexPage, { generateMetadata as learnMetadata } from "@/app/learn/page";
import PrivacyPage, { generateMetadata as privacyMetadata } from "@/app/privacy/page";
import TermsPage, { generateMetadata as termsMetadata } from "@/app/terms/page";
import ThanksPage, { generateMetadata as thanksMetadata } from "@/app/thanks/page";

/**
 * THE OPEN PAGES, DRAWN FOR NOBODY IN PARTICULAR.
 *
 * Each address `strangerRouteFor` answers is the same page the live route
 * draws, called the way the tab routes call their bodies (`app/games/list`):
 * the same function, handed the same props the request would have made.
 * Nothing is copied, so the kept copy cannot drift from the page. What differs
 * is only where it runs — in a route drawn ahead of time, where a cookie or a
 * header reads as empty, which is exactly what a reader with no session sends
 * (`app/stranger/[[...path]]/page.tsx` says why that is safe).
 */

type Drawn = { page: () => Promise<ReactNode> | ReactNode; metadata?: () => Promise<Metadata> | Metadata };

/** The props a live page is handed, made by hand: its address's own parts, and no query. */
const none = Promise.resolve({});
// The page functions are typed against their own route's props; what they read of them is what is made here.
const props = <Props,>(value: { params?: Record<string, string>; searchParams?: Promise<Record<string, string | string[] | undefined>> }): Props =>
  ({ params: Promise.resolve(value.params ?? {}), searchParams: value.searchParams ?? none }) as Props;

/** What a kept address draws, or null for one that is no page (the route says not found). */
export function strangerPageFor(segments: readonly string[]): Drawn | null {
  const pathname = `/${segments.join("/")}`;
  if (strangerRouteFor(pathname) === null) return null;
  const [first, second, third] = segments;
  const one = (slug: string | undefined) => props<never>({ params: { slug: slug ?? "" } });

  if (first === undefined) return { page: () => Home() };
  if (first === "join") return { page: () => <JoinDoor searchParams={{}} kept />, metadata: joinMetadata };
  if (first === "privacy") return { page: () => PrivacyPage(), metadata: privacyMetadata };
  if (first === "terms") return { page: () => TermsPage(), metadata: termsMetadata };
  if (first === "thanks") return { page: () => ThanksPage(), metadata: thanksMetadata };
  if (first === "dice") return { page: () => DicePage(), metadata: diceMetadata };
  if (first === "about") {
    const asked = second === undefined ? none : withTabFromPath(second, none);
    return { page: () => AboutPage(props({ searchParams: asked })), metadata: aboutMetadata };
  }
  if (first === "learn") {
    if (second === undefined) return { page: () => LearnIndexPage(), metadata: learnMetadata };
    if (second === "cube") return { page: () => CubeGuidePage(), metadata: cubeMetadata };
    return { page: () => GuidePage(one(second)), metadata: () => guideMetadata() };
  }
  if (first === "games") {
    if (second === undefined || second === "cards" || second === "list") {
      const asked = second === undefined ? none : withTabFromPath(second, none);
      return { page: () => GamesPage(props({ searchParams: asked })), metadata: gamesMetadata };
    }
    if (third === undefined) return { page: () => GamePage(one(second)), metadata: () => gameMetadata(one(second)) };
    if (third === "rules") return { page: () => RulesPage(one(second)), metadata: () => rulesMetadata(one(second)) };
    if (third === "family") return { page: () => GameFamilyPage(one(second)), metadata: () => familyMetadata(one(second)) };
    if (third === "background") return { page: () => BackgroundPage(one(second)), metadata: () => backgroundMetadata(one(second)) };
  }
  return null;
}
