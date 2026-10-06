import Link from "@/components/ui/Link";

import { BrandAvatar, BrandStones } from "@/components/layout/BrandMarks";
import { currentSpeaker } from "@/lib/i18n/currentLocale";

/**
 * Nothing at this address. A wrong game slug, a match that was never played,
 * a seat link that fits no seat — they all land here, and none of them is
 * told which it was.
 */
export default async function NotFound() {
  const say = await currentSpeaker();
  return (
    <div className="paper flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <BrandAvatar className="size-20 opacity-90" />
      <div className="flex flex-col gap-2">
        <h1 className="font-mincho text-3xl font-bold">
          何もない <span className="text-base font-normal text-muted">{say.say("chrome.notFound.title")}</span>
        </h1>
        <p className="max-w-sm text-sm text-muted" data-width-reason="a short notice centred on a page with no frame">
          {say.say("chrome.notFound.body")}
        </p>
      </div>
      <BrandStones className="opacity-70" />
      <nav className="flex flex-wrap justify-center gap-4 text-sm">
        <Link href="/games" className="underline underline-offset-4">
          {say.say("nav.games")}
        </Link>
        <Link href="/" className="underline underline-offset-4">
          {say.say("chrome.notFound.home")}
        </Link>
        <Link href="/history" className="underline underline-offset-4">
          {say.say("nav.record")}
        </Link>
      </nav>
    </div>
  );
}
