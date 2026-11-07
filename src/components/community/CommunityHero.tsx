"use client";

import { motion } from "framer-motion";
import AddContactModal from "@/components/community/AddContactModal";

const ease = [0.23, 1, 0.32, 1] as const;

const item = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease, delay },
});

export default function CommunityHero({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
      <div>
        <motion.p
          {...item(0)}
          className="text-[10px] font-semibold tracking-[0.25em] text-gray-400 uppercase mb-3"
        >
          Service Providers
        </motion.p>
        <motion.h1
          {...item(0.08)}
          className="font-[family-name:var(--font-playfair)] text-3xl sm:text-5xl font-bold text[#0B0B0C] mb-4"
        >
          Service Providers
        </motion.h1>
        <motion.p
          {...item(0.16)}
          className="text-gray-500 text-sm sm:text-base leading-relaxed max-w-2xl"
        >
          Phone numbers for carpenters, plumbers, electricians, shopkeepers,
          tiffin services and more. Search by trade or name, then call or
          WhatsApp them directly.
        </motion.p>
      </div>
      {isAdmin && (
        <motion.div {...item(0.24)} className="shrink-0">
          <AddContactModal />
        </motion.div>
      )}
    </div>
  );
}
