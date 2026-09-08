-- A public mark of appreciation on a finished game: one per member per game.
CREATE TABLE "Applause" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "member" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Applause_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Applause_gameId_idx" ON "Applause"("gameId");
CREATE UNIQUE INDEX "Applause_gameId_member_key" ON "Applause"("gameId", "member");

ALTER TABLE "Applause" ADD CONSTRAINT "Applause_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
