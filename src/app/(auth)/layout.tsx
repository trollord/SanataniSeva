import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
        {/* Left panel - dark navy */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#FF5F15] flex-col justify-between p-12 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 h-64 w-64 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 h-48 w-48 bg-white/3 rounded-full -translate-x-1/3 translate-y-1/3" />

          <Link href="/" className="relative z-10">
            <span className="font-bold text-2xl text-white">
              Sanatani Community
            </span>
          </Link>

          <div className="relative z-10">
            <div className="h-px w-12 bg-white/30 mb-6" />
            <h2 className="font-[family-name:var(--font-playfair)] text-4xl font-bold text-white leading-tight mb-4">
              Discover Exceptional<br />
              <span className="text-white/70">Living in Hiranandani</span>
            </h2>
            <p className="text-white/60 leading-relaxed max-w-sm">
              Browse verified listings and connect directly with owners - completely free.
              Zero brokerage. Zero commissions.
            </p>
          </div>

          <div className="relative z-10 flex gap-8">
            {[
              { value: "Free", label: "Always free" },
              { value: "₹0", label: "Commissions" },
              { value: "Instant", label: "Contact access" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-white font-bold text-xl">{value}</p>
                <p className="text-white/50 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel - form */}
        <div className="flex-1 flex flex-col bg-[#FAF8F5]">
          {/* Mobile logo */}
          <div className="lg:hidden p-5">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-bold text-xl text-[#FF5F15]">
                Sanatani Community
              </span>
            </Link>
          </div>
          <div className="flex-1 flex items-center justify-center px-6 py-10">
            {children}
          </div>
        </div>
      </div>
  );
}
