-- Two gaps, both found by auditing the indexes against the queries the app
-- actually runs.
--
-- 1. Unindexed foreign keys. Postgres does not index the referencing side of a
--    FK automatically, so every delete or key update on the parent has to scan
--    the whole child table to prove no rows reference it - and relation loads
--    (property.images, user.accounts) scan too.
--
-- 2. Filter+sort pairs. Every listing screen filters on `status` and orders by
--    `createdAt desc`, but the existing composites lead with category or
--    listingType, so the sort could not use them and fell back to sorting the
--    filtered set in memory.

-- ── Foreign keys ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "Account_userId_idx"               ON "Account"("userId");
CREATE INDEX IF NOT EXISTS "Session_userId_idx"               ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "PropertyImage_propertyId_idx"     ON "PropertyImage"("propertyId");
CREATE INDEX IF NOT EXISTS "PriceHistory_propertyId_idx"      ON "PriceHistory"("propertyId");
CREATE INDEX IF NOT EXISTS "Inquiry_seekerId_idx"             ON "Inquiry"("seekerId");
CREATE INDEX IF NOT EXISTS "ItemImage_itemId_idx"             ON "ItemImage"("itemId");
CREATE INDEX IF NOT EXISTS "ItemInquiry_seekerId_idx"         ON "ItemInquiry"("seekerId");
CREATE INDEX IF NOT EXISTS "AdminVerification_adminId_idx"    ON "AdminVerification"("adminId");
CREATE INDEX IF NOT EXISTS "AdminVerification_propertyId_idx" ON "AdminVerification"("propertyId");
CREATE INDEX IF NOT EXISTS "AdminVerification_itemId_idx"     ON "AdminVerification"("itemId");

-- Inquiry.propertyId and ItemInquiry.itemId already lead their unique
-- composites, so they need nothing further.

-- ── Filter + sort ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "CommunityContact_status_createdAt_idx"
  ON "CommunityContact"("status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Property_status_createdAt_idx"
  ON "Property"("status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Item_status_createdAt_idx"
  ON "Item"("status", "createdAt" DESC);
