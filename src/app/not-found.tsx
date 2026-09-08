import Link from "next/link";

import { BrandAvatar } from "@/components/layout/BrandMarks";

/**
 * Nothing at this address. A wrong game slug, a match that was never played,
 * a seat link that fits no seat — they all land here, and none of them is
 * told which it was.
 */
export default function NotFound() {
  return (
    <div className="paper flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <BrandAvatar className="size-20 opacity-90" />
      <div className="flex flex-col gap-2">
        <h1 className="font-mincho text-3xl font-bold">
          何もない <span className="text-base font-normal text-muted">nothing here</span>
        </h1>
        <p className="max-w-sm text-sm text-muted">
          There is no page at this address. It may have been a game that does not exist, or a
          link that was not copied whole.
        </p>
      </div>
      <nav className="flex flex-wrap justify-center gap-4 text-sm">
        <Link href="/games" className="underline underline-offset-4">
          The games
        </Link>
        <Link href="/" className="underline underline-offset-4">
          The board
        </Link>
        <Link href="/history" className="underline underline-offset-4">
          The record
        </Link>
      </nav>
    </div>
  );
}
