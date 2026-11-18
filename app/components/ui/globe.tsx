"use client";

import { useEffect, useState } from "react";

/**
 * The globe mark, turning with the day. Six meridians, 30° apart, are drawn front side only (so the globe reads as solid, not wireframe), each following the
 * superellipse outline, whose width follows the globe's rotation, so it reads as a sphere spinning. Its angle is the time of day in
 * Kingston (one turn per 24 hours): on load it spins up from rest to that angle (the slow reveal), then
 * keeps drifting. With reduced motion it simply shows the angle for now.
 *
 * Drawn without a fixed aspect ratio: the caller sets the box (the hero stretches it to 2:1, wide and
 * flat), and the lines stay 1px however far it stretches. Parallels every 30° (the equator and ±30°, ±60°) stay put. Before mount it renders angle 0, so server
 * and client agree. Ink lines at the line weight, however large it's drawn.
 */
const MERIDIANS = [0, 30, 60, 90, 120, 150];
// The outline is |x|^n + y^2 = 1: n = 2 is a circle; a higher n flattens the top and bottom while the
// sides stay fully round (the old printed-globe mark). Every line follows the same curve.
const SQUARENESS = 3;
const SAMPLES = 48;
/** Half-width of the globe at height v (-1 top … 1 bottom), as a fraction of its radius. */
function halfWidth(v: number): number {
  return Math.pow(Math.max(0, 1 - v * v), 1 / SQUARENESS);
}
function point(u: number, v: number): string {
  return `${(16 + 15 * u * halfWidth(v)).toFixed(3)} ${(16 + 15 * v).toFixed(3)}`;
}
/** Heights from top to bottom, denser near the poles, where the curve turns fastest. */
const HEIGHTS = Array.from({ length: SAMPLES + 1 }, (_, i) => -Math.cos((Math.PI * i) / SAMPLES));
/** A vertical line at horizontal fraction u (-1 … 1 of the half-width at each height), top to bottom. */
function verticalPath(u: number): string {
  return HEIGHTS.map((v, i) => `${i === 0 ? "M" : "L"}${point(u, v)}`).join(" ");
}
// Down the right side, back up the left.
const OUTLINE = `${verticalPath(1)} ${[...HEIGHTS].reverse().map((v) => `L${point(-1, v)}`).join(" ")} Z`;
// Seen side-on, a parallel at latitude φ is a straight chord at height sin φ, as wide as the outline there.
const PARALLELS = [-60, -30, 0, 30, 60].map((degrees) => {
  const radians = (degrees * Math.PI) / 180;
  const v = -Math.sin(radians);
  return { y: 16 + 15 * v, half: 15 * halfWidth(v) };
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
        <path d={OUTLINE} vectorEffect="non-scaling-stroke" />
        {MERIDIANS.map((offset) => {
          // Each ellipse is a meridian and its opposite; only the half on the near side is drawn, so the
          // globe reads as solid (nothing shows through from behind). That half sits right of center when
          // sin 2θ > 0, left otherwise.
          const theta = ((angle + offset) * Math.PI) / 180;
          const side = Math.sin(2 * theta) >= 0 ? 1 : -1;
          return (
            <path key={offset} d={verticalPath(side * Math.abs(Math.sin(theta)))} vectorEffect="non-scaling-stroke" />
          );
        })}
        {PARALLELS.map(({ y, half }) => (
          <line key={y} x1={16 - half} y1={y} x2={16 + half} y2={y} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
    </svg>
  );
}
