-- Somewhere for the operator's say about the whole site to live: who may sign
-- up, and what the door says while they cannot.
--
-- A ROW PER KEY rather than a column per setting, because that is the shape
-- the shared settings service uses -- `settings/{key}` GET and PUT -- so the
-- day this moves there, one file changes and nothing that reads it does.
-- UmaKuma already has this table, under this name, with these columns; a third
-- shape for the same job would be a third thing to keep in step.
--
-- NOTHING IS SEEDED, AND THAT IS THE SAFETY PROPERTY. An absent row reads as
-- the registry's default, and the default for signing up is `invite-only`,
-- which is exactly how this site behaved before this table existed. So this
-- migration cannot change the behaviour of the deployment it lands on: there is
-- no row for it to get wrong. UmaKuma's own backlog records the version of this
-- that would have gone wrong -- a lockdown key whose absent row would have shut
-- out every account already holding an invite -- and the difference is entirely
-- that the safe value is the one you get from an empty table.
--
-- `updatedBy` defaults to an empty string rather than being nullable: every row
-- here is written by an authenticated operator through /api/site, so "nobody
-- wrote this" is not a state a row can be in, and there is nothing for a null
-- to mean.
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);
