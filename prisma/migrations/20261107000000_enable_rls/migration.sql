-- Supabase exposes the `public` schema through PostgREST, and its default
-- privileges grant `anon` + `authenticated` full DML on every table created
-- here. Without RLS the project's anon key (a public, client-side key) can read
-- User.password hashes, Account.refresh_token, and private phone numbers.
--
-- Enabling RLS with no policies makes PostgREST return nothing for those roles.
-- The app is unaffected: Prisma connects as `postgres`, which has BYPASSRLS.
--
-- NOTE: Prisma does not model RLS. Any future migration that creates a table
-- must enable RLS on it explicitly, or the Supabase security advisor will flag it.

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Property" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Location" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PropertyImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PriceHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Inquiry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminVerification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Item" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ItemImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ItemInquiry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CommunityContact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NewsItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Newsletter" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BusRoute" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BusSchedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BusException" ENABLE ROW LEVEL SECURITY;
