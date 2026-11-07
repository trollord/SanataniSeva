/**
 * Community Directory - local vendors, shopkeepers and service providers
 * serving Hiranandani Estate, Thane.
 *
 * Static/dummy dataset for now. Phone numbers are placeholders and must be
 * replaced with verified listings before this page carries real traffic.
 */

export const COMMUNITY_CATEGORIES = [
  { key: "carpenter",   label: "Carpenters",        icon: "Hammer" },
  { key: "plumber",     label: "Plumbers",          icon: "Wrench" },
  { key: "electrician", label: "Electricians",      icon: "Zap" },
  { key: "appliance",   label: "AC & Appliances",   icon: "AirVent" },
  { key: "painter",     label: "Painters",          icon: "PaintRoller" },
  { key: "cleaning",    label: "Cleaning & Pest",   icon: "Sparkles" },
  { key: "grocery",     label: "Grocery & Kirana",  icon: "ShoppingBag" },
  { key: "food",        label: "Tiffin & Bakery",   icon: "ChefHat" },
  { key: "health",      label: "Health & Pharmacy", icon: "Stethoscope" },
  { key: "salon",       label: "Salon & Spa",       icon: "Scissors" },
  { key: "laundry",     label: "Laundry & Tailor",  icon: "Shirt" },
  { key: "movers",      label: "Movers & Transport", icon: "Truck" },
  { key: "tuition",     label: "Tutors & Classes",  icon: "GraduationCap" },
  { key: "pets",        label: "Pets & Garden",     icon: "Leaf" },
] as const;

export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number]["key"];

export interface CommunityContact {
  id: string;
  /** Shop name, or the person's name for individual service providers */
  name: string;
  /** Person to ask for, when the listing is a shop */
  contactPerson?: string;
  category: CommunityCategory;
  /** Short trade description shown under the name */
  service: string;
  phone: string;
  /** Reachable on WhatsApp at the same number */
  whatsapp: boolean;
  locality: string;
  /** Shop number / building / landmark */
  address: string;
  hours: string;
  /** Searchable keywords - also rendered as chips on the card */
  tags: string[];
  rating: number;
  reviews: number;
  /** Physically verified by the Sanatani Community team */
  verified: boolean;
  /** Year they started serving the estate */
  since: number;
}

/** Shape returned by Prisma / GET /api/community/contacts */
export interface DbCommunityContact {
  id: string;
  name: string;
  contactPerson: string | null;
  category: string;
  service: string;
  phone: string;
  whatsapp: boolean;
  locality: string;
  address: string;
  hours: string;
  tags: string; // JSON-encoded string[]
  verified: boolean;
  createdAt: Date | string;
}

export function toDisplayContact(c: DbCommunityContact): CommunityContact {
  let tags: string[] = [];
  try {
    tags = JSON.parse(c.tags);
  } catch {
    tags = [];
  }
  return {
    id: c.id,
    name: c.name,
    contactPerson: c.contactPerson ?? undefined,
    category: c.category as CommunityCategory,
    service: c.service,
    phone: c.phone,
    whatsapp: c.whatsapp,
    locality: c.locality,
    address: c.address,
    hours: c.hours,
    tags,
    rating: 0,
    reviews: 0,
    verified: c.verified,
    since: new Date(c.createdAt).getFullYear(),
  };
}

export const COMMUNITY_CONTACTS: CommunityContact[] = [
  /* ── Carpenters ─────────────────────────────────────────────────────────── */
  {
    id: "cp-001",
    name: "Shreeji Furniture Works",
    contactPerson: "Ramesh Vishwakarma",
    category: "carpenter",
    service: "Carpenter · Modular & custom furniture",
    phone: "+91 90000 10011",
    whatsapp: true,
    locality: "Hiranandani Estate",
    address: "Shop 7, Brindavan Arcade, near Eternia",
    hours: "Mon–Sat · 9:00 AM – 8:00 PM",
    tags: ["Wardrobes", "Modular kitchen", "Repairs", "Site visit"],
    rating: 4.8,
    reviews: 126,
    verified: true,
    since: 2011,
  },
  {
    id: "cp-002",
    name: "Anil Carpentry Services",
    category: "carpenter",
    service: "Carpenter · Door, drawer & hinge repairs",
    phone: "+91 90000 10012",
    whatsapp: true,
    locality: "Hiranandani Meadows",
    address: "On-call · serves Meadows & Estate",
    hours: "Daily · 8:00 AM – 9:00 PM",
    tags: ["Same-day", "Door repair", "Locks", "Bed repair"],
    rating: 4.6,
    reviews: 88,
    verified: true,
    since: 2016,
  },
  {
    id: "cp-003",
    name: "Woodcraft Interiors",
    contactPerson: "Suresh Pawar",
    category: "carpenter",
    service: "Carpenter · Full flat interiors & false ceiling",
    phone: "+91 90000 10013",
    whatsapp: false,
    locality: "Rodas Enclave",
    address: "Unit 3, Rodas Commercial Plaza",
    hours: "Mon–Sat · 10:00 AM – 7:00 PM",
    tags: ["Interiors", "False ceiling", "Turnkey", "3D design"],
    rating: 4.7,
    reviews: 54,
    verified: false,
    since: 2014,
  },

  /* ── Plumbers ───────────────────────────────────────────────────────────── */
  {
    id: "pl-001",
    name: "Sai Plumbing Solutions",
    contactPerson: "Mahesh Yadav",
    category: "plumber",
    service: "Plumber · Leakages, fittings & drainage",
    phone: "+91 90000 10021",
    whatsapp: true,
    locality: "Hiranandani Estate",
    address: "Shop 2, Glen Heights ground floor",
    hours: "Daily · 7:00 AM – 10:00 PM",
    tags: ["24x7 emergency", "Leakage", "Geyser", "Bathroom fittings"],
    rating: 4.9,
    reviews: 213,
    verified: true,
    since: 2009,
  },
  {
    id: "pl-002",
    name: "Kailash Plumbing & Sanitary",
    category: "plumber",
    service: "Plumber · Overhead tank & pump work",
    phone: "+91 90000 10022",
    whatsapp: true,
    locality: "One Hiranandani Park",
    address: "On-call · serves all towers",
    hours: "Daily · 8:00 AM – 9:00 PM",
    tags: ["Water pump", "Tank cleaning", "Pipe replacement"],
    rating: 4.5,
    reviews: 67,
    verified: false,
    since: 2018,
  },

  /* ── Electricians ───────────────────────────────────────────────────────── */
  {
    id: "el-001",
    name: "Bright Spark Electricals",
    contactPerson: "Imran Shaikh",
    category: "electrician",
    service: "Electrician · Wiring, MCB & fixtures",
    phone: "+91 90000 10031",
    whatsapp: true,
    locality: "Hiranandani Estate",
    address: "Shop 11, Maple Arcade, Thane",
    hours: "Mon–Sun · 8:00 AM – 9:00 PM",
    tags: ["24x7 emergency", "Wiring", "Inverter", "Light fitting"],
    rating: 4.8,
    reviews: 164,
    verified: true,
    since: 2012,
  },
  {
    id: "el-002",
    name: "Rajan Electric Works",
    category: "electrician",
    service: "Electrician · Fan, switch & socket repairs",
    phone: "+91 90000 10032",
    whatsapp: true,
    locality: "Hiranandani Meadows",
    address: "On-call · Meadows, Estate & Skylark",
    hours: "Daily · 9:00 AM – 8:00 PM",
    tags: ["Same-day", "Fan repair", "Switchboard", "Chandelier"],
    rating: 4.6,
    reviews: 91,
    verified: true,
    since: 2017,
  },

  /* ── AC & Appliances ────────────────────────────────────────────────────── */
  {
    id: "ap-001",
    name: "CoolCare AC Services",
    contactPerson: "Nitin Jadhav",
    category: "appliance",
    service: "AC service · Installation, gas & AMC",
    phone: "+91 90000 10041",
    whatsapp: true,
    locality: "Hiranandani Estate",
    address: "Shop 4, Odyssey Commercial Wing",
    hours: "Daily · 9:00 AM – 8:00 PM",
    tags: ["AC servicing", "Gas refill", "AMC plans", "Installation"],
    rating: 4.7,
    reviews: 189,
    verified: true,
    since: 2013,
  },
  {
    id: "ap-002",
    name: "Thane Appliance Care",
    category: "appliance",
    service: "Repairs · Washing machine, fridge & microwave",
    phone: "+91 90000 10042",
    whatsapp: true,
    locality: "Rodas Enclave",
    address: "Shop 9, Rodas Market Lane",
    hours: "Mon–Sat · 10:00 AM – 8:00 PM",
    tags: ["Washing machine", "Refrigerator", "Microwave", "Doorstep"],
    rating: 4.4,
    reviews: 73,
    verified: false,
    since: 2019,
  },

  /* ── Painters ───────────────────────────────────────────────────────────── */
  {
    id: "pt-001",
    name: "ColourHouse Painters",
    contactPerson: "Deepak Sawant",
    category: "painter",
    service: "Painting · Interior, texture & waterproofing",
    phone: "+91 90000 10051",
    whatsapp: true,
    locality: "Hiranandani Estate",
    address: "Shop 6, Brindavan Arcade",
    hours: "Mon–Sat · 9:00 AM – 7:00 PM",
    tags: ["Free quote", "Texture walls", "Waterproofing", "POP"],
    rating: 4.6,
    reviews: 102,
    verified: true,
    since: 2015,
  },

  /* ── Cleaning & Pest ────────────────────────────────────────────────────── */
  {
    id: "cl-001",
    name: "SparkleHome Deep Cleaning",
    contactPerson: "Priya Nair",
    category: "cleaning",
    service: "Deep cleaning · Flats, sofas & kitchens",
    phone: "+91 90000 10061",
    whatsapp: true,
    locality: "Hiranandani Estate",
    address: "Office 12, Eternia Commercial",
    hours: "Daily · 8:00 AM – 8:00 PM",
    tags: ["Move-in cleaning", "Sofa shampoo", "Bathroom", "Team of 4"],
    rating: 4.8,
    reviews: 241,
    verified: true,
    since: 2016,
  },
  {
    id: "cl-002",
    name: "SafeGuard Pest Control",
    category: "cleaning",
    service: "Pest control · Cockroach, termite & bed bugs",
    phone: "+91 90000 10062",
    whatsapp: true,
    locality: "Hiranandani Meadows",
    address: "Shop 3, Meadows Shopping Centre",
    hours: "Mon–Sat · 9:00 AM – 7:00 PM",
    tags: ["Odourless gel", "Termite", "Annual contract", "Pet safe"],
    rating: 4.5,
    reviews: 118,
    verified: true,
    since: 2014,
  },

  /* ── Grocery & Kirana ───────────────────────────────────────────────────── */
  {
    id: "gr-001",
    name: "Estate Daily Needs",
    contactPerson: "Jayesh Patel",
    category: "grocery",
    service: "Kirana store · Groceries & home delivery",
    phone: "+91 90000 10071",
    whatsapp: true,
    locality: "Hiranandani Estate",
    address: "Shop 1, Zen Commercial Complex",
    hours: "Daily · 7:30 AM – 10:30 PM",
    tags: ["Home delivery", "WhatsApp orders", "Monthly list", "UPI"],
    rating: 4.7,
    reviews: 305,
    verified: true,
    since: 2008,
  },
  {
    id: "gr-002",
    name: "Green Basket Fruits & Veg",
    category: "grocery",
    service: "Fruits & vegetables · Fresh daily stock",
    phone: "+91 90000 10072",
    whatsapp: true,
    locality: "Hiranandani Estate",
    address: "Stall 5, Estate Market Road",
    hours: "Daily · 7:00 AM – 9:30 PM",
    tags: ["Organic", "Same-day delivery", "Exotic veg"],
    rating: 4.5,
    reviews: 142,
    verified: true,
    since: 2013,
  },
  {
    id: "gr-003",
    name: "Sai Dairy & Provisions",
    category: "grocery",
    service: "Dairy · Milk, paneer & daily subscription",
    phone: "+91 90000 10073",
    whatsapp: true,
    locality: "Rodas Enclave",
    address: "Shop 2, Rodas Enclave gate side",
    hours: "Daily · 6:00 AM – 10:00 PM",
    tags: ["Milk subscription", "Early morning", "Paneer", "Curd"],
    rating: 4.6,
    reviews: 97,
    verified: false,
    since: 2015,
  },

  /* ── Tiffin & Bakery ────────────────────────────────────────────────────── */
  {
    id: "fd-001",
    name: "Annapurna Home Tiffin",
    contactPerson: "Sunita Deshmukh",
    category: "food",
    service: "Tiffin service · Veg home-style meals",
    phone: "+91 90000 10081",
    whatsapp: true,
    locality: "Hiranandani Estate",
    address: "Home kitchen · delivers to all towers",
    hours: "Lunch 11:30 AM · Dinner 7:30 PM",
    tags: ["Veg only", "Monthly plan", "Jain food", "Trial meal"],
    rating: 4.9,
    reviews: 178,
    verified: true,
    since: 2017,
  },
  {
    id: "fd-002",
    name: "The Estate Bakehouse",
    category: "food",
    service: "Bakery · Cakes, breads & party orders",
    phone: "+91 90000 10082",
    whatsapp: true,
    locality: "Hiranandani Estate",
    address: "Shop 8, Odyssey Commercial Wing",
    hours: "Daily · 9:00 AM – 10:00 PM",
    tags: ["Custom cakes", "Eggless", "Same-day", "Party orders"],
    rating: 4.7,
    reviews: 264,
    verified: true,
    since: 2012,
  },

  /* ── Health & Pharmacy ──────────────────────────────────────────────────── */
  {
    id: "he-001",
    name: "Wellness Chemist & Druggist",
    category: "health",
    service: "Pharmacy · Medicines & home delivery",
    phone: "+91 90000 10091",
    whatsapp: true,
    locality: "Hiranandani Estate",
    address: "Shop 3, Glen Heights ground floor",
    hours: "Daily · 8:00 AM – 11:00 PM",
    tags: ["Free delivery", "Prescription on WhatsApp", "Diagnostics"],
    rating: 4.8,
    reviews: 332,
    verified: true,
    since: 2010,
  },
  {
    id: "he-002",
    name: "Dr. Kavita Rao - Family Clinic",
    category: "health",
    service: "General physician · Walk-in & home visits",
    phone: "+91 90000 10092",
    whatsapp: false,
    locality: "Hiranandani Estate",
    address: "Clinic 4, Maple Arcade, 1st floor",
    hours: "Mon–Sat · 10:00 AM – 1:00 PM, 5:00 – 8:00 PM",
    tags: ["Home visit", "Paediatrics", "Appointment", "Vaccination"],
    rating: 4.9,
    reviews: 156,
    verified: true,
    since: 2011,
  },
  {
    id: "he-003",
    name: "CarePlus Physiotherapy",
    contactPerson: "Dr. Aniket More",
    category: "health",
    service: "Physiotherapy · Clinic & at-home sessions",
    phone: "+91 90000 10093",
    whatsapp: true,
    locality: "Hiranandani Meadows",
    address: "Unit 6, Meadows Shopping Centre",
    hours: "Mon–Sat · 8:00 AM – 8:00 PM",
    tags: ["At-home sessions", "Post-surgery", "Sports injury"],
    rating: 4.6,
    reviews: 64,
    verified: false,
    since: 2018,
  },

  /* ── Salon & Spa ────────────────────────────────────────────────────────── */
  {
    id: "sl-001",
    name: "Studio 9 Unisex Salon",
    category: "salon",
    service: "Salon · Hair, skin & bridal packages",
    phone: "+91 90000 10101",
    whatsapp: true,
    locality: "Hiranandani Estate",
    address: "Shop 14, Eternia Commercial",
    hours: "Tue–Sun · 10:00 AM – 9:00 PM",
    tags: ["Unisex", "Bridal", "Appointment", "Home service"],
    rating: 4.5,
    reviews: 208,
    verified: true,
    since: 2014,
  },
  {
    id: "sl-002",
    name: "Neha's At-Home Beauty",
    contactPerson: "Neha Kulkarni",
    category: "salon",
    service: "Beautician · Doorstep waxing, facial & mehendi",
    phone: "+91 90000 10102",
    whatsapp: true,
    locality: "Hiranandani Estate",
    address: "At-home service · all towers",
    hours: "Daily · 10:00 AM – 8:00 PM",
    tags: ["Doorstep", "Ladies only", "Mehendi", "Party makeup"],
    rating: 4.8,
    reviews: 121,
    verified: true,
    since: 2019,
  },

  /* ── Laundry & Tailor ───────────────────────────────────────────────────── */
  {
    id: "ln-001",
    name: "FreshFold Laundry",
    category: "laundry",
    service: "Laundry · Wash, iron & dry clean pickup",
    phone: "+91 90000 10111",
    whatsapp: true,
    locality: "Hiranandani Estate",
    address: "Shop 5, Zen Commercial Complex",
    hours: "Mon–Sat · 8:00 AM – 9:00 PM",
    tags: ["Free pickup", "Dry clean", "48-hour", "Per-kg rates"],
    rating: 4.6,
    reviews: 187,
    verified: true,
    since: 2015,
  },
  {
    id: "ln-002",
    name: "Perfect Fit Tailors",
    contactPerson: "Iqbal Ansari",
    category: "laundry",
    service: "Tailor · Alterations & custom stitching",
    phone: "+91 90000 10112",
    whatsapp: true,
    locality: "Hiranandani Meadows",
    address: "Shop 10, Meadows Shopping Centre",
    hours: "Mon–Sat · 10:00 AM – 8:30 PM",
    tags: ["Alterations", "Blouse stitching", "Curtains", "Suits"],
    rating: 4.4,
    reviews: 79,
    verified: false,
    since: 2012,
  },

  /* ── Movers & Transport ─────────────────────────────────────────────────── */
  {
    id: "mv-001",
    name: "SafeMove Packers & Movers",
    contactPerson: "Vikas Shinde",
    category: "movers",
    service: "Packers & movers · Local shifting within Thane",
    phone: "+91 90000 10121",
    whatsapp: true,
    locality: "Hiranandani Estate",
    address: "Office 2, Estate Service Road",
    hours: "Daily · 8:00 AM – 9:00 PM",
    tags: ["Local shifting", "Packing material", "Insurance", "Free survey"],
    rating: 4.5,
    reviews: 134,
    verified: true,
    since: 2013,
  },
  {
    id: "mv-002",
    name: "Estate Cab & Airport Drops",
    category: "movers",
    service: "Cab service · Airport drops & outstation",
    phone: "+91 90000 10122",
    whatsapp: true,
    locality: "Hiranandani Estate",
    address: "Pickup from all estate gates",
    hours: "Daily · 24 hours",
    tags: ["Airport", "Outstation", "Advance booking", "Sedan & SUV"],
    rating: 4.6,
    reviews: 220,
    verified: true,
    since: 2016,
  },

  /* ── Tutors & Classes ───────────────────────────────────────────────────── */
  {
    id: "tu-001",
    name: "BrightMinds Tuitions",
    contactPerson: "Meera Iyer",
    category: "tuition",
    service: "Tuitions · Class 5–10, all boards",
    phone: "+91 90000 10131",
    whatsapp: true,
    locality: "Hiranandani Estate",
    address: "Batch centre, Maple Arcade 2nd floor",
    hours: "Mon–Sat · 3:00 PM – 8:00 PM",
    tags: ["ICSE & CBSE", "Small batches", "Maths & Science", "Home tutor"],
    rating: 4.8,
    reviews: 96,
    verified: true,
    since: 2014,
  },
  {
    id: "tu-002",
    name: "Rhythm Music & Dance Academy",
    category: "tuition",
    service: "Classes · Keyboard, guitar & Bharatanatyam",
    phone: "+91 90000 10132",
    whatsapp: true,
    locality: "Rodas Enclave",
    address: "Studio 1, Rodas Commercial Plaza",
    hours: "Tue–Sun · 4:00 PM – 8:00 PM",
    tags: ["Kids batches", "Trial class", "Exams", "Adults welcome"],
    rating: 4.7,
    reviews: 58,
    verified: false,
    since: 2017,
  },

  /* ── Pets & Garden ──────────────────────────────────────────────────────── */
  {
    id: "pe-001",
    name: "PawPals Pet Care",
    contactPerson: "Rohit Menon",
    category: "pets",
    service: "Pet care · Grooming, walking & boarding",
    phone: "+91 90000 10141",
    whatsapp: true,
    locality: "Hiranandani Estate",
    address: "Shop 7, Odyssey Commercial Wing",
    hours: "Daily · 9:00 AM – 8:00 PM",
    tags: ["Grooming at home", "Dog walking", "Vet on call", "Boarding"],
    rating: 4.7,
    reviews: 111,
    verified: true,
    since: 2018,
  },
  {
    id: "pe-002",
    name: "GreenThumb Balcony Gardens",
    category: "pets",
    service: "Gardening · Balcony setup & plant maintenance",
    phone: "+91 90000 10142",
    whatsapp: true,
    locality: "Hiranandani Meadows",
    address: "Nursery stall, Meadows Service Lane",
    hours: "Mon–Sat · 8:00 AM – 7:00 PM",
    tags: ["Balcony garden", "Monthly upkeep", "Pots & soil", "Indoor plants"],
    rating: 4.5,
    reviews: 47,
    verified: false,
    since: 2020,
  },
];

/** Localities present in the dataset, in the order defined by the estate. */
export const COMMUNITY_LOCALITIES = Array.from(
  new Set(COMMUNITY_CONTACTS.map((c) => c.locality))
).sort();

/** Category label lookup, e.g. `carpenter` → `Carpenters`. */
export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  COMMUNITY_CATEGORIES.map((c) => [c.key, c.label])
);

/** How many listings sit in each category - used for the filter pill counts. */
export const CATEGORY_COUNTS: Record<string, number> = COMMUNITY_CONTACTS.reduce(
  (acc, c) => {
    acc[c.category] = (acc[c.category] ?? 0) + 1;
    return acc;
  },
  {} as Record<string, number>
);
