"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/Modal";

const CALLBACK_TIMES = ["Morning (9am–12pm)", "Afternoon (12pm–5pm)", "Evening (5pm–9pm)", "Anytime"];

interface Props {
  itemId: string;
  itemTitle: string;
  sellerName: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function ItemInterestModal({ itemId, itemTitle, sellerName, onSuccess, onClose }: Props) {
  const [message, setMessage] = useState("");
  const [callbackTime, setCallbackTime] = useState("Anytime");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/items/${itemId}/interest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), callbackTime }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Something went wrong");
        return;
      }

      onSuccess();
      toast.success(`Your message has been sent to ${sellerName.split(" ")[0]}!`);
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
      subtitle="Express Interest"
      title={`Message ${sellerName.split(" ")[0]}`}
      description={`Your message will be sent to the seller of "${itemTitle}". They'll contact you directly.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
            Your Message <span className="text-gray-400 normal-case tracking-normal font-normal text-[11px]">(required)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`e.g. I'm interested in this item, please call me at your convenience.`}
            rows={4}
            maxLength={400}
            autoFocus
            className="w-full border border-gray-200 rounded-sm px-3.5 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-gray-400 transition-colors resize-none"
          />
          <p className="text-[11px] text-gray-400 mt-1 text-right">{message.length}/400</p>
        </div>

        <div className="pt-1">
          <Button
            type="submit"
            disabled={loading || !message.trim()}
            className="w-full rounded-full bg-[#FF5F15] hover:bg-[#FF5F15]/90 text-white gap-2 py-5 text-sm font-medium tracking-wide transition-all duration-300 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Send Message
          </Button>
        </div>
      </form>

      <p className="text-[10px] text-center text-gray-400 mt-4 leading-relaxed">
        Your phone number is not shared — the seller will reply to your registered email.
      </p>
    </Modal>
  );
}
