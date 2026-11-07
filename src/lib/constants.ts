export const PLATFORM_FEE_INR = 9999;
export const CURRENCY = "INR";
export const SITE_NAME = "Sanatani Community";
export const SITE_URL = process.env.NEXTAUTH_URL ?? "https://www.bluebrics.com";
export const SITE_TAGLINE = "Your Trusted Real Estate Advisors in Hiranandani Estate";

export const HIRANANDANI_LOCALITIES = [
  "Hiranandani Estate",
  "Hiranandani Meadows",
  "Rodas Enclave",
  "One Hiranandani Park",
  "Skylark Enclave",
  "Others",
] as const;

export type Locality = (typeof HIRANANDANI_LOCALITIES)[number];

export const AMENITIES_LIST = [
  "Swimming Pool",
  "Gymnasium",
  "Clubhouse",
  "24x7 Security",
  "Power Backup",
  "Covered Parking",
  "Lift",
  "Garden / Landscaped Area",
  "Children's Play Area",
  "Intercom",
  "Rainwater Harvesting",
  "Jogging Track",
  "Indoor Games",
  "Multipurpose Hall",
  "CCTV Surveillance",
  "Visitor Parking",
  "Gas Pipeline",
  "Water Softener",
] as const;

export type Amenity = (typeof AMENITIES_LIST)[number];

export const BHK_OPTIONS = [1, 2, 3, 4, 5] as const;

export const PRICE_RANGES_RENT = [
  { label: "Under ₹20k", min: 0, max: 20000 },
  { label: "₹20k – ₹40k", min: 20000, max: 40000 },
  { label: "₹40k – ₹70k", min: 40000, max: 70000 },
  { label: "₹70k – ₹1L", min: 70000, max: 100000 },
  { label: "Above ₹1L", min: 100000, max: Infinity },
];

export const PRICE_RANGES_SALE = [
  { label: "Under ₹50L", min: 0, max: 5000000 },
  { label: "₹50L – ₹1Cr", min: 5000000, max: 10000000 },
  { label: "₹1Cr – ₹2Cr", min: 10000000, max: 20000000 },
  { label: "₹2Cr – ₹3Cr", min: 20000000, max: 30000000 },
  { label: "Above ₹3Cr", min: 30000000, max: Infinity },
];

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  FLAT: "Flat",
  HOUSE: "Independent House",
  VILLA: "Villa",
  OFFICE: "Office Space",
  SHOP: "Shop / Commercial",
};

export const LISTING_TYPE_LABELS: Record<string, string> = {
  RENT: "Rent",
  SALE: "Sale",
};

export const FURNISHED_LABELS: Record<string, string> = {
  FURNISHED: "Fully Furnished",
  SEMI_FURNISHED: "Semi Furnished",
  UNFURNISHED: "Unfurnished",
};

export const LOCK_IN_OPTIONS = [
  { label: "No lock-in", value: 0 },
  { label: "6 months", value: 6 },
  { label: "11 months", value: 11 },
  { label: "1 year", value: 12 },
  { label: "2 years", value: 24 },
  { label: "3 years", value: 36 },
] as const;

/* ─── Marketplace (used items) ───────────────────────────────────────────── */

export const ITEM_CATEGORY_LABELS: Record<string, string> = {
  OFFICE_FURNITURE: "Office Furniture",
  HOME_FURNITURE: "Home Furniture",
  ELECTRONICS: "Electrical / Electronics",
  COMPUTERS: "Computers",
  VEHICLES: "Vehicles",
  OTHERS: "Others",
};

export const ITEM_CATEGORIES = Object.keys(ITEM_CATEGORY_LABELS) as (keyof typeof ITEM_CATEGORY_LABELS)[];

export const VEHICLE_TYPE_LABELS: Record<string, string> = {
  CAR: "Car",
  TWO_WHEELER: "Two-Wheeler",
  CYCLE: "Cycle",
};

export const VEHICLE_TYPES = Object.keys(VEHICLE_TYPE_LABELS);

export const ITEM_CONDITION_LABELS: Record<string, string> = {
  NEW: "New (sealed)",
  LIKE_NEW: "Like New",
  GOOD: "Good",
  FAIR: "Fair",
};

export const ITEM_CONDITIONS = Object.keys(ITEM_CONDITION_LABELS);

export const ITEM_PRICE_RANGES = [
  { label: "Under ₹5k", min: 0, max: 5000 },
  { label: "₹5k – ₹25k", min: 5000, max: 25000 },
  { label: "₹25k – ₹75k", min: 25000, max: 75000 },
  { label: "₹75k – ₹2L", min: 75000, max: 200000 },
  { label: "Above ₹2L", min: 200000, max: Infinity },
];
