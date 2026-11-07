"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/* ─────────────────────────────────────────────────────────────────────────────
   Hindu temple — skeletonized + centerline-traced SVG (585×503 coord space).
   3 parallax depth layers + idle wind sway on the spire tip.
   ViewBox: 0 -30 585 533  (30px headroom above for flag)
───────────────────────────────────────────────────────────────────────────── */

/* Layer 1 — Spire tip + amalaka (finial). Sways in wind. */
const PATH_TIP = "M309 39C306.267 48.0602 319.697 53.2484 317.671 63C315.674 72.6058 305.05 76.9817 300.028 66.9992C296.413 59.8143 301.562 49.619 307 45M305 74C293.734 84.1353 273.844 85.5654 273 104C290.597 102.611 309.628 106.235 327 103.765C330.278 103.298 342.022 105.138 343.106 101.681C347.543 87.5374 318.567 79.8358 311 74";

/* Layer 2 — Main temple body: central shikhara, side towers, doorway arch. */
const PATH_BODY = "M343 104C348.739 111.548 350.87 120.335 354.309 129C364.101 153.679 371.953 181.562 374.826 208C376.093 219.66 377.718 231.317 378.83 243C379.321 248.162 378.099 253.55 381.434 257.992C388.067 266.827 394.627 258.035 403 258.204C409.518 258.335 414.945 263.713 419.895 267.309C426.027 271.763 427.412 291.223 434.1 292.218C439.386 293.003 441.735 283.495 443.306 280C448.062 269.413 452.335 252.98 462.001 246.424C465.768 243.869 469.246 240.372 474 242.336C483.312 246.185 484.829 254.173 489.999 261.424C503.374 280.183 505.938 305.69 508.169 328C508.967 335.982 510.496 347.275 507.397 354.941C504.867 361.199 492.531 359.062 487 359.715C474.395 361.202 460.58 360.367 448 359.17C444.101 358.799 437.685 360.275 434.603 357.258C432.014 354.723 433 349.285 433 346L508 346M272 105C248.834 149.215 243.528 202.505 236.811 251C235.929 257.366 229.46 260.648 228.907 267C227.179 286.855 232 307.955 232 328L202 328.819L187.603 329.028L187 342L220 341L231.972 339.397L233 329M293 105L284.562 145L271.536 217L268.002 243L270.434 251.762L282 246.152L307 228.489L318 233.343L343.697 253.951L348.424 276L359.544 305L364 315M323 105L345 212L346 254M308 203L308 227M470 223L470 240M147 225L147.028 240.66L164 262L138 261.88L126.278 262.488L118.811 279L109.001 335L112.318 357.397L129 359.285L184 358L182.397 347.179L158 346.711L112 346M404 235L403 257M214 240C211.778 249.468 223.256 255.085 229 262M128 260C128.524 250.423 137.313 246.05 145 242M228 267C222.05 265.729 217.258 263.823 211 264.018C207.873 264.115 203.273 265.961 200.357 264.432C191.872 259.985 208.703 250.125 212 249M270 253L268.028 284.397L288 286L348 286M453 263L478.697 262.938L483.715 284L492 345M481 262L487 261M137 263L124 344M165 263L175.671 283L181.999 290.793L187.727 284L198 264M156 264L161.289 299L166 345M387 264L384 313L386.318 328.687L399 328.17L420 329L414.92 284L415 264M460 264L449 345M204 266L196 327M354 300L261 300L266 286M181 292L186 327M435 294L430.71 329L428.397 339.258L419 341L386.318 339.972L384 330M261 300C257.978 302.707 251.545 309.938 256.603 313.973C261.255 317.684 275.249 315 281 315L336 315C343.953 315 353.831 316.841 361 313M264 316L264.996 371L265.117 392.397L279 394L316 394L328.682 389.941L329 356L327.821 344.318L298 342.001L290.028 344.318L289 358L289 393M421 328L430 329M383 341L383 393M431 341L433 346M187 342L185 346M233 342C234.184 346.971 234 351.916 234 357C234 362.361 236.038 373.088 232.972 377.682C230.611 381.221 224.57 379.849 221 379.849C213.657 379.849 190.826 375.798 186.028 382.514C178.04 393.693 193.797 394 200 394L263 394M384 380C387.073 379.992 391.713 380.601 394.062 378.142C400.528 371.372 389.97 355.639 403.001 353.36C419.476 350.478 409.906 371.93 415.028 378.397C416.583 380.36 419.791 379.985 422 379.999C435.323 380.085 432 369.565 432 359M202 378C202.438 372.446 201.228 361.877 204.028 357.148C206.736 352.574 217.264 352.574 219.972 357.148C223.061 362.365 221 373.065 221 379";

/* Layer 3 — Base platform + steps (ground, least movement). */
const PATH_BASE = "M352 316L352 372L353.028 392.397L373 394L431 395C431 398.58 429.901 404.476 432.028 407.566C434.887 411.721 451.589 411.258 455.852 409.397C466.793 404.62 450.553 376.847 464.019 373.318C466.52 372.663 469.438 372.987 472 373.001C486.903 373.078 482.999 387.928 483 399C483 401.803 482.082 406.975 484.603 408.972C488.258 411.867 506.39 411.447 508.397 406.852C510.066 403.029 509 397.094 509 393C509 382.076 511.303 368.198 507 358M110 359C107.351 370.126 109.264 382.614 108.985 394C108.889 397.94 106.982 403.087 108.604 406.852C110.635 411.565 128.807 411.753 132.593 408.972C135.254 407.018 134.013 401.831 134.001 399C133.95 387.504 130.163 374.007 145 374C147.608 373.999 150.402 373.733 152.985 374.148C165.362 376.136 155.656 399.788 159.603 407.566C162.391 413.06 180.993 409.93 186 409L186 396M185 359L185 380M234 380L235 393M396 380L413 380M432 381L432 394M329 394L351 394M108 408C105.345 410.846 98.4176 418.962 102.643 423.062C107.333 427.613 121.942 425 128 425C151.577 425 175.921 423.573 199 425.915C206.377 426.664 214.444 424.708 222 425.039C233.39 425.538 249.093 428.699 259.995 425.107C268.101 422.437 263.073 416.134 267.603 411.603C271.459 407.748 283.899 410 289 410L329 410C334.234 410 341.997 408.572 346.891 410.603C354.37 413.708 348.13 423.627 358.001 425.671C364.237 426.961 371.598 425 378 425C394.493 425 410.994 425.444 427 424.151C454.547 421.927 485.25 423.825 513 424.188C519.438 424.272 525.255 431.813 521.012 437.682C517.303 442.812 500.76 440 495 440C469.68 440 444.24 439.188 419 439.188C336.838 439.188 254.164 440 172 440C149.745 440 122.761 444.202 101.005 439.656C90.944 437.553 96.0192 427.461 101 423M431 408L408 410L350 411M186 409L209 410L265 410M509 409L515 422M135 410L158 410M460 410L482 410M427 411L427 423M189 412L189 423M351 423L325 425L266 424M256 427L254 439M359 427L359 438M419 427L419 438M197 428L197 438";

export default function ParallaxTemple() {
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const sx = useSpring(rawX, { stiffness: 75, damping: 22 });
  const sy = useSpring(rawY, { stiffness: 75, damping: 22 });

  const idleX = useMotionValue(0);

  const bgX  = useTransform(sx, [-0.5, 0.5], [-4,   4]);
  const bgY  = useTransform(sy, [-0.5, 0.5], [-2,   2]);
  const midX = useTransform(sx, [-0.5, 0.5], [-10, 10]);
  const midY = useTransform(sy, [-0.5, 0.5], [-5,   5]);
  const fgXP = useTransform(sx, [-0.5, 0.5], [-18, 18]);
  const fgY  = useTransform(sy, [-0.5, 0.5], [-10, 10]);

  const totalFgX = useTransform(
    [fgXP, idleX],
    ([px, ix]) => (px as number) + (ix as number),
  );

  useEffect(() => {
    let frame: number;
    let t = 0;
    const tick = () => {
      t += 0.005;
      idleX.set(Math.sin(t) * 2.5);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [idleX]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    rawX.set((e.clientX - r.left) / r.width  - 0.5);
    rawY.set((e.clientY - r.top)  / r.height - 0.5);
  };

  useEffect(() => {
    function onTilt(e: DeviceOrientationEvent) {
      if (e.gamma != null) rawX.set(Math.max(-0.5, Math.min(0.5, e.gamma / 30)));
      if (e.beta  != null) rawY.set(Math.max(-0.5, Math.min(0.5, (e.beta - 45) / 30)));
    }
    if (window.matchMedia("(hover:none)").matches)
      window.addEventListener("deviceorientation", onTilt);
    return () => window.removeEventListener("deviceorientation", onTilt);
  }, [rawX, rawY]);

  const stroke = {
    fill: "none" as const,
    stroke: "#111111",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => { rawX.set(0); rawY.set(0); }}
      className="relative w-full max-w-[480px] select-none"
      style={{ aspectRatio: "585 / 533" }}
    >
      <svg
        viewBox="0 -30 585 533"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        style={{ background: "#FFF9F5" }}
      >
        <defs>
          <radialGradient id="tg" cx="52%" cy="58%" r="45%">
            <stop offset="0%"   stopColor="#FF5F15" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#FF5F15" stopOpacity="0"    />
          </radialGradient>
        </defs>
        <rect x="0" y="-30" width="585" height="563" fill="url(#tg)" />

        {/* BASE — platform & steps, grounded */}
        <motion.g style={{ x: bgX, y: bgY }}>
          <path d={PATH_BASE} {...stroke} strokeWidth={1.6} />
        </motion.g>

        {/* BODY — central shikhara, side towers, doorway */}
        <motion.g style={{ x: midX, y: midY }}>
          <path d={PATH_BODY} {...stroke} strokeWidth={1.8} />
        </motion.g>

        {/* SPIRE TIP + FLAG — sways in ambient wind */}
        <motion.g style={{ x: totalFgX, y: fgY }}>
          <path d={PATH_TIP} {...stroke} strokeWidth={1.8} />

          {/* Flag pole from spire tip upward */}
          <line
            x1="310" y1="38"
            x2="310" y2="-22"
            stroke="#111" strokeWidth="2" strokeLinecap="round"
          />

          {/* Saffron flag */}
          <path
            d="M310,-22 L310,18 L398,-2 Z"
            fill="#FF5F15"
            stroke="#C84400"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <line x1="312" y1="-10" x2="390" y2="0"  stroke="#FF9B60" strokeWidth="1.2" opacity="0.6" />
          <line x1="312" y1="6"   x2="385" y2="8"  stroke="#B03A00" strokeWidth="0.8" opacity="0.4" />
        </motion.g>
      </svg>
    </div>
  );
}
