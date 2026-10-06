import { PANEL_CLASS, SECTION_TITLE, TABLE_SCROLL } from "@/components/ui/ui.constants";
import { TENKA_CONTINENTS, TENKA_TERRITORIES } from "@/lib/party/tenka/tenkaMap";
import type { Speaker } from "@/lib/i18n/i18n";

import { continentName, territoryName } from "./tenkaWords";

/**
 * THE WORLD TENKA IS PLAYED ON, as the rules page publishes it: each
 * continent, what holding the whole of it is worth each turn, and its
 * territories, with the sea links each crosses. Read from the same table the
 * rules read (`tenkaMap.ts`), so the page cannot say one thing and the game do
 * another. No outlines here: they are the board's, in the browser.
 */
export function TenkaWorldTable({ say }: { say: Speaker }) {
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="tenka-world">
      <h2 className={SECTION_TITLE}>
        {say.say("party.tenka.worldTitle")} {say.locale === "en" ? <span className="font-mincho normal-case tracking-normal">天下</span> : null}
      </h2>
      <p className="text-sm">
        {say.say("party.tenka.worldLead")}
      </p>
      <div className={TABLE_SCROLL}>
        <table className="w-full text-left text-sm" data-testid="tenka-continents">
          <thead>
            <tr className="border-b border-rule text-xs text-muted">
              <th className="py-1 pr-3 font-semibold">{say.say("party.tenka.colContinent")}</th>
              <th className="py-1 pr-3 font-semibold tabular-nums">{say.say("party.tenka.colBonus")}</th>
              <th className="py-1 font-semibold">{say.say("party.tenka.colTerritories")}</th>
            </tr>
          </thead>
          <tbody>
            {TENKA_CONTINENTS.map((continent) => (
              <tr key={continent.key} className="border-b border-rule/60 align-top" data-testid="tenka-continent" data-continent={continent.key} data-bonus={continent.bonus}>
                <td className="py-1.5 pr-3 font-medium whitespace-nowrap">
                  {continentName(continent, say)} {say.locale === "en" ? <span className="font-mincho text-xs text-muted">{continent.kanji}</span> : null}
                </td>
                <td className="py-1.5 pr-3 font-semibold tabular-nums">+{continent.bonus}</td>
                <td className="py-1.5 text-xs leading-relaxed">
                  {continent.territories
                    .map((territory) => {
                      const name = territoryName(TENKA_TERRITORIES[territory], say);
                      const sea = TENKA_TERRITORIES[territory].sea.map((other) => territoryName(TENKA_TERRITORIES[other], say));
                      return sea.length > 0 ? say.say("party.tenka.bySea", { name, others: sea.join(say.locale === "ja" ? "、" : ", ") }) : name;
                    })
                    .join(say.locale === "ja" ? "；" : "; ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        {say.say("party.tenka.worldCredit")}
      </p>
    </section>
  );
}
