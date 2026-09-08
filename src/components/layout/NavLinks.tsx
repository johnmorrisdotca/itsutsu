"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { YourTurnBadge } from "@/components/mine/YourTurnBadge";

export const NAV = [
  { href: "/games", label: "Play", kanji: "遊ぶ" },
  { href: "/rules", label: "Rules" },
  { href: "/learn", label: "Learn" },
  { href: "/players", label: "Players" },
  { href: "/backlog", label: "Backlog", kanji: "積み残し" },
  { href: "/about", label: "About" },
] as const;

/** The site's sections, with the one the reader is in underlined. */
export function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {NAV.map((item) => {
        const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={`whitespace-nowrap underline-offset-4 hover:underline ${
              current ? "font-semibold underline decoration-moss decoration-2" : ""
            }`}
          >
            {item.label}
            {"kanji" in item ? (
              <>
                {" "}
                <span className="font-mincho text-muted">{item.kanji}</span>
              </>
            ) : null}
            {item.href === "/games" ? <YourTurnBadge /> : null}
          </Link>
        );
      })}
    </>
  );
}
