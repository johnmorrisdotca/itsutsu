import { JoinForm } from "@/components/auth/JoinForm";

export const metadata = {
  title: "Join · Gomoku",
  robots: { index: false, follow: false },
};

/** The only page reachable without a session. */
export default async function JoinPage({ searchParams }: PageProps<"/join">) {
  const params = await searchParams;
  const next = typeof params.next === "string" && params.next.startsWith("/")
    ? params.next
    : "/";

  return (
    <div className="paper flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
      <header className="flex flex-col items-center gap-2">
        <p className="font-mincho text-4xl font-bold">五目並べ</p>
        <p className="text-sm tracking-[0.2em] text-muted uppercase">Gomoku</p>
      </header>
      <JoinForm next={next} />
    </div>
  );
}
