"use client";

import { useEffect, useState } from "react";

/**
 * The globe mark, turning with the day. Six meridians, 30° apart, are drawn as ellipses whose width
 * follows the globe's rotation, so it reads as a sphere spinning. Its angle is the time of day in
 * Kingston (one turn per 24 hours): on load it spins up from rest to that angle (the slow reveal), then
 * keeps drifting. With reduced motion it simply shows the angle for now.
 *
 * Drawn without a fixed aspect ratio: the caller sets the box (the hero stretches it to 2:1, wide and
 * flat), and the lines stay 1px however far it stretches. Parallels every 30° (the equator and ±30°, ±60°) stay put. Before mount it renders angle 0, so server
 * and client agree. Ink lines at the line weight, however large it's drawn.
 */
const MERIDIANS = [0, 30, 60, 90, 120, 150];
// Seen side-on, a parallel at latitude φ is a straight chord at height sin φ, half as wide as cos φ.
const PARALLELS = [-60, -30, 0, 30, 60].map((degrees) => {
  const radians = (degrees * Math.PI) / 180;
  return { y: 16 - 15 * Math.sin(radians), half: 15 * Math.cos(radians) };
});
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
  const [angle, setAngle] = useState(0);

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
    <svg viewBox="0 0 32 32" preserveAspectRatio="none" aria-hidden="true" className={`fill-none stroke-current stroke-1 text-ink ${className}`}>
      <g strokeLinecap="round">
        <circle cx="16" cy="16" r="15" vectorEffect="non-scaling-stroke" />
        {MERIDIANS.map((offset) => {
          const rx = 15 * Math.abs(Math.sin(((angle + offset) * Math.PI) / 180));
          return <ellipse key={offset} cx="16" cy="16" rx={rx} ry="15" vectorEffect="non-scaling-stroke" />;
        })}
        {PARALLELS.map(({ y, half }) => (
          <line key={y} x1={16 - half} y1={y} x2={16 + half} y2={y} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
    </svg>
  );
}
