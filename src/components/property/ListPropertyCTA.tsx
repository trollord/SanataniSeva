"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import BecomeOwnerModal from "@/components/property/BecomeOwnerModal";

/** The pre-rebrand pill. Still the default so no existing caller changes. */
const DEFAULT_CLASS =
  "inline-block bg-white text-[#FF5F15] py-2.5 px-6 sm:py-4 sm:px-10 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base hover:opacity-90 transition-opacity";

export interface ListPropertyCTAProps {
  /**
   * Replaces the button's surface styling entirely. The point of this prop is
   * that the routing logic below — anonymous to /register, resident to the
   * become-owner modal, owner to /dashboard/new — is the valuable part and
   * should not have to be duplicated by a caller whose section runs a
   * different button system.
   */
  className?: string;
  /** Replaces the label. Defaults to "List Your Property". */
  children?: React.ReactNode;
}

export default function ListPropertyCTA({ className, children }: ListPropertyCTAProps = {}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  const isOwnerPlus = ["OWNER", "ADMIN"].includes(
    session?.user?.role ?? ""
  );

  function handleClick() {
    if (!session) {
      router.push("/register");
      return;
    }
    if (isOwnerPlus) {
      router.push("/dashboard/new");
    } else {
      setModalOpen(true);
    }
  }

  return (
    <>
      <BecomeOwnerModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <button onClick={handleClick} className={className ?? DEFAULT_CLASS}>
        {children ?? "List Your Property"}
      </button>
    </>
  );
}
