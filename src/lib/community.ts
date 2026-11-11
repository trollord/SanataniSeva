/**
 * Community Directory - local vendors, shopkeepers, services, institutions and
 * emergency contacts serving Hiranandani Estate, Thane.
 *
 * Contact data lives in the CommunityContact table and is administered through
 * /admin/community. This module carries only the taxonomy and the DB -> display
 * mapping; there is deliberately no bundled dataset.
 */

/** Kept in alphabetical order by label: this is the order every list shows them in. */
export const COMMUNITY_CATEGORIES = [
  { key: "appliance",    label: "AC, Appliances & Equipment", icon: "AirVent" },
  { key: "automobile",   label: "Automobile",                 icon: "Car" },
  { key: "finance",      label: "Banks & Finance",            icon: "Landmark" },
  { key: "carpenter",    label: "Carpenters & Interiors",     icon: "Hammer" },
  { key: "classes",      label: "Classes & Hobbies",          icon: "Palette" },
  { key: "cleaning",     label: "Cleaning & Pest",            icon: "Sparkles" },
  { key: "electrician",  label: "Electricians",               icon: "Zap" },
  { key: "emergency",    label: "Emergency & Helplines",      icon: "Siren" },
  { key: "food",         label: "Food, Restaurants & Hotels", icon: "ChefHat" },
  { key: "grocery",      label: "Grocery & Kirana",           icon: "ShoppingBag" },
  { key: "health",       label: "Health & Pharmacy",          icon: "Stethoscope" },
  { key: "laundry",      label: "Laundry & Tailor",           icon: "Shirt" },
  { key: "movers",       label: "Movers & Courier",           icon: "Truck" },
  { key: "ngo",          label: "NGOs & Donations",            icon: "HeartHandshake" },
  { key: "painter",      label: "Painters & Repairs",         icon: "PaintRoller" },
  { key: "pets",         label: "Pets & Garden",              icon: "Leaf" },
  { key: "plumber",      label: "Plumbers",                   icon: "Wrench" },
  { key: "printing",     label: "Printing & Stationery",       icon: "Printer" },
  { key: "professional", label: "Professional Services",      icon: "Briefcase" },
  { key: "property",     label: "Property & Brokers",         icon: "Building2" },
  { key: "salon",        label: "Salon & Spa",                icon: "Scissors" },
  { key: "tuition",      label: "Schools & Tuitions",         icon: "GraduationCap" },
  { key: "shopping",     label: "Shops & Retail",             icon: "ShoppingBag" },
  { key: "religious",    label: "Temples & Trusts",           icon: "Flame" },
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
  /** One or more numbers; first is the primary. Never empty for a rendered card. */
  phones: string[];
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
  /** Physically verified by the Sanatani Seva team */
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
  phones: string[];
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
    phones: c.phones,
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

/** Category label lookup, e.g. `carpenter` -> `Carpenters & Interiors`. */
export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  COMMUNITY_CATEGORIES.map((c) => [c.key, c.label])
);
