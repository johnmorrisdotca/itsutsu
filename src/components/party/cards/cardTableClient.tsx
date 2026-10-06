"use client";

import dynamic from "next/dynamic";


import type { PartyTableGameProps } from "../party.types";
import { PlayLoading } from "../PlayLoading";
import { cardTableWords } from "@/components/party/partyWords";

/**
 * THE CARD GAMES' TABLE, THEIR PLAY BUTTON AND THEIR MY GAMES CARD, LOADED IN
 * THE BROWSER ONLY. All three read a game kept in this browser, which the
 * server cannot see, so a server render of them does no work a reader sees.
 * Loading them here keeps the five games' rules, their computer players and
 * the deck's drawing out of the server's functions altogether (the deploy
 * measures every function's size), as Mexican Train's are (`trainClient.tsx`).
 * The page arrives with the table's room kept, and the button reading Play,
 * until the browser fills them.
 */
const Table = dynamic(() => import("./CardGameTable").then((module) => module.CardGameTable), {
  ssr: false,
  loading: () => <section className="min-h-[36rem]" data-testid="cards-game" data-ready="false" aria-busy="true" />,
});
const Offer = dynamic(() => import("./CardGameOffer").then((module) => module.CardGameOffer), {
  ssr: false,
  loading: () => <PlayLoading label={(locale) => cardTableWords(locale).play} />,
});
const Card = dynamic(() => import("./CardGameCard").then((module) => module.CardGameCard), { ssr: false });

/*
 * Each game's three, told which game it is: named components rather than a
 * function that makes them, since the server's table of tables
 * (`partyKindTables.ts`) may name a component from this file but not call one.
 */
export function HeartsTable(props: PartyTableGameProps) {
  return <Table kind="hearts" {...props} />;
}
export function HeartsOffer({ href }: { href: string }) {
  return <Offer kind="hearts" href={href} />;
}
export function HeartsCard() {
  return <Card kind="hearts" />;
}
export function BigTwoTable(props: PartyTableGameProps) {
  return <Table kind="bigTwo" {...props} />;
}
export function BigTwoOffer({ href }: { href: string }) {
  return <Offer kind="bigTwo" href={href} />;
}
export function BigTwoCard() {
  return <Card kind="bigTwo" />;
}
export function PresidentTable(props: PartyTableGameProps) {
  return <Table kind="president" {...props} />;
}
export function PresidentOffer({ href }: { href: string }) {
  return <Offer kind="president" href={href} />;
}
export function PresidentCard() {
  return <Card kind="president" />;
}
export function GoFishTable(props: PartyTableGameProps) {
  return <Table kind="goFish" {...props} />;
}
export function GoFishOffer({ href }: { href: string }) {
  return <Offer kind="goFish" href={href} />;
}
export function GoFishCard() {
  return <Card kind="goFish" />;
}
export function CrazyEightsTable(props: PartyTableGameProps) {
  return <Table kind="crazyEights" {...props} />;
}
export function CrazyEightsOffer({ href }: { href: string }) {
  return <Offer kind="crazyEights" href={href} />;
}
export function CrazyEightsCard() {
  return <Card kind="crazyEights" />;
}
export function SpadesTable(props: PartyTableGameProps) {
  return <Table kind="spades" {...props} />;
}
export function SpadesOffer({ href }: { href: string }) {
  return <Offer kind="spades" href={href} />;
}
export function SpadesCard() {
  return <Card kind="spades" />;
}
export function GinRummyTable(props: PartyTableGameProps) {
  return <Table kind="ginRummy" {...props} />;
}
export function GinRummyOffer({ href }: { href: string }) {
  return <Offer kind="ginRummy" href={href} />;
}
export function GinRummyCard() {
  return <Card kind="ginRummy" />;
}
export function EuchreTable(props: PartyTableGameProps) {
  return <Table kind="euchre" {...props} />;
}
export function EuchreOffer({ href }: { href: string }) {
  return <Offer kind="euchre" href={href} />;
}
export function EuchreCard() {
  return <Card kind="euchre" />;
}

export function CribbageTable(props: PartyTableGameProps) {
  return <Table kind="cribbage" {...props} />;
}

export function CribbageOffer({ href }: { href: string }) {
  return <Offer kind="cribbage" href={href} />;
}

export function CribbageCard() {
  return <Card kind="cribbage" />;
}

export function OhHellTable(props: PartyTableGameProps) {
  return <Table kind="ohHell" {...props} />;
}

export function OhHellOffer({ href }: { href: string }) {
  return <Offer kind="ohHell" href={href} />;
}

export function OhHellCard() {
  return <Card kind="ohHell" />;
}

export function WarTable(props: PartyTableGameProps) {
  return <Table kind="war" {...props} />;
}

export function WarOffer({ href }: { href: string }) {
  return <Offer kind="war" href={href} />;
}

export function WarCard() {
  return <Card kind="war" />;
}
