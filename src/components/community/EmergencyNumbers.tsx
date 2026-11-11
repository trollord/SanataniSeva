import { Phone } from "lucide-react";
import type { DbCommunityContact } from "@/lib/community";

const PF = "font-[family-name:var(--font-playfair)]";

const tel = (p: string) => `tel:${p.replace(/\s/g, "")}`;

/** Short codes (100, 108, 14567) are the ones dialled in a hurry, so they lead. */
const isShortCode = (p: string) => p.replace(/\D/g, "").length <= 5;

/**
 * Emergency and helpline numbers, read only.
 *
 * These are the directory's own `emergency` category, lifted out of the search
 * table into a flat list: nobody should have to filter 24 categories to find
 * the fire brigade. Grouped by the `service` each contact was filed under.
 */
export default function EmergencyNumbers({ contacts }: { contacts: DbCommunityContact[] }) {
  if (contacts.length === 0) return null;

  const groups = new Map<string, DbCommunityContact[]>();
  for (const c of contacts) {
    const key = c.service.trim() || "Other";
    groups.set(key, [...(groups.get(key) ?? []), c]);
  }

  const sections = [...groups.entries()]
    .map(([service, items]) => ({
      service,
      items: [...items].sort(
        (a, b) =>
          Number(isShortCode(b.phones[0])) - Number(isShortCode(a.phones[0])) ||
          a.name.localeCompare(b.name)
      ),
    }))
    // "Emergency Contact" before helplines, blood banks and the rest.
    .sort(
      (a, b) =>
        Number(/emergency/i.test(b.service)) - Number(/emergency/i.test(a.service)) ||
        a.service.localeCompare(b.service)
    );

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-6 mb-6 sm:mb-8">
        <h2 className={`${PF} text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight`}>
          Emergency numbers
        </h2>
        <p className="text-[#6B6B6B] text-sm">Tap a number to call it directly</p>
      </div>

      <div className="border-t border-[#EDE5D8]">
        {sections.map(({ service, items }) => (
          <div
            key={service}
            className="grid grid-cols-1 md:grid-cols-[minmax(0,15rem)_1fr] gap-3 md:gap-8 py-5 sm:py-6 border-b border-[#EDE5D8]"
          >
            <h3 className="text-[13px] font-bold text-[#C8541A]">{service}</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {items.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[#EDE5D8] bg-white px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-[#1C1C1C] leading-snug truncate">
                      {c.name}
                    </p>
                    <div className="flex flex-wrap gap-x-3">
                      {c.phones.map((p) => (
                        <a
                          key={p}
                          href={tel(p)}
                          className="text-[13px] tabular-nums text-[#6B6B6B] hover:text-[#C8541A] whitespace-nowrap transition-colors"
                        >
                          {p}
                        </a>
                      ))}
                    </div>
                  </div>
                  <a
                    href={tel(c.phones[0])}
                    aria-label={`Call ${c.name}`}
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 bg-[#FF5F15] text-white rounded-full px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
