import Link from "next/link";

/** The masthead: the game's Japanese name at display size, then the navigation. */
export function SiteHeader() {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-5">
      <div className="flex items-baseline gap-3">
        <Link
          href="/"
          className="font-mincho text-4xl leading-none font-bold tracking-tight sm:text-5xl"
        >
          五目並べ
        </Link>
        <p className="text-sm tracking-[0.2em] text-muted uppercase">Gomoku</p>
      </div>
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/lobby" className="hover:underline underline-offset-4">
          Lobby <span className="font-mincho text-muted">広間</span>
        </Link>
        <Link href="/" className="hover:underline underline-offset-4">
          Play
        </Link>
        <Link href="/rules" className="hover:underline underline-offset-4">
          Rules <span className="font-mincho text-muted">規則</span>
        </Link>
        <Link href="/learn" className="hover:underline underline-offset-4">
          Learn <span className="font-mincho text-muted">学び</span>
        </Link>
        <Link href="/players" className="hover:underline underline-offset-4">
          Players <span className="font-mincho text-muted">対局者</span>
        </Link>
        <Link href="/history" className="hover:underline underline-offset-4">
          Record <span className="font-mincho text-muted">棋譜</span>
        </Link>
      </nav>
    </header>
  );
}
