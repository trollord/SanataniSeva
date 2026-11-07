"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, LogIn, Heart } from "lucide-react";
import InterestModal from "@/components/property/InterestModal";

interface Props {
  propertyId: string;
  hasRegistered: boolean;
  isLoggedIn: boolean;
  userName?: string;
  userEmail?: string;
  autoOpen?: boolean;
}

export default function InquiryButton({
  propertyId,
  hasRegistered,
  isLoggedIn,
  userName = "",
  userEmail = "",
  autoOpen = false,
}: Props) {
  const [registered, setRegistered] = useState(hasRegistered);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (autoOpen && isLoggedIn && !registered) {
      setShowModal(true);
    }
  }, [autoOpen, isLoggedIn, registered]);

  // Not logged in
  if (!isLoggedIn) {
    return (
      <Link href={`/login?callbackUrl=/listings/${propertyId}%3FshowInterest%3D1`}>
        <Button className="w-full rounded-full bg-[#FF5F15] hover:bg-[#FF5F15]/90 text-white gap-2 py-5 text-sm font-medium tracking-wide transition-all duration-300">
          <LogIn className="h-4 w-4" />
          Interested
        </Button>
      </Link>
    );
  }

  // Already registered
  if (registered) {
    return (
      <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
        <CheckCircle2 className="h-5 w-5 text-[#FF5F15] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-[#FF5F15]">Interested</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            The owner has been notified and may reach out to you directly.
          </p>
        </div>
      </div>
    );
  }

  // Logged in, not yet registered
  return (
    <>
      <Button
        className="w-full rounded-full bg-[#FF5F15] hover:bg-[#FF5F15]/90 text-white gap-2 text-sm py-5 font-medium tracking-wide transition-all duration-300"
        onClick={() => setShowModal(true)}
      >
        <Heart className="h-4 w-4" />
        Interested
      </Button>

      {showModal && (
        <InterestModal
          propertyId={propertyId}
          userName={userName}
          userEmail={userEmail}
          onSuccess={() => {
            setShowModal(false);
            setRegistered(true);
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
