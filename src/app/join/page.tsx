import { JoinDoor } from "@/components/auth/JoinDoor";
import { currentSpeaker } from "@/lib/i18n/currentLocale";

export async function generateMetadata() {
  return { title: (await currentSpeaker()).say("auth.join.title"), robots: { index: false, follow: false } };
}

/** The door: see `JoinDoor`, which is the whole of it, here and in the copy a stranger is answered from. */
export default async function JoinPage({ searchParams }: PageProps<"/join">) {
  return <JoinDoor searchParams={await searchParams} />;
}
