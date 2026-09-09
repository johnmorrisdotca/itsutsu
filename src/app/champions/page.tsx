import Link from "next/link";

import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PlayerLink, TierMark } from "@/components/players/Standings";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { GAME_FAMILIES } from "@/lib/gomoku/families";
import { championsPath } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { fetchChampions, type VariantChampion } from "@/lib/rating/variantRatings";

export const metadata = { title: "Champions" };

// The standings are read from the database on every request, never at build time.
export const dynamic = "force-dynamic";

const HEAD_CLASS = "text-left text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase";

/** One game's line: its name, and the player at the top of its ladder. */
function ChampionRow({ variant, champion }: { variant: string; champion: VariantChampion | undefined }) {
  const copy = RULE_VARIANT_DISPLAY[variant as keyof typeof RULE_VARIANT_DISPLAY];
  return (
    <tr className="border-t border-rule" data-testid={`champion-row-${variant}`}>
      <td className="py-1.5 pr-3">
        <Link href={championsPath(variant)} className="font-medium underline-offset-2 hover:underline">
          {copy.label} <span className="font-mincho text-xs font-normal opacity-70">{copy.kanji}</span>
        </Link>
      </td>
      {champion === undefined ? (
        <td className="py-1.5 pr-3 text-xs text-muted" colSpan={5}>
          No rated games yet
        </td>
      ) : (
        <>
          <td className="py-1.5 pr-3">
            <PlayerLink name={champion.leader.name} />
          </td>
          <td className="py-1.5 pr-3 font-mono tabular-nums">{champion.leader.rating}</td>
          <td className="py-1.5 pr-3">
            <TierMark tier={champion.leader.tier} />
          </td>
          <td className="py-1.5 pr-3 font-mono tabular-nums">{champion.players}</td>
          <td className="py-1.5 pr-3 font-mono tabular-nums">{champion.games}</td>
        </>
      )}
    </tr>
  );
}

/**
 * Every game, with the player at the top of its ladder: the site's 名人,
 * the title Go and Shogi give the best player of one game. The players page
 * ranks everyone on one ladder whatever they played; this is the other
 * question, who is best at each game.
 */
export default async function ChampionsPage() {
  const champions = await fetchChampions();
  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />
      <section className={`${PANEL_CLASS} flex flex-col gap-4`} data-testid="champions">
        <h1 className="flex items-baseline gap-2 text-lg font-semibold">
          Champions <span className="font-mincho text-sm font-normal opacity-70">名人</span>
        </h1>
        <p className="max-w-prose text-sm text-muted">
          The best-rated player at each game, as the standings are today. Every game keeps its own Elo,
          so being good at Notakto is a different claim from being good at Renju; the ladder on the{" "}
          <Link href="/players?view=ladder" className="underline underline-offset-4">players</Link> page counts everything
          together. Only games between two named members count. A game at one screen is filed and never rated.
        </p>
        <table className="w-full text-sm">
          <thead className={HEAD_CLASS}>
            <tr>
              <th className="py-1 pr-3">Game</th>
              <th className="py-1 pr-3">Champion</th>
              <th className="py-1 pr-3">Rating</th>
              <th className="py-1 pr-3">Tier</th>
              <th className="py-1 pr-3">Players</th>
              <th className="py-1 pr-3">Games</th>
            </tr>
          </thead>
          {GAME_FAMILIES.map((family) => (
            <tbody key={family.title} data-testid="champions-family">
              <tr>
                <th colSpan={6} className="pt-5 pb-1 text-left text-base font-semibold">
                  {family.title} <span className="font-mincho text-sm font-normal opacity-70">{family.kanji}</span>
                </th>
              </tr>
              {family.games.map((variant) => (
                <ChampionRow key={variant} variant={variant} champion={champions.get(variant)} />
              ))}
            </tbody>
          ))}
        </table>
      </section>
    </Page>
  );
}
