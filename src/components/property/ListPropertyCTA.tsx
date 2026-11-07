"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import BecomeOwnerModal from "@/components/property/BecomeOwnerModal";

export default function ListPropertyCTA() {
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
      <button
        onClick={handleClick}
        className="inline-block bg-white text-[#FF5F15] py-2.5 px-6 sm:py-4 sm:px-10 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base hover:opacity-90 transition-opacity"
      >
        List Your Property
      </button>
    </>
  );
}
