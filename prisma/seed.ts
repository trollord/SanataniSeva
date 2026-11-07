import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@bluebrics.com" },
    update: { password: adminPassword, role: "ADMIN" },
    create: {
      email: "admin@bluebrics.com",
      name: "Admin User",
      password: adminPassword,
      role: "ADMIN",
      phone: "+91 98765 00000",
    },
  });

  // Create owner user
  const ownerPassword = await bcrypt.hash("owner123", 10);
  const owner = await prisma.user.upsert({
    where: { email: "owner@example.com" },
    update: { password: ownerPassword, role: "OWNER" },
    create: {
      email: "owner@example.com",
      name: "Rajesh Sharma",
      password: ownerPassword,
      role: "OWNER",
      phone: "+91 98765 11111",
    },
  });

  const owner2 = await prisma.user.upsert({
    where: { email: "owner2@example.com" },
    update: { password: ownerPassword, role: "OWNER" },
    create: {
      email: "owner2@example.com",
      name: "Priya Mehta",
      password: ownerPassword,
      role: "OWNER",
      phone: "+91 98765 22222",
    },
  });

  const amenitiesSet1 = JSON.stringify(["Swimming Pool", "Gymnasium", "Clubhouse", "24x7 Security", "Power Backup", "Covered Parking", "Lift"]);
  const amenitiesSet2 = JSON.stringify(["Swimming Pool", "Garden", "Children's Play Area", "24x7 Security", "Lift", "Power Backup"]);
  const amenitiesSet3 = JSON.stringify(["Gymnasium", "Clubhouse", "24x7 Security", "Covered Parking", "Lift", "Power Backup", "CCTV"]);

  const listings = [
    {
      title: "Spacious 3 BHK in Panchavati — Premium Furnished",
      description: "A beautifully designed 3 BHK flat in the heart of Hiranandani Estate. The apartment features modular kitchen, premium Italian marble flooring, and a stunning view of the lush greens. Recently renovated with top-of-the-line fixtures.\n\nIdeal for families looking for a premium lifestyle in a gated community.",
      type: "FLAT",
      listingType: "RENT",
      building: "Panchavati Tower A",
      flatNumber: "12A",
      address: "Tower A, Panchavati, Hiranandani Estate, Thane West 400607",
      locality: "Panchavati",
      bedrooms: 3,
      bathrooms: 3,
      areaSqft: 1450,
      floor: 12,
      totalFloors: 22,
      furnished: "FURNISHED",
      amenities: amenitiesSet1,
      price: 75000,
      deposit: 225000,
      latitude: 19.2702,
      longitude: 72.9677,
      ownerId: owner.id,
      status: "ACTIVE",
    },
    {
      title: "Elegant 2 BHK in Regent Hill — Ready to Move",
      description: "Semi-furnished 2 BHK in the prestigious Regent Hill enclave. Comes with modular kitchen, wardrobes in all rooms, and premium bathroom fittings. The society boasts of world-class amenities and 24x7 security.\n\nPerfect for working professionals and small families.",
      type: "FLAT",
      listingType: "RENT",
      building: "Regent Hill B Wing",
      flatNumber: "8B",
      address: "B Wing, Regent Hill, Hiranandani Estate, Thane West 400607",
      locality: "Regent Hill",
      bedrooms: 2,
      bathrooms: 2,
      areaSqft: 980,
      floor: 8,
      totalFloors: 18,
      furnished: "SEMI_FURNISHED",
      amenities: amenitiesSet2,
      price: 48000,
      deposit: 144000,
      latitude: 19.2715,
      longitude: 72.9690,
      ownerId: owner.id,
      status: "ACTIVE",
    },
    {
      title: "Luxurious 4 BHK Villa — Highland Park",
      description: "An exquisite 4 BHK independent villa in Highland Park, one of the most coveted addresses in Hiranandani Estate. Featuring a private garden, dedicated parking for 2 cars, and breathtaking views.\n\nThis is a rare opportunity to own a standalone villa in Hiranandani Estate.",
      type: "VILLA",
      listingType: "SALE",
      building: "Highland Park Villas",
      flatNumber: "V-07",
      address: "Villa 07, Highland Park, Hiranandani Estate, Thane West 400607",
      locality: "Highland Park",
      bedrooms: 4,
      bathrooms: 4,
      areaSqft: 3200,
      floor: 1,
      totalFloors: 3,
      furnished: "SEMI_FURNISHED",
      amenities: amenitiesSet1,
      price: 45000000,
      deposit: null,
      latitude: 19.2728,
      longitude: 72.9665,
      ownerId: owner2.id,
      status: "ACTIVE",
    },
    {
      title: "Premium 3 BHK in Woodstock — Corner Flat",
      description: "A stunning corner flat in Woodstock offering panoramic views of Hiranandani Estate. The 3 BHK unit is fully furnished with high-end imported furniture, smart home automation, and premium fixtures throughout.\n\nA rare corner flat with extra natural light and ventilation.",
      type: "FLAT",
      listingType: "SALE",
      building: "Woodstock Tower C",
      flatNumber: "15C",
      address: "Tower C, Woodstock, Hiranandani Estate, Thane West 400607",
      locality: "Woodstock",
      bedrooms: 3,
      bathrooms: 3,
      areaSqft: 1680,
      floor: 15,
      totalFloors: 24,
      furnished: "FURNISHED",
      amenities: amenitiesSet3,
      price: 28500000,
      deposit: null,
      latitude: 19.2695,
      longitude: 72.9683,
      ownerId: owner2.id,
      status: "ACTIVE",
    },
    {
      title: "Modern 1 BHK — Estate Garden, Perfect Starter",
      description: "A well-maintained 1 BHK apartment in the serene Estate Garden complex. Ideal for young professionals or couples. The apartment is semi-furnished with a modular kitchen and comes with dedicated parking.\n\nGreat connectivity to highways and IT parks.",
      type: "FLAT",
      listingType: "RENT",
      building: "Estate Garden Wing D",
      flatNumber: "3D",
      address: "Wing D, Estate Garden, Hiranandani Estate, Thane West 400607",
      locality: "Estate Garden",
      bedrooms: 1,
      bathrooms: 1,
      areaSqft: 620,
      floor: 3,
      totalFloors: 14,
      furnished: "SEMI_FURNISHED",
      amenities: amenitiesSet2,
      price: 28000,
      deposit: 84000,
      latitude: 19.2688,
      longitude: 72.9701,
      ownerId: owner.id,
      status: "ACTIVE",
    },
    {
      title: "Prime Office Space — Ground Floor, Brahmand",
      description: "A 1,200 sq ft commercial office space on the ground floor of a premium complex in Brahmand. Ideal for a boutique firm, consultancy, or retail showroom. Comes with 3 dedicated parking slots and 24x7 access.\n\nHigh footfall area with excellent visibility.",
      type: "OFFICE",
      listingType: "RENT",
      building: "Brahmand Commercial Complex",
      flatNumber: "G-12",
      address: "G-12, Brahmand Commercial Complex, Hiranandani Estate, Thane West 400607",
      locality: "Brahmand",
      bedrooms: null,
      bathrooms: 2,
      areaSqft: 1200,
      floor: 0,
      totalFloors: 5,
      furnished: "UNFURNISHED",
      amenities: JSON.stringify(["24x7 Security", "Covered Parking", "Power Backup", "CCTV", "Lift"]),
      price: 95000,
      deposit: 285000,
      latitude: 19.2675,
      longitude: 72.9710,
      ownerId: owner2.id,
      status: "ACTIVE",
    },
  ];

  for (const listing of listings) {
    const existing = await prisma.property.findFirst({
      where: { title: listing.title },
    });
    if (!existing) {
      const property = await prisma.property.create({ data: listing as never });
      // Add price history
      await prisma.priceHistory.create({
        data: { propertyId: property.id, price: listing.price, source: "LISTING" },
      });
      console.log(`Created: ${listing.title}`);
    } else {
      console.log(`Skipped (exists): ${listing.title}`);
    }
  }

  console.log("\nDone! Credentials:");
  console.log("  Admin:  admin@bluebrics.com / admin123");
  console.log("  Owner:  owner@example.com / owner123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
