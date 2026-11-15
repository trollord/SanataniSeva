/**
 * Community Directory - local vendors, shopkeepers, services, institutions and
 * emergency contacts serving Hiranandani Estate, Thane.
 *
 * Contact data lives in the CommunityContact table and is administered through
 * /admin/community. This module carries only the DB -> display mapping; there
 * is deliberately no bundled dataset. Categories and subcategories live in the
 * database too (see directory.ts and directory-categories.ts).
 */

export interface CommunityContact {
  id: string;
  /** Shop name, or the person's name for individual service providers */
  name: string;
  /** Person to ask for, when the listing is a shop */
  contactPerson?: string;
  /** DirectoryCategory.key */
  category: string;
  subcategoryId: string | null;
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
  subcategoryId: string | null;
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
    category: c.category,
    subcategoryId: c.subcategoryId,
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
