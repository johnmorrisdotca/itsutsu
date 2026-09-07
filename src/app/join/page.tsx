import { JoinForm } from "@/components/auth/JoinForm";
import { BrandAvatar, BrandWordmark } from "@/components/layout/BrandMarks";
import { safeDestination } from "@/lib/auth/redirect";
import { isGoogleAuthConfigured } from "@/lib/auth/google";

export const metadata = {
  title: "Join",
  robots: { index: false, follow: false },
};

/** The only page reachable without a session. */
export default async function JoinPage({ searchParams }: PageProps<"/join">) {
  const params = await searchParams;
  const next = safeDestination(
    typeof params.next === "string" ? params.next : null,
  );

  return (
    <div className="paper flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
      <header className="flex flex-col items-center gap-4">
        <BrandAvatar className="size-24" />
        <BrandWordmark className="h-8 w-auto" />
      </header>
      <JoinForm next={next} googleReady={isGoogleAuthConfigured()} />
    </div>
  );
}
