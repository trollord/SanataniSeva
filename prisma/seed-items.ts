import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedItem = {
  title: string;
  description: string;
  category: string;
  vehicleType?: string;
  condition: string;
  brand?: string;
  yearPurchased?: number;
  price: number;
  priceNegotiable: boolean;
  pickupLocality: string;
  pickupArea?: string;
  status: string;
};

const items: SeedItem[] = [
  // ─── Office Furniture ─────────────────────────────────────────────────────
  {
    title: "Herman Miller Aeron Chair — Size B",
    description:
      "Barely used Aeron chair in Carbon finish. Fully adjustable arms, posture-fit back support, tilt-limiter. Bought during work-from-home phase; selling because I now use a standing desk.",
    category: "OFFICE_FURNITURE",
    condition: "LIKE_NEW",
    brand: "Herman Miller",
    yearPurchased: 2023,
    price: 65000,
    priceNegotiable: true,
    pickupLocality: "Panchavati",
    pickupArea: "Tower B, Hiranandani Estate",
    status: "ACTIVE",
  },
  {
    title: "L-shaped Executive Desk with Return",
    description:
      "Solid wood L-shaped desk, roughly 6ft x 5ft, three drawers, keyboard tray. Great condition, minor scratches on top which can be polished. Perfect for a home office.",
    category: "OFFICE_FURNITURE",
    condition: "GOOD",
    brand: "Godrej Interio",
    yearPurchased: 2019,
    price: 12000,
    priceNegotiable: true,
    pickupLocality: "Regent Hill",
    pickupArea: "C Wing",
    status: "ACTIVE",
  },
  {
    title: "4-drawer steel filing cabinet",
    description:
      "Standard office filing cabinet, locks working, keys included. Light surface rust on the back panel; otherwise structurally sound.",
    category: "OFFICE_FURNITURE",
    condition: "FAIR",
    price: 3500,
    priceNegotiable: false,
    pickupLocality: "Brahmand",
    status: "ACTIVE",
  },
  {
    title: "Conference table seats 8 + 8 chairs",
    description:
      "Large oval conference table in walnut veneer with 8 matching upholstered chairs. Downsizing office. Pickup only — table does not come apart.",
    category: "OFFICE_FURNITURE",
    condition: "GOOD",
    yearPurchased: 2018,
    price: 28000,
    priceNegotiable: true,
    pickupLocality: "Brahmand",
    pickupArea: "Commercial Complex G-floor",
    status: "ACTIVE",
  },

  // ─── Home Furniture ───────────────────────────────────────────────────────
  {
    title: "Teak wood king-size bed with storage",
    description:
      "Hydraulic lift-up storage bed, solid teak frame. No mattress included. Minor scuffs on the headboard side. Dismantles for transport.",
    category: "HOME_FURNITURE",
    condition: "GOOD",
    yearPurchased: 2020,
    price: 32000,
    priceNegotiable: true,
    pickupLocality: "Hiranandani Meadows",
    pickupArea: "Odyssey Tower",
    status: "ACTIVE",
  },
  {
    title: "3-seater fabric sofa + ottoman",
    description:
      "Charcoal grey 3-seater sofa with matching ottoman. Removable, machine-washable covers (we have a spare set). Non-smokers, no pets.",
    category: "HOME_FURNITURE",
    condition: "LIKE_NEW",
    brand: "Urban Ladder",
    yearPurchased: 2024,
    price: 24000,
    priceNegotiable: true,
    pickupLocality: "Woodstock",
    status: "ACTIVE",
  },
  {
    title: "6-seater glass-top dining table",
    description:
      "Toughened glass top on a chrome base, 6 upholstered chairs included. One chair has a small tear in the upholstery.",
    category: "HOME_FURNITURE",
    condition: "GOOD",
    price: 18000,
    priceNegotiable: true,
    pickupLocality: "Highland Park",
    status: "ACTIVE",
  },
  {
    title: "Study desk + bookshelf combo",
    description:
      "Compact engineered-wood study desk with attached 4-shelf bookshelf. Good for a child's bedroom. Easy to dismantle.",
    category: "HOME_FURNITURE",
    condition: "GOOD",
    brand: "IKEA",
    price: 4500,
    priceNegotiable: false,
    pickupLocality: "Estate Garden",
    pickupArea: "Wing D",
    status: "ACTIVE",
  },

  // ─── Electronics ──────────────────────────────────────────────────────────
  {
    title: "LG 55-inch 4K OLED TV",
    description:
      "LG C2 series 4K OLED, bought in 2023. Pristine panel, no dead pixels or burn-in. Comes with wall mount, remote, and original box.",
    category: "ELECTRONICS",
    condition: "LIKE_NEW",
    brand: "LG",
    yearPurchased: 2023,
    price: 85000,
    priceNegotiable: true,
    pickupLocality: "Panchavati",
    status: "ACTIVE",
  },
  {
    title: "Daikin 1.5 Ton 5-star inverter AC",
    description:
      "Split AC, well-maintained with service records. Last service done 3 months ago. Reason for selling: moving to a smaller 1-ton for a studio apartment.",
    category: "ELECTRONICS",
    condition: "GOOD",
    brand: "Daikin",
    yearPurchased: 2021,
    price: 22000,
    priceNegotiable: true,
    pickupLocality: "Regent Hill",
    pickupArea: "B Wing",
    status: "ACTIVE",
  },
  {
    title: "Sony WH-1000XM5 noise-cancelling headphones",
    description:
      "Industry-leading noise cancellation, barely used. Original box, case, charging cable included. Battery health is excellent.",
    category: "ELECTRONICS",
    condition: "LIKE_NEW",
    brand: "Sony",
    yearPurchased: 2024,
    price: 18500,
    priceNegotiable: true,
    pickupLocality: "Hiranandani Meadows",
    status: "ACTIVE",
  },
  {
    title: "Bosch 7kg front-load washing machine",
    description:
      "German engineering, works perfectly. Minor cosmetic dents on the side (not visible once installed). 10 years old but very reliable.",
    category: "ELECTRONICS",
    condition: "FAIR",
    brand: "Bosch",
    yearPurchased: 2015,
    price: 8500,
    priceNegotiable: true,
    pickupLocality: "Brahmand",
    status: "ACTIVE",
  },

  // ─── Computers ────────────────────────────────────────────────────────────
  {
    title: "MacBook Pro 14\" M2 Pro — 16GB / 1TB",
    description:
      "Space Gray, immaculate condition, battery cycles under 100. Comes with original 70W charger and box. AppleCare+ valid until 2026.",
    category: "COMPUTERS",
    condition: "LIKE_NEW",
    brand: "Apple",
    yearPurchased: 2023,
    price: 155000,
    priceNegotiable: true,
    pickupLocality: "Woodstock",
    pickupArea: "Tower C",
    status: "ACTIVE",
  },
  {
    title: "Dell XPS 15 — i7 / 32GB / 1TB",
    description:
      "4K OLED touchscreen variant. Light wear on the palm rest. Includes original 130W charger and sleeve.",
    category: "COMPUTERS",
    condition: "GOOD",
    brand: "Dell",
    yearPurchased: 2022,
    price: 72000,
    priceNegotiable: true,
    pickupLocality: "Panchavati",
    status: "ACTIVE",
  },
  {
    title: "Full desktop setup — i5 PC + 27\" monitor + keyboard + mouse",
    description:
      "Intel i5 12th gen, 16GB RAM, 512GB NVMe, GTX 1660 Super, 27-inch 1440p IPS monitor, mechanical keyboard, wireless mouse. Everything you need to game or work.",
    category: "COMPUTERS",
    condition: "GOOD",
    yearPurchased: 2022,
    price: 55000,
    priceNegotiable: true,
    pickupLocality: "Highland Park",
    status: "ACTIVE",
  },
  {
    title: "iPad Air 5th gen + Magic Keyboard",
    description:
      "64GB WiFi iPad Air with Magic Keyboard and Apple Pencil (2nd gen). Light scratches on the back; screen is flawless.",
    category: "COMPUTERS",
    condition: "GOOD",
    brand: "Apple",
    yearPurchased: 2022,
    price: 45000,
    priceNegotiable: true,
    pickupLocality: "Regent Hill",
    status: "ACTIVE",
  },

  // ─── Vehicles (with vehicleType) ──────────────────────────────────────────
  {
    title: "2019 Honda City ZX CVT — Petrol",
    description:
      "First owner, 42,000 km, full Honda service history, no accidents. New tyres fitted 6 months back. Insurance valid till Mar 2026.",
    category: "VEHICLES",
    vehicleType: "CAR",
    condition: "GOOD",
    brand: "Honda",
    yearPurchased: 2019,
    price: 850000,
    priceNegotiable: true,
    pickupLocality: "Panchavati",
    pickupArea: "Tower A parking",
    status: "ACTIVE",
  },
  {
    title: "Royal Enfield Classic 350 — 2022",
    description:
      "Stealth Black, barely 8,500 km on the odometer. All services done at the authorised showroom. Original paperwork, single owner.",
    category: "VEHICLES",
    vehicleType: "TWO_WHEELER",
    condition: "LIKE_NEW",
    brand: "Royal Enfield",
    yearPurchased: 2022,
    price: 165000,
    priceNegotiable: true,
    pickupLocality: "Brahmand",
    status: "ACTIVE",
  },
  {
    title: "Honda Activa 6G 2021 — 18,000 km",
    description:
      "Family-maintained scooter, serviced every 3,000 km at Honda showroom. Minor scratches on the apron. Reason for selling: switching to EV.",
    category: "VEHICLES",
    vehicleType: "TWO_WHEELER",
    condition: "GOOD",
    brand: "Honda",
    yearPurchased: 2021,
    price: 55000,
    priceNegotiable: true,
    pickupLocality: "Estate Garden",
    status: "ACTIVE",
  },
  {
    title: "Giant Escape 3 hybrid bicycle",
    description:
      "27-speed Shimano gearing, aluminium frame, size L. Great commuter / weekend ride. Serviced recently, new brake pads.",
    category: "VEHICLES",
    vehicleType: "CYCLE",
    condition: "GOOD",
    brand: "Giant",
    yearPurchased: 2020,
    price: 18000,
    priceNegotiable: true,
    pickupLocality: "Hiranandani Meadows",
    status: "ACTIVE",
  },
  {
    title: "Firefox kids cycle 20\" — ages 6-10",
    description:
      "Trail-ready kids bike, barely 1 year of use. My son outgrew it. Includes side stand and bell.",
    category: "VEHICLES",
    vehicleType: "CYCLE",
    condition: "LIKE_NEW",
    brand: "Firefox",
    yearPurchased: 2024,
    price: 4800,
    priceNegotiable: false,
    pickupLocality: "Woodstock",
    status: "ACTIVE",
  },

  // ─── Others ───────────────────────────────────────────────────────────────
  {
    title: "Yamaha F310 acoustic guitar + gig bag",
    description:
      "Beginner-friendly acoustic guitar. Minor scratches on the body. New strings fitted. Gig bag, strap, picks included.",
    category: "OTHERS",
    condition: "GOOD",
    brand: "Yamaha",
    yearPurchased: 2021,
    price: 6500,
    priceNegotiable: true,
    pickupLocality: "Panchavati",
    status: "ACTIVE",
  },
  {
    title: "Treadmill — PowerMax TDM-100M (foldable)",
    description:
      "Motorised treadmill, foldable design to save space. Max user weight 110kg. Works perfectly, just gathering dust.",
    category: "OTHERS",
    condition: "GOOD",
    brand: "PowerMax",
    yearPurchased: 2020,
    price: 14000,
    priceNegotiable: true,
    pickupLocality: "Brahmand",
    status: "ACTIVE",
  },
  {
    title: "Decathlon camping tent (4-person) + accessories",
    description:
      "Quechua Arpenaz 4.1 tent, used only twice. Comes with sleeping bags, inflatable mattress, LED lantern, cookware. Full starter set for a camping trip.",
    category: "OTHERS",
    condition: "LIKE_NEW",
    brand: "Decathlon",
    yearPurchased: 2023,
    price: 9500,
    priceNegotiable: false,
    pickupLocality: "Highland Park",
    status: "ACTIVE",
  },
];

async function main() {
  const seller = await prisma.user.findFirst({
    where: { role: "OWNER" },
    orderBy: { createdAt: "asc" },
  });
  if (!seller) throw new Error("No OWNER user found — run prisma seed first");

  let inserted = 0;
  let skipped = 0;

  for (const data of items) {
    const existing = await prisma.item.findFirst({
      where: { title: data.title, sellerId: seller.id },
    });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.item.create({
      data: {
        ...data,
        sellerId: seller.id,
        activatedAt: data.status === "ACTIVE" ? new Date() : null,
      },
    });
    inserted++;
  }

  console.log(`✓ Inserted ${inserted} items, skipped ${skipped} existing. Seller: ${seller.email}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
