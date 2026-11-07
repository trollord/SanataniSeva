"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import PhoneInput from "@/components/ui/PhoneInput";
import { validatePhone } from "@/lib/validations/phone";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/Modal";

const CALLBACK_TIMES = ["Morning (9am–12pm)", "Afternoon (12pm–5pm)", "Evening (5pm–9pm)", "Anytime"];

interface Props {
  propertyId: string;
  userName: string;
  userEmail: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function InterestModal({
  propertyId,
  userName,
  userEmail,
  onSuccess,
  onClose,
}: Props) {
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [message, setMessage] = useState("");
  const [callbackTime, setCallbackTime] = useState("Anytime");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validatePhone(phone);
    if (err) { setPhoneError(err); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/inquire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), message, callbackTime }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to register interest");
        return;
      }

      onSuccess();
      toast.success("Interest registered! The owner will review and may reach out to you.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      subtitle="Register Interest"
      title="Confirm your details"
      description="The owner will use these details to reach out to you directly."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name - read-only */}
        <div>
          <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            value={userName}
            readOnly
            className="w-full border border-gray-200 bg-[#fafafa] rounded-sm px-3.5 py-3 text-sm text-gray-500 cursor-default outline-none"
          />
        </div>

        {/* Email - read-only */}
        <div>
          <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={userEmail}
            readOnly
            className="w-full border border-gray-200 bg-[#fafafa] rounded-sm px-3.5 py-3 text-sm text-gray-500 cursor-default outline-none"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-1.5">
            Contact Number <span className="text-gray-400 normal-case tracking-normal font-normal text-[11px]">(required)</span>
          </label>
          <PhoneInput
            value={phone}
            onChange={(v) => { setPhone(v); setPhoneError(""); }}
            error={!!phoneError}
            autoFocus
          />
          {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
        </div>

        {/* Best time to call */}
        <div>
          <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-1.5">
            Best Time to Call
          </label>
          <div className="flex flex-wrap gap-2">
            {CALLBACK_TIMES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setCallbackTime(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  callbackTime === t
                    ? "bg-[#0B0B0C] text-white border-[#0B0B0C]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-1.5">
            Message <span className="text-gray-400 normal-case tracking-normal font-normal text-[11px]">(optional)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. I'm interested in a 2-year lease, available from January..."
            rows={3}
            maxLength={400}
            className="w-full border border-gray-200 rounded-sm px-3.5 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-gray-400 transition-colors resize-none"
          />
        </div>

        <div className="pt-1">
          <Button
            type="submit"
            disabled={loading || !phone.trim()}
            className="w-full rounded-full bg-[#FF5F15] hover:bg-[#FF5F15]/90 text-white gap-2 py-5 text-sm font-medium tracking-wide transition-all duration-300 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Confirm Interest
          </Button>
        </div>
      </form>

      <p className="text-[10px] text-center text-gray-400 mt-4 leading-relaxed tracking-wide">
        100% Verified Property
      </p>
    </Modal>
  );
}
