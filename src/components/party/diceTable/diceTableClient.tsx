"use client";

import dynamic from "next/dynamic";

import { speaker } from "@/lib/i18n/i18n";

import type { PartyTableGameProps } from "../party.types";
import { PlayLoading } from "../PlayLoading";

/**
 * THE PLAIN DICE GAMES' TABLE, THEIR PLAY BUTTON AND THEIR MY GAMES CARD, LOADED IN
 * THE BROWSER ONLY, as the card games' are (`cardTableClient.tsx`): all three read
 * a game kept in this browser, which the server cannot see, so loading them here
 * keeps the rules, the computers and Korokoro's die out of the server's functions.
 * The page arrives with the table's room kept, and the button reading Play, until
 * the browser fills them.
 */
const Table = dynamic(() => import("./DiceTable").then((module) => module.DiceTable), {
  ssr: false,
  loading: () => <section className="min-h-[32rem]" data-testid="dicetable-game" data-ready="false" aria-busy="true" />,
});
const Offer = dynamic(() => import("./DiceTableOffer").then((module) => module.DiceTableOffer), {
  ssr: false,
  loading: () => <PlayLoading label={(locale) => speaker(locale).say("party.dice.play")} />,
});
const Card = dynamic(() => import("./DiceTableCard").then((module) => module.DiceTableCard), { ssr: false });

/*
 * Each game's three, told which game it is: named components rather than a
 * function that makes them, since the server's table of tables
 * (`partyKindTables.ts`) may name a component from this file but not call one.
 */
export function PigTable(props: PartyTableGameProps) {
  return <Table kind="pig" {...props} />;
}
export function PigOffer({ href }: { href: string }) {
  return <Offer kind="pig" href={href} />;
}
export function PigCard() {
  return <Card kind="pig" />;
}
export function TenThousandTable(props: PartyTableGameProps) {
  return <Table kind="tenThousand" {...props} />;
}
export function TenThousandOffer({ href }: { href: string }) {
  return <Offer kind="tenThousand" href={href} />;
}
export function TenThousandCard() {
  return <Card kind="tenThousand" />;
}
export function LiarsTable(props: PartyTableGameProps) {
  return <Table kind="liarsDice" {...props} />;
}
export function LiarsOffer({ href }: { href: string }) {
  return <Offer kind="liarsDice" href={href} />;
}
export function LiarsCard() {
  return <Card kind="liarsDice" />;
}
export function SayuTable(props: PartyTableGameProps) {
  return <Table kind="sayu" {...props} />;
}
export function SayuOffer({ href }: { href: string }) {
  return <Offer kind="sayu" href={href} />;
}
export function SayuCard() {
  return <Card kind="sayu" />;
}
