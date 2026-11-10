"use client";

import { motion } from "framer-motion";

const ease = [0.23, 1, 0.32, 1] as const;

const item = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease, delay },
});

// Contacts are managed only from /admin/community, so there is no add
// affordance on the public page - not even for admins.
//
// The heading is deliberately restrained: this screen is sized to one viewport
// and every pixel spent here is a row the resident cannot see. The strapline
// sits beside the title on a wide screen rather than under it, and the
// display-size type is kept for phones, where vertical room is not the
// constraint.
export default function CommunityHero() {
  return (
    <div className="shrink-0 flex flex-col lg:flex-row lg:items-baseline gap-1 lg:gap-5 min-w-0">
      <motion.h1
        {...item(0)}
        className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl lg:text-[26px] font-bold text-[#0B0B0C] leading-tight shrink-0"
      >
        Service Providers
      </motion.h1>
      <motion.p
        {...item(0.08)}
        className="text-gray-500 text-[13px] leading-snug lg:max-w-xl min-w-0"
      >
        Phone numbers for carpenters, plumbers, electricians, shopkeepers,
        tiffin services and more. Search by trade or name, then call or
        WhatsApp them directly.
      </motion.p>
    </div>
  );
}
