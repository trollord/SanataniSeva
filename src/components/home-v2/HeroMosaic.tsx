import Image from "next/image";
import { FileText, MapPin, Stethoscope, ShoppingBag } from "lucide-react";

export default function HeroMosaic() {
  return (
    <div className="grid grid-cols-2 gap-2.5 h-[520px]">

      {/* ── Left: tall property card ── */}
      <div className="relative rounded-2xl overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&auto=format&fit=crop&q=80"
          alt="3 BHK in Eden Park"
          fill
          sizes="20vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

        <span className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-[0.12em] bg-[#C8541A] text-white px-2 py-0.5 rounded-full">
          For Rent
        </span>

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white font-bold text-xs leading-tight">3 BHK · Eden Park</p>
          <p className="text-white/70 text-[11px] mt-0.5">₹65,000 / mo</p>
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-2.5 h-2.5 text-white/45 shrink-0" />
            <span className="text-[9px] text-white/45 truncate">Hiranandani Estate</span>
          </div>
        </div>
      </div>

      {/* ── Right column: 3 stacked cards ── */}
      <div className="flex flex-col gap-2.5">

        {/* Marketplace */}
        <div className="relative flex-1 rounded-2xl overflow-hidden bg-[#1C1C1C] p-3 flex flex-col justify-between">
          <Image
            src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&auto=format&fit=crop&q=80"
            alt="MacBook"
            fill
            sizes="10vw"
            className="object-cover opacity-20"
          />
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/35">Marketplace</span>
            <ShoppingBag className="w-3 h-3 text-white/20" />
          </div>
          <div className="relative z-10">
            <p className="text-white font-bold text-xs leading-tight">MacBook Pro M1</p>
            <p className="text-[#C8541A] font-extrabold text-sm">₹95,000</p>
            <span className="text-[9px] text-white/35 uppercase tracking-wide">Like New</span>
          </div>
        </div>

        {/* Community */}
        <div className="flex-1 rounded-2xl bg-[#F0EBE0] border border-[#DDD0B4] p-3 flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#8B7355]">Community</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#C8541A]/15 flex items-center justify-center shrink-0">
              <Stethoscope className="w-3 h-3 text-[#C8541A]" />
            </div>
            <div className="min-w-0">
              <p className="text-[#1C1C1C] font-bold text-[11px] leading-none truncate">Dr. R. Mehta</p>
              <p className="text-[#8B7355] text-[9px] mt-0.5">Cardiologist</p>
            </div>
          </div>
        </div>

        {/* News */}
        <div className="flex-1 rounded-2xl bg-[#1C1C1C] p-3 flex flex-col justify-between overflow-hidden relative">
          <div className="absolute inset-0 flex flex-col justify-center gap-1 px-3 opacity-[0.04]">
            {[...Array(5)].map((_, i) => <div key={i} className="h-px bg-white w-full" />)}
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/35">Estate News</span>
            <FileText className="w-3 h-3 text-white/20" />
          </div>
          <div className="relative z-10">
            <span className="text-[8px] font-bold uppercase tracking-[0.1em] bg-white text-[#1C1C1C] px-1.5 py-0.5 rounded-full">
              Latest
            </span>
            <p className="text-white font-bold text-[11px] mt-1.5 leading-snug">Weekly Edition</p>
            <p className="text-white/35 text-[9px] mt-0.5">Oct 2026 · 12 pages</p>
          </div>
        </div>

      </div>
    </div>
  );
}
