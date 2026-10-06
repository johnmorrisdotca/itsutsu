import type { Locale } from "@/lib/i18n/i18n.types";
import { partyTable } from "@/lib/i18n/partyTables";

import { CASUAL_COPY } from "./casual.constants";

/** The casual games' own pages' words in the reader's language: the English table, or its Japanese overlay (`party.ja.tables.constants.ts`). */
export const casualWords = (locale: Locale): typeof CASUAL_COPY => partyTable(CASUAL_COPY, "casual", locale);
