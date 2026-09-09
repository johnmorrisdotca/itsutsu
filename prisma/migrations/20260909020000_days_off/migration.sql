-- Days of the week a member does not play, 0 for Sunday. Standing, unlike the
-- away range: deadlines in games that honour vacation step over them every
-- week and nothing comes off the yearly allowance. Empty for everybody until
-- they say otherwise, which is how deadlines have always worked.
ALTER TABLE "Member" ADD COLUMN "daysOff" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];
