"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

type MR14AnimatedLogoProps = {
  className?: string;
  animate?: boolean;
  onComplete?: () => void;
  title?: string;
};

type LogoStroke = {
  id: string;
  d: string;
  revealWidth: number;
  delay: number;
  duration: number;
  clip: { x: number; y: number; width: number; height: number };
};

const LOGO_IMAGE = "/icons/mr14-logo-vector.svg";

const LOGO_STROKES: readonly LogoStroke[] = [
  { id: "circle-top", d: "M 188 126 C 307 42 493 43 616 151 C 716 240 733 417 658 535", revealWidth: 48, delay: 0, duration: 1.2, clip: { x: 160, y: 40, width: 560, height: 505 } },
  { id: "circle-bottom", d: "M 83 267 C 35 420 95 599 221 670 C 365 746 526 710 615 607", revealWidth: 48, delay: 0.2, duration: 1.1, clip: { x: 50, y: 255, width: 580, height: 470 } },
  { id: "m", d: "M 126 522 L 126 210 L 264 382 L 384 267 L 384 671", revealWidth: 56, delay: 0.46, duration: 0.98, clip: { x: 100, y: 190, width: 290, height: 490 } },
  { id: "diagonal-top", d: "M 151 150 L 290 290", revealWidth: 42, delay: 0.42, duration: 0.7, clip: { x: 120, y: 125, width: 195, height: 190 } },
  { id: "r", d: "M 390 252 L 525 252 C 638 252 638 394 520 394 L 437 394 L 694 603", revealWidth: 56, delay: 0.94, duration: 0.92, clip: { x: 390, y: 230, width: 315, height: 390 } },
  { id: "r-inner", d: "M 413 404 L 501 494", revealWidth: 42, delay: 1.72, duration: 0.28, clip: { x: 400, y: 390, width: 120, height: 125 } },
  { id: "fourteen", d: "M 439 628 L 439 535 L 420 543 M 531 628 L 531 535 L 480 601 L 549 601", revealWidth: 32, delay: 1.42, duration: 0.6, clip: { x: 400, y: 510, width: 175, height: 135 } },
] as const;

function LogoImage({ mask, clipPath }: { mask?: string; clipPath?: string }) {
  return (
    <image
      href={LOGO_IMAGE}
      x="0"
      y="0"
      width="768"
      height="768"
      preserveAspectRatio="xMidYMid meet"
      mask={mask}
      clipPath={clipPath}
    />
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

export function MR14AnimatedLogo({
  className,
  animate = true,
  onComplete,
  title = "MR14",
}: MR14AnimatedLogoProps) {
  const reduceMotion = usePrefersReducedMotion();
  const shouldDraw = animate && !reduceMotion;
  const instanceId = useId().replace(/:/g, "");
  const shineId = `mr14-shine-${instanceId}`;
  const shineMaskId = `mr14-shine-mask-${instanceId}`;

  useEffect(() => {
    if (!shouldDraw) onComplete?.();
  }, [onComplete, shouldDraw]);

  return (
    <svg
      viewBox="0 0 768 768"
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="geometricPrecision"
      role="img"
      aria-label={title}
      className={cn("mr14-animated-logo block overflow-visible", className)}
    >
      <defs>
        <linearGradient id={shineId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="white" stopOpacity="0" />
          <stop offset="0.5" stopColor="white" stopOpacity="0.55" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id={shineMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="768" height="768" style={{ maskType: "alpha" }}>
          <LogoImage />
        </mask>
        {shouldDraw && LOGO_STROKES.map((stroke) => (
          <clipPath key={`clip-${stroke.id}`} id={`mr14-clip-${stroke.id}-${instanceId}`} clipPathUnits="userSpaceOnUse">
            <rect {...stroke.clip} />
          </clipPath>
        ))}
        {shouldDraw && LOGO_STROKES.map((stroke) => (
          <mask key={`mask-${stroke.id}`} id={`mr14-draw-${stroke.id}-${instanceId}`} maskUnits="userSpaceOnUse" x="0" y="0" width="768" height="768">
            <rect width="768" height="768" fill="black" />
            <path
              className="mr14-draw-path"
              d={stroke.d}
              fill="none"
              stroke="white"
              strokeWidth={stroke.revealWidth}
              strokeLinecap="butt"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1}
              style={{ "--draw-delay": `${stroke.delay}s`, "--draw-duration": `${stroke.duration}s` } as CSSProperties}
            />
          </mask>
        ))}
      </defs>

      {shouldDraw ? (
        <>
          <g aria-hidden="true" className="mr14-traced-logo">
            {LOGO_STROKES.map((stroke) => (
              <LogoImage
                key={stroke.id}
                clipPath={`url(#mr14-clip-${stroke.id}-${instanceId})`}
                mask={`url(#mr14-draw-${stroke.id}-${instanceId})`}
              />
            ))}
          </g>
          <g aria-hidden="true" className="mr14-final-logo">
            <LogoImage />
          </g>
          <rect
            className="mr14-logo-shine"
            x="-210"
            y="0"
            width="150"
            height="768"
            fill={`url(#${shineId})`}
            mask={`url(#${shineMaskId})`}
            onAnimationEnd={onComplete}
          />
        </>
      ) : (
        <LogoImage />
      )}
    </svg>
  );
}
