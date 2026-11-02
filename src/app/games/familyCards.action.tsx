"use server";

import type { ReactNode } from "react";

import { FamilyBody } from "@/components/games/FamilyBody";
import { currentReader } from "@/lib/auth/currentReader";
import { forReader } from "@/lib/catalogue/catalogueReader";
import { fetchCatalogueStats } from "@/lib/catalogue/catalogueStats";
import { strangerCatalogueStats } from "@/lib/catalogue/publicCatalogueStats";
import { currentSpeaker } from "@/lib/i18n/currentLocale";

import { catalogueFamilies } from "./PublicCatalogue";

/**
 * THE GAMES OF ONE FAMILY, ASKED FOR WHEN A READER FIRST OPENS IT. The Families tab sends the cards of the families
 * that are open and none of the shut ones: each of 132 cards used to go twice into the page (as its HTML and as the
 * data that makes it work), 673 KB for a tab on which a reader opens a few families. The cards come back drawn on
 * the server, for this reader and in their language, with the figures a stranger may read where there is no session
 * (`forReader`): the same cards the page used to carry. A press is the trigger, never a timer.
 */
export async function loadFamilyCards(familyKey: string): Promise<ReactNode> {
  const [say, reader] = await Promise.all([currentSpeaker(), currentReader()]);
  const family = catalogueFamilies(say.locale).find((one) => one.key === familyKey);
  if (family === undefined) return null;
  const stats = reader.signedIn ? forReader(await fetchCatalogueStats(), true) : await strangerCatalogueStats();
  return <FamilyBody family={family} stats={stats} signedIn={reader.signedIn} say={say} />;
}
