-- Parking spaces that come with a property, as counts. Nullable: listings
-- saved before this column existed simply say nothing about parking.
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "coveredParking" INTEGER;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "uncoveredParking" INTEGER;
