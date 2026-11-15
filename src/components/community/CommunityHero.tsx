"use client";

import { motion } from "framer-motion";

const ease = [0.23, 1, 0.32, 1] as const;

// Contacts are managed only from /admin/community, so there is no add
// affordance on the public page - not even for admins.
//
// The heading is deliberately restrained: this screen is sized to one viewport
// and every pixel spent here is a row the resident cannot see. The
// display-size type is kept for phones, where vertical room is not the
// constraint.
export default function CommunityHero() {
  return (
    <motion.h1
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl lg:text-[26px] font-bold text-[#0B0B0C] leading-tight shrink-0"
    >
      Service Providers
    </motion.h1>
  );
}
