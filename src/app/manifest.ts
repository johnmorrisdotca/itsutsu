import type { MetadataRoute } from "next";

/**
 * The web app manifest, for a phone that adds the site to its home screen.
 * Players arrive by QR code on their phones, so this is the door they use
 * more than a desktop tab. Standalone: a game wants the whole screen.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Itsutsu 五つ",
    short_name: "Itsutsu",
    description: "Five in a row, and the games that grew from it.",
    start_url: "/games",
    display: "standalone",
    background_color: "#f7f5f1",
    theme_color: "#22231f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
