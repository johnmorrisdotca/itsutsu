/** For each size, the first characters of every level's board and the hash of every board, run together in level order (`levelBoards.data.ts`). */
export type SuidoLevelBoards = Readonly<Record<number, { prefixLength: number; prefixes: string; hashes: string }>>;
