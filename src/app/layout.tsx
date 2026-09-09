import type { Metadata } from "next";
import { Geist, Geist_Mono, Zen_Old_Mincho } from "next/font/google";
import "./globals.css";

import { BARE_HEAD_SCRIPT } from "@/components/layout/bare";

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
 */
const mincho = Zen_Old_Mincho({
  variable: "--font-mincho",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Itsutsu 五つ", template: "%s · Itsutsu" },
  description:
    "Itsutsu: gomoku, renju, connect6 and the family of line-and-grid games. Two players, one browser — or two devices, a code apart.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
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
        {children}
      </body>
    </html>
  );
}
