"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Building2, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/Modal";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function BecomeOwnerModal({ open, onClose }: Props) {
  const { update } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleActivate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/user/become-owner", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }
      await update({ role: "OWNER" });
      window.location.href = "/dashboard/new";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="text-center">
        <div className="inline-flex p-4 rounded-full bg-[#FF5F15]/5 mb-5">
          <Building2 className="h-8 w-8 text-[#FF5F15]" />
        </div>

        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#FF5F15] mb-2">
          List Your Property
        </h2>
        <p className="text-[13px] text-gray-500 mb-7 leading-relaxed">
          Activate your owner account to list properties.
          It&apos;s free and takes one click.
        </p>

        <ul className="text-left space-y-3 mb-7">
          {[
            "List properties in Hiranandani Estate for free",
            "Manage all your listings from one dashboard",
            "See interested seekers and their contact details",
            "Get notified when someone registers interest",
          ].map((point) => (
            <li key={point} className="flex items-start gap-2.5 text-sm text-gray-700">
              <CheckCircle2 className="h-4 w-4 text-[#FF5F15] mt-0.5 shrink-0" />
              {point}
            </li>
          ))}
        </ul>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <Button
          onClick={handleActivate}
          disabled={loading}
          className="w-full rounded-full bg-[#FF5F15] hover:bg-[#FF5F15]/90 text-white gap-2 py-5 text-sm font-medium tracking-wide"
        >
          {loading ? "Activating…" : "Activate Owner Account - Free"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </Button>

        <button
          onClick={onClose}
          className="w-full mt-3 border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 text-sm font-medium py-2.5 rounded-xl transition-colors duration-200"
        >
          Continue as User
        </button>

        <p className="text-xs text-gray-400 mt-4">
          No charges. You can still browse listings as a seeker anytime.
        </p>
      </div>
    </Modal>
  );
}
