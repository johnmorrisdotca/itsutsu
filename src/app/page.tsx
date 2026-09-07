import { GameView } from "@/components/game/GameView";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center px-4 py-8 font-sans sm:px-8">
      <main className="flex w-full max-w-5xl flex-col gap-8">
        <header className="flex items-baseline gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">五目並べ</h1>
          <p className="text-lg text-zinc-500">Gomoku</p>
        </header>
        <GameView />
        <footer className="text-sm text-zinc-500">
          Two players take turns placing stones on the intersections. Black
          plays first. The first to line up five stones in a row, in any
          direction, wins.
        </footer>
      </main>
    </div>
  );
}
