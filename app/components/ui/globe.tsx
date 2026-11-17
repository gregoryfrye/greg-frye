"use client";

import { useEffect, useState } from "react";

/**
 * The globe mark, turning with the day. Three meridians, 60° apart, are drawn as ellipses whose width
 * follows the globe's rotation, so it reads as a sphere spinning. Its angle is the time of day in
 * Kingston (one turn per 24 hours): on load it spins up from rest to that angle (the slow reveal), then
 * keeps drifting. With reduced motion it simply shows the angle for now.
 *
 * Before mount it renders the static favicon pose (the same mark as /icon.svg), so server and client
 * agree. Ink lines at the line weight, however large it's drawn.
 */
const MERIDIANS = [0, 60, 120];
const DRIFT_DEGREES_PER_SECOND = 3; // one visible turn every two minutes; the day angle sets where it starts

function kingstonDayAngle(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return ((get("hour") * 3600 + get("minute") * 60 + get("second")) / 86400) * 360;
}

function durationMs(token: string, fallback: number): number {
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? (value.endsWith("ms") ? parsed : parsed * 1000) : fallback;
}

export function Globe({ className = "" }: { className?: string }) {
  const [angle, setAngle] = useState<number | null>(null);

  useEffect(() => {
    const target = kingstonDayAngle();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAngle(target);
      return;
    }
    // Spin up: an extra half turn plus the day angle, eased out over three slow reveals.
    const spinUp = durationMs("--duration-slow", 800) * 3;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      if (elapsed < spinUp) {
        const t = elapsed / spinUp;
        const eased = 1 - Math.pow(1 - t, 3);
        setAngle((target + 180) * eased);
      } else {
        setAngle(target + 180 + ((elapsed - spinUp) / 1000) * DRIFT_DEGREES_PER_SECOND);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={`fill-none stroke-current stroke-1 text-ink ${className}`}>
      <g strokeLinecap="round">
        <circle cx="16" cy="16" r="15" vectorEffect="non-scaling-stroke" />
        {angle === null ? (
          <>
            <ellipse cx="16" cy="16" rx="7.5" ry="15" vectorEffect="non-scaling-stroke" />
            <line x1="16" y1="1" x2="16" y2="31" vectorEffect="non-scaling-stroke" />
          </>
        ) : (
          MERIDIANS.map((offset) => {
            const rx = 15 * Math.abs(Math.sin(((angle + offset) * Math.PI) / 180));
            return <ellipse key={offset} cx="16" cy="16" rx={rx} ry="15" vectorEffect="non-scaling-stroke" />;
          })
        )}
        <line x1="1" y1="16" x2="31" y2="16" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}
