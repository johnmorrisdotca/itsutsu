import { PANEL_CLASS, SECTION_TITLE, TABLE_SCROLL } from "@/components/ui/ui.constants";
import { TENKA_CONTINENTS, TENKA_TERRITORIES } from "@/lib/party/tenka/tenkaMap";

/**
 * THE WORLD TENKA IS PLAYED ON, as the rules page publishes it: each
 * continent, what holding the whole of it is worth each turn, and its
 * territories, with the sea links each crosses. Read from the same table the
 * rules read (`tenkaMap.ts`), so the page cannot say one thing and the game do
 * another. No outlines here: they are the board's, in the browser.
 */
export function TenkaWorldTable() {
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="tenka-world">
      <h2 className={SECTION_TITLE}>
        The world <span className="font-mincho normal-case tracking-normal">天下</span>
      </h2>
      <p className="text-sm">
        Forty-two territories in six continents. Hold every territory of a continent at the start of your turn and it adds its bonus to your armies. A
        dashed line on the map is a sea link: armies may attack and move across it as across a border.
      </p>
      <div className={TABLE_SCROLL}>
        <table className="w-full text-left text-sm" data-testid="tenka-continents">
          <thead>
            <tr className="border-b border-rule text-xs text-muted">
              <th className="py-1 pr-3 font-semibold">Continent</th>
              <th className="py-1 pr-3 font-semibold tabular-nums">Bonus</th>
              <th className="py-1 font-semibold">Territories</th>
            </tr>
          </thead>
          <tbody>
            {TENKA_CONTINENTS.map((continent) => (
              <tr key={continent.key} className="border-b border-rule/60 align-top" data-testid="tenka-continent" data-continent={continent.key} data-bonus={continent.bonus}>
                <td className="py-1.5 pr-3 font-medium whitespace-nowrap">
                  {continent.name} <span className="font-mincho text-xs text-muted">{continent.kanji}</span>
                </td>
                <td className="py-1.5 pr-3 font-semibold tabular-nums">+{continent.bonus}</td>
                <td className="py-1.5 text-xs leading-relaxed">
                  {continent.territories
                    .map((territory) => {
                      const sea = TENKA_TERRITORIES[territory].sea.map((other) => TENKA_TERRITORIES[other].name);
                      return sea.length > 0 ? `${TENKA_TERRITORIES[territory].name} (by sea: ${sea.join(", ")})` : TENKA_TERRITORIES[territory].name;
                    })
                    .join("; ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        The map is drawn from Natural Earth (public domain), countries grouped into territories by region; Canada, the United States, Russia and Australia are divided along meridians.
      </p>
    </section>
  );
}
