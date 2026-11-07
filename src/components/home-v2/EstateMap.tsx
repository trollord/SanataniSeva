"use client";

// Pin coordinates are in the "flat map" space (0-0 to 340-380),
// then projected onto each panel by the clip/transform.
const LEFT_PINS = [
  { x: 90,  y: 140, type: "listing"   as const, label: "2 BHK · ₹42k" },
  { x: 60,  y: 240, type: "listing"   as const, label: "1 BHK · ₹28k" },
  { x: 130, y: 300, type: "community" as const, label: "Euro School"   },
  { x: 80,  y: 190, type: "market"    as const, label: "Sofa · ₹18k"  },
];

const RIGHT_PINS = [
  { x: 230, y: 120, type: "listing"   as const, label: "3 BHK · ₹68k"  },
  { x: 290, y: 240, type: "listing"   as const, label: "4 BHK · ₹1.1Cr"},
  { x: 260, y: 300, type: "community" as const, label: "Dr. Sharma"     },
  { x: 310, y: 160, type: "market"    as const, label: "Scooter · ₹72k" },
];

const PIN_COLOR = {
  listing:   "#C8541A",
  market:    "#1C1C1C",
  community: "#2A7A4B",
};

const PIN_LABEL = {
  listing:   "Home",
  market:    "Sale",
  community: "Local",
};

export default function EstateMap() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      <svg
        viewBox="0 0 500 460"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-2xl"
        aria-label="Hiranandani Estate illustrated map"
      >
        <defs>
          {/* ── Animations ── */}
          <style>{`
            @keyframes pp { 0%,100%{r:8;opacity:.2} 60%{r:16;opacity:0} }
            .pr  { animation: pp 2.6s ease-out infinite; }
            .pr2 { animation: pp 2.6s ease-out infinite .9s; }
            .pr3 { animation: pp 2.6s ease-out infinite 1.8s; }
          `}</style>

          {/* ── Paper grunge texture ── */}
          <filter id="grunge" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" stitchTiles="stitch" result="noise"/>
            <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise"/>
            <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="blended"/>
            <feComposite in="blended" in2="SourceGraphic" operator="in"/>
          </filter>

          {/* ── Soft drop shadow for whole map ── */}
          <filter id="mapShadow" x="-15%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="12" stdDeviation="18" floodColor="#8B7355" floodOpacity="0.35"/>
          </filter>

          {/* ── Crease gradient ── */}
          <linearGradient id="creaseL" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="transparent"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0.18)"/>
          </linearGradient>
          <linearGradient id="creaseR" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.18)"/>
            <stop offset="100%" stopColor="transparent"/>
          </linearGradient>

          {/* ── Left panel clip ── */}
          <clipPath id="leftClip">
            <polygon points="30,30 248,10 252,450 28,440"/>
          </clipPath>

          {/* ── Right panel clip ── */}
          <clipPath id="rightClip">
            <polygon points="252,10 472,30 474,440 248,450"/>
          </clipPath>

          {/* ── Parchment gradient ── */}
          <linearGradient id="parchL" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#EEE4CC"/>
            <stop offset="100%" stopColor="#DDD0B0"/>
          </linearGradient>
          <linearGradient id="parchR" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E8DBC0"/>
            <stop offset="100%" stopColor="#D8CAA8"/>
          </linearGradient>

          {/* ── Water shimmer ── */}
          <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A8D8EA"/>
            <stop offset="100%" stopColor="#7BBFD8"/>
          </linearGradient>
        </defs>

        {/* ════════════════════════════════════════
            WHOLE MAP GROUP — drop shadow
        ════════════════════════════════════════ */}
        <g filter="url(#mapShadow)">

          {/* ══════════════════════════════════
              LEFT PANEL
          ══════════════════════════════════ */}
          <g clipPath="url(#leftClip)">
            {/* Parchment base */}
            <polygon points="30,30 248,10 252,450 28,440" fill="url(#parchL)"/>

            {/* Green terrain blobs */}
            <path d="M 40 60 Q 80 40 130 70 Q 160 90 140 130 Q 120 160 80 150 Q 40 140 30 110 Z" fill="#8BC34A" opacity="0.75"/>
            <path d="M 50 200 Q 90 180 120 210 Q 140 235 110 260 Q 80 280 50 260 Q 30 245 40 220 Z" fill="#7AB840" opacity="0.7"/>
            <path d="M 70 320 Q 120 300 160 330 Q 175 355 140 375 Q 100 390 60 375 Q 35 360 50 340 Z" fill="#8BC34A" opacity="0.65"/>
            <path d="M 160 140 Q 200 120 230 150 Q 245 175 220 195 Q 195 210 165 190 Q 148 170 160 148 Z" fill="#6FA832" opacity="0.6"/>

            {/* River — wavy blue cutting through */}
            <path
              d="M 30 170 Q 70 155 100 175 Q 135 198 115 225 Q 100 248 130 265 Q 165 282 155 310 Q 145 335 170 355 Q 185 368 200 360"
              stroke="url(#water)" strokeWidth="14" strokeLinecap="round" fill="none" opacity="0.9"
            />
            <path
              d="M 30 170 Q 70 155 100 175 Q 135 198 115 225 Q 100 248 130 265 Q 165 282 155 310 Q 145 335 170 355 Q 185 368 200 360"
              stroke="#A8D8EA" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.5"
            />

            {/* Roads */}
            <path d="M 30 250 Q 130 240 250 248" stroke="#C8B890" strokeWidth="5" strokeLinecap="round" opacity="0.6"/>
            <path d="M 140 15 Q 138 200 142 450" stroke="#C8B890" strokeWidth="4" strokeLinecap="round" opacity="0.5"/>

            {/* Building clusters */}
            <rect x="42"  y="75"  width="22" height="28" rx="2" fill="#C8B890" stroke="#B0A070" strokeWidth="0.8" opacity="0.8"/>
            <rect x="70"  y="80"  width="16" height="22" rx="2" fill="#C0B088" stroke="#B0A070" strokeWidth="0.8" opacity="0.8"/>
            <rect x="92"  y="72"  width="20" height="18" rx="2" fill="#C8B890" stroke="#B0A070" strokeWidth="0.8" opacity="0.7"/>
            <rect x="45"  y="290" width="24" height="30" rx="2" fill="#C8B890" stroke="#B0A070" strokeWidth="0.8" opacity="0.8"/>
            <rect x="76"  y="298" width="18" height="24" rx="2" fill="#C0B088" stroke="#B0A070" strokeWidth="0.8" opacity="0.8"/>
            <rect x="160" y="160" width="20" height="26" rx="2" fill="#C8B890" stroke="#B0A070" strokeWidth="0.8" opacity="0.7"/>
            <rect x="185" y="155" width="16" height="20" rx="2" fill="#C0B088" stroke="#B0A070" strokeWidth="0.8" opacity="0.7"/>

            {/* Tree symbols */}
            {[[60,175],[115,145],[80,355],[155,200],[95,310]].map(([tx,ty],i) => (
              <g key={i} transform={`translate(${tx},${ty})`} opacity="0.7">
                <polygon points="0,-9 7,4 -7,4" fill="#5A9B2A"/>
                <polygon points="0,-14 5,0 -5,0" fill="#6AAB3A"/>
                <rect x="-1.5" y="4" width="3" height="5" fill="#8B6A3A"/>
              </g>
            ))}

            {/* Dashed route */}
            <path
              d="M 90 140 Q 110 170 80 190 Q 60 210 130 300"
              stroke="#C8541A" strokeWidth="2" strokeDasharray="6,4"
              fill="none" opacity="0.7" strokeLinecap="round"
            />

            {/* Pins */}
            {LEFT_PINS.map((pin, i) => {
              const col = PIN_COLOR[pin.type];
              const rc = i % 3 === 0 ? "pr" : i % 3 === 1 ? "pr2" : "pr3";
              return (
                <g key={i}>
                  <circle cx={pin.x} cy={pin.y} r="8" fill={col} className={rc}/>
                  <circle cx={pin.x} cy={pin.y} r="7" fill={col} stroke="white" strokeWidth="1.5"/>
                  <circle cx={pin.x} cy={pin.y} r="2.5" fill="white"/>
                </g>
              );
            })}

            {/* Grunge texture overlay */}
            <polygon points="30,30 248,10 252,450 28,440" fill="#C8A870" opacity="0.06" filter="url(#grunge)"/>

            {/* Left edge shadow (page curl feel) */}
            <polygon points="30,30 248,10 252,450 28,440" fill="url(#creaseL)" opacity="0.4"/>
          </g>

          {/* ══════════════════════════════════
              RIGHT PANEL
          ══════════════════════════════════ */}
          <g clipPath="url(#rightClip)">
            {/* Parchment base — slightly darker */}
            <polygon points="252,10 472,30 474,440 248,450" fill="url(#parchR)"/>

            {/* Green terrain blobs */}
            <path d="M 470 50 Q 420 30 370 60 Q 340 85 360 130 Q 380 160 420 150 Q 460 140 472 110 Z" fill="#8BC34A" opacity="0.75"/>
            <path d="M 460 200 Q 420 185 390 215 Q 375 238 400 260 Q 425 278 460 262 Q 478 248 470 225 Z" fill="#7AB840" opacity="0.7"/>
            <path d="M 440 330 Q 395 308 355 335 Q 338 358 365 378 Q 398 394 438 378 Q 465 362 455 342 Z" fill="#8BC34A" opacity="0.65"/>
            <path d="M 270 130 Q 300 110 330 140 Q 348 165 322 185 Q 296 200 270 182 Q 255 165 268 145 Z" fill="#6FA832" opacity="0.6"/>

            {/* River continues from left panel */}
            <path
              d="M 252 360 Q 270 352 285 330 Q 302 305 330 295 Q 360 288 375 260 Q 388 238 375 215"
              stroke="url(#water)" strokeWidth="14" strokeLinecap="round" fill="none" opacity="0.9"
            />
            <path
              d="M 252 360 Q 270 352 285 330 Q 302 305 330 295 Q 360 288 375 260 Q 388 238 375 215"
              stroke="#A8D8EA" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.5"
            />

            {/* Roads */}
            <path d="M 252 248 Q 360 242 472 250" stroke="#C8B890" strokeWidth="5" strokeLinecap="round" opacity="0.6"/>
            <path d="M 360 12 Q 358 200 355 450" stroke="#C8B890" strokeWidth="4" strokeLinecap="round" opacity="0.5"/>

            {/* Building clusters */}
            <rect x="390" y="72"  width="22" height="28" rx="2" fill="#C8B890" stroke="#B0A070" strokeWidth="0.8" opacity="0.8"/>
            <rect x="420" y="78"  width="16" height="22" rx="2" fill="#C0B088" stroke="#B0A070" strokeWidth="0.8" opacity="0.8"/>
            <rect x="445" y="70"  width="18" height="18" rx="2" fill="#C8B890" stroke="#B0A070" strokeWidth="0.8" opacity="0.7"/>
            <rect x="395" y="290" width="24" height="30" rx="2" fill="#C8B890" stroke="#B0A070" strokeWidth="0.8" opacity="0.8"/>
            <rect x="425" y="298" width="18" height="24" rx="2" fill="#C0B088" stroke="#B0A070" strokeWidth="0.8" opacity="0.8"/>
            <rect x="258" y="160" width="20" height="24" rx="2" fill="#C8B890" stroke="#B0A070" strokeWidth="0.8" opacity="0.7"/>
            <rect x="284" y="155" width="16" height="20" rx="2" fill="#C0B088" stroke="#B0A070" strokeWidth="0.8" opacity="0.7"/>

            {/* Tree symbols */}
            {[[420,178],[370,145],[400,355],[265,200],[340,310]].map(([tx,ty],i) => (
              <g key={i} transform={`translate(${tx},${ty})`} opacity="0.7">
                <polygon points="0,-9 7,4 -7,4" fill="#5A9B2A"/>
                <polygon points="0,-14 5,0 -5,0" fill="#6AAB3A"/>
                <rect x="-1.5" y="4" width="3" height="5" fill="#8B6A3A"/>
              </g>
            ))}

            {/* Dashed route */}
            <path
              d="M 230 120 Q 260 150 295 140 Q 330 132 310 165 Q 290 200 260 300"
              stroke="#C8541A" strokeWidth="2" strokeDasharray="6,4"
              fill="none" opacity="0.7" strokeLinecap="round"
            />

            {/* Pins */}
            {RIGHT_PINS.map((pin, i) => {
              const col = PIN_COLOR[pin.type];
              const rc = i % 3 === 0 ? "pr" : i % 3 === 1 ? "pr2" : "pr3";
              return (
                <g key={i}>
                  <circle cx={pin.x} cy={pin.y} r="8" fill={col} className={rc}/>
                  <circle cx={pin.x} cy={pin.y} r="7" fill={col} stroke="white" strokeWidth="1.5"/>
                  <circle cx={pin.x} cy={pin.y} r="2.5" fill="white"/>
                </g>
              );
            })}

            {/* Grunge texture overlay */}
            <polygon points="252,10 472,30 474,440 248,450" fill="#C8A870" opacity="0.06" filter="url(#grunge)"/>

            {/* Right edge shadow */}
            <polygon points="252,10 472,30 474,440 248,450" fill="url(#creaseR)" opacity="0.4"/>
          </g>

          {/* ══════════════════════════════════
              CENTER CREASE
          ══════════════════════════════════ */}
          {/* Shadow on left panel edge */}
          <rect x="236" y="10" width="16" height="440" fill="url(#creaseL)" opacity="0.6"/>
          {/* Highlight on right panel edge */}
          <rect x="252" y="10" width="14" height="440" fill="url(#creaseR)" opacity="0.5"/>
          {/* Hard crease line */}
          <line x1="250" y1="10" x2="250" y2="450" stroke="rgba(80,60,30,0.25)" strokeWidth="2"/>

          {/* ══════════════════════════════════
              ESTATE TITLE — bottom of map
          ══════════════════════════════════ */}
          <text x="250" y="438" textAnchor="middle" fontSize="8.5" fill="#8B7355" fontWeight="700" letterSpacing="0.22em" opacity="0.7">
            HIRANANDANI ESTATE
          </text>

        </g>{/* end mapShadow group */}

        {/* ══════════════════════════════════
            PAGE CURL / OUTER EDGES
        ══════════════════════════════════ */}
        {/* Left outer edge darkening */}
        <polygon points="28,30 55,28 55,445 28,442" fill="rgba(80,60,20,0.12)"/>
        {/* Right outer edge darkening */}
        <polygon points="446,30 472,32 474,442 446,442" fill="rgba(80,60,20,0.12)"/>

      </svg>

      {/* ── Legend ── */}
      <div className="absolute bottom-8 left-8 bg-[#EEE4CC]/95 backdrop-blur-sm rounded-lg px-3 py-2.5 flex flex-col gap-1.5 shadow-md border border-[#C8B890]/40">
        <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#8B7355] mb-0.5">Map Key</p>
        {(["listing", "market", "community"] as const).map((type) => (
          <div key={type} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/50" style={{ background: PIN_COLOR[type] }}/>
            <span className="text-[10px] font-semibold text-[#5A4A30] uppercase tracking-wide">
              {PIN_LABEL[type]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
