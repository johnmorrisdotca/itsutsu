import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Zen_Old_Mincho } from "next/font/google";
import "./globals.css";

import { JaLocale } from "@/components/i18n/JaLocale";
import { APP_COLOURS } from "@/lib/app/app.constants";
import { appleStartupImages } from "@/lib/app/appleLaunch";
import { BARE_HEAD_SCRIPT } from "@/components/layout/bare";
/*
 * WHAT THE HEADER READS, NAMED HERE SO THE BUILD KEEPS ONE COPY OF IT. Nothing
 * is drawn or run by this line. The build shares what the root layout reaches
 * with every page, and copies what only the pages reach once for each group it
 * splits them into: eleven copies of the header's reads, and of the validation
 * library they parse with, 1.4 MB of the function every page is built into.
 * Every page draws the header, so its reads belong to the layout's share, and
 * so does the header itself: the pages import `SiteHeader` one by one, so the
 * build copied it, with the account menu and the word list the menu reads, once
 * for each group of pages, 0.7 MB more of the function (measured 2026-10-05).
 * `pageFunction.coverage.test.ts` holds the line; `pnpm functions:size` is
 * what measures it.
 */
import "@/lib/history/headerCounts";
import "@/components/layout/SiteHeader";
import { TestModeBanner } from "@/components/layout/TestModeBanner";
import { OfflineKeeper } from "@/components/offline/OfflineKeeper";
import { currentLocale, currentSpeaker } from "@/lib/i18n/currentLocale";
import { SITE_NAME } from "@/lib/i18n/siteName";
import { jaText } from "@/lib/i18n/jaText";
import { LOCALES } from "@/lib/i18n/i18n.constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * A mincho face for the Japanese display text. Mincho is what a go or renju
 * board's own lettering uses, and it carries the kanji at large sizes far
 * better than a sans fallback does.
 *
 * NOT PRELOADED. Zen Old Mincho is cut into about a hundred slices by the
 * characters they hold, and the build treats every slice as a preload: with the
 * default, each page named 74 font files (1.7 MB) in its head whatever the page
 * said, and the build's font manifest listed 122 files for each of 68 pages,
 * 1 MB of the function every page is built into. The browser fetches the slice
 * a page's text needs when it draws that text, which is all a preload was
 * ever for here. `pageFunction.coverage.test.ts` holds this.
 */
const mincho = Zen_Old_Mincho({
  variable: "--font-mincho",
  weight: ["400", "700"],
  subsets: ["latin"],
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const say = await currentSpeaker();
  return {
    title: { default: "Itsutsu 五つ", template: "%s · Itsutsu" },
    description: say.say("chrome.siteDescription", { site: SITE_NAME }),
    applicationName: "Itsutsu",
    /*
     * Opened from an iPhone's home screen. iOS reads these rather than the
     * manifest for the name under the icon, the status bar and the launch
     * screen. The status bar is "default" — dark text on the page's paper, and
     * the page starts below it — rather than translucent, which would put the
     * header under the clock and needs every page's top padded for the notch.
     * The launch images are the paper in both themes, one per screen size.
     */
    appleWebApp: {
      capable: true,
      title: "Itsutsu",
      statusBarStyle: "default",
      startupImage: appleStartupImages(),
    },
    // A board full of coordinates is not a list of telephone numbers.
    formatDetection: { telephone: false },
    // Older iOS reads only the Apple spelling of "open without the browser".
    other: { "apple-mobile-web-app-capable": "yes" },
  };
}

/**
 * The browser's own chrome — Android's status bar, Safari's toolbar tint —
 * painted the page's paper, light or dark as the page itself is.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: APP_COLOURS.light },
    { media: "(prefers-color-scheme: dark)", color: APP_COLOURS.dark },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  /*
   * The language the document is actually in, not the language it was first
   * written in. A screen reader picks its voice from this attribute and a
   * browser decides from it whether to offer a translation, so a page of
   * Spanish still claiming `lang="en"` is read aloud in the wrong accent and
   * offered a translation into the language it is already in.
   */
  const locale = await currentLocale();
  return (
    <html
      lang={LOCALES[locale].tag}
      /*
       * The script below sets data-bare on this element before React arrives,
       * which is the whole point of it — so the server's markup and the
       * client's disagree here by design, and React is told not to report it.
       * It covers this element's attributes only, not the page inside.
       */
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${mincho.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/*
          Read before anything is drawn, so a reader who asked for the board
          alone does not watch the masthead appear and vanish on every page.
          It runs ahead of the rest of the body, which is the whole point of
          it being here rather than in a component.
        */}
        <script dangerouslySetInnerHTML={{ __html: BARE_HEAD_SCRIPT }} />
        {/*
          The same locale the server just rendered with, handed to the half of
          the site React draws in the browser. One reading of the request, used
          twice, so the two cannot disagree at hydration. Every reader
          is drawn inside `JaLocale`, one component whatever the language so that
          changing it updates the page and never rebuilds it; a reader of
          Japanese is handed the Japanese as a prop, which is the only way a
          browser gets it, and an English reader is never sent a word of it.
        */}
        <TestModeBanner />
        {/* The offline keeper, started on every page, and the line that says so when there is no connection. */}
        <OfflineKeeper />
        <JaLocale locale={locale} text={locale === "ja" ? jaText() : undefined}>
          {children}
        </JaLocale>
      </body>
    </html>
  );
}
