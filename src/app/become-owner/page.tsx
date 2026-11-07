"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Building2, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BecomeOwnerPage() {
  const { update } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleBecomeOwner() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/user/become-owner", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }
      // update() pushes the new role into the JWT cookie so the middleware
      // sees OWNER on the very next request - no sign-out required
      await update({ role: "OWNER" });
      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Gold top bar */}
          <div className="h-1.5 bg-[#FF5F15] rounded-t-xl" />

          <div className="p-8 text-center">
            <div className="inline-flex p-4 rounded-full bg-[#FF5F15]/5 mb-6">
              <Building2 className="h-8 w-8 text-[#FF5F15]" />
            </div>

            <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#FF5F15] mb-2">
              List Your Property
            </h1>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              To access the owner dashboard and list properties, activate your owner account.
              It&apos;s free and takes one click.
            </p>

            <ul className="text-left space-y-3 mb-8">
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

            {error && (
              <p className="text-sm text-red-500 mb-4">{error}</p>
            )}

            <Button
              onClick={handleBecomeOwner}
              disabled={loading}
              className="w-full bg-[#FF5F15] hover:bg-[#FF5F15]/90 text-white gap-2 py-5"
            >
              {loading ? "Activating…" : "Activate Owner Account - Free"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>

            <p className="text-xs text-gray-400 mt-4">
              No charges. You can still browse listings as a seeker anytime.
            </p>

            <a href="/listings" className="block mt-3">
              <button className="w-full border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 text-sm font-medium py-2.5 rounded-xl transition-colors duration-200">
                Continue as User
              </button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
