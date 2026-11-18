"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

/**
 * The globe mark, turning with the day. Meridians every 36° are drawn front side only (so the globe reads as solid, not wireframe), each following the
 * superellipse outline, whose width follows the globe's rotation, so it reads as a sphere spinning. Its angle is the time of day in
 * Kingston (one turn per 24 hours): on load it spins up from rest to that angle (the slow reveal), then
 * keeps drifting. With reduced motion it simply shows the angle for now.
 *
 * It's a toy you can hold: tap (or Enter / Space) stops it or starts it again; drag sideways (or the
 * arrow keys) turns it, and a flick keeps it spinning until friction settles it back to its drift, or to
 * rest if it was stopped. Vertical swipes still scroll the page.
 *
 * Drawn without a fixed aspect ratio: the caller sets the box (the hero stretches it to 2:1, wide and
 * flat), and the lines stay 1px however far it stretches. Parallels at the equator and the quarter lines stay put. Before mount it renders angle 0, so server
 * and client agree. Ink lines at the line weight, however large it's drawn.
 */
// Ten meridians evenly spaced, 36° apart (each ellipse also carries the one opposite it), so the near
// face always shows about five lines however the globe is turned.
const MERIDIANS = [0, 36, 72, 108, 144];
// The outline is |x|^n + y^2 = 1: n = 2 is a circle; a higher n flattens the top and bottom while the
// sides stay fully round (the old printed-globe mark). Every line follows the same curve.
const SQUARENESS = 3;
const SAMPLES = 48;
// The poles are flat lines, not points: the top and bottom edges run straight for this share of the width,
// and the meridians fan out along them (like a flat-polar map projection).
const POLE_WIDTH = 0.25;
/** Half-width of the globe at height v (-1 top … 1 bottom), as a fraction of its radius. */
function halfWidth(v: number): number {
  const pole = POLE_WIDTH / 2;
  return pole + (1 - pole) * Math.pow(Math.max(0, 1 - v * v), 1 / SQUARENESS);
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
// Three: the equator and ±30°, which land exactly on the quarter lines (sin 30° = ½).
const PARALLELS = [-30, 0, 30].map((degrees) => {
  const radians = (degrees * Math.PI) / 180;
  const v = -Math.sin(radians);
  return { y: 16 + 15 * v, half: 15 * halfWidth(v) };
});
const DRIFT_DEGREES_PER_SECOND = 3; // one visible turn every two minutes; the day angle sets where it starts
const DRAG_DEGREES_PER_WIDTH = 180; // dragging across the whole globe turns it half a revolution
const FRICTION_PER_SECOND = 2.5; // how fast a flick settles back to the drift
const TAP_SLOP_PX = 6; // movement under this counts as a tap, not a drag
const KEY_STEP_DEGREES = 15;

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
  const [paused, setPaused] = useState(false);
  const state = useRef({ angle: 0, velocity: 0, paused: false, reduced: false, dragging: false, spinningUp: true });
  const drag = useRef({ x: 0, startX: 0, time: 0, moved: false, velocity: 0, width: 1 });

  useEffect(() => {
    const s = state.current;
    const target = kingstonDayAngle();
    s.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (s.reduced) {
      s.angle = target;
      s.spinningUp = false;
      setAngle(target);
    }
    // Spin up: an extra half turn plus the day angle, eased out over three slow reveals.
    const spinUp = durationMs("--duration-slow", 800) * 3;
    const start = performance.now();
    let last = start;
    let frame = 0;
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (s.spinningUp && !s.dragging) {
        const t = (now - start) / spinUp;
        if (t < 1) {
          s.angle = (target + 180) * (1 - Math.pow(1 - t, 3));
        } else {
          s.angle = target + 180;
          s.spinningUp = false;
          s.velocity = s.paused ? 0 : DRIFT_DEGREES_PER_SECOND;
        }
      } else if (!s.dragging) {
        const rest = s.paused || s.reduced ? 0 : DRIFT_DEGREES_PER_SECOND;
        s.velocity += (rest - s.velocity) * (1 - Math.exp(-FRICTION_PER_SECOND * dt));
        s.angle += s.velocity * dt;
      }
      setAngle(s.angle);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const togglePaused = () => {
    const s = state.current;
    s.paused = !s.paused;
    setPaused(s.paused);
  };

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    // Keep a click or tap from focusing the globe, so the focus ring only appears for keyboard users.
    event.preventDefault();
    const s = state.current;
    s.dragging = true;
    s.spinningUp = false;
    s.velocity = 0;
    drag.current = {
      x: event.clientX,
      startX: event.clientX,
      time: event.timeStamp,
      moved: false,
      velocity: 0,
      width: event.currentTarget.getBoundingClientRect().width || 1,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const s = state.current;
    const d = drag.current;
    if (!s.dragging) return;
    const dx = event.clientX - d.x;
    const dt = Math.max((event.timeStamp - d.time) / 1000, 0.001);
    const degrees = (dx / d.width) * DRAG_DEGREES_PER_WIDTH;
    s.angle += degrees;
    d.velocity = degrees / dt;
    d.x = event.clientX;
    d.time = event.timeStamp;
    if (Math.abs(event.clientX - d.startX) > TAP_SLOP_PX) d.moved = true;
  };

  const onPointerUp = (event: PointerEvent<SVGSVGElement>) => {
    const s = state.current;
    const d = drag.current;
    if (!s.dragging) return;
    s.dragging = false;
    if (!d.moved) {
      togglePaused();
      return;
    }
    // A flick keeps its speed (unless the last move was a while ago, i.e. the drag ended at rest).
    const stale = event.timeStamp - d.time > 100;
    s.velocity = s.reduced || stale ? 0 : d.velocity;
  };

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const s = state.current;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      togglePaused();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      s.spinningUp = false;
      s.angle += event.key === "ArrowRight" ? KEY_STEP_DEGREES : -KEY_STEP_DEGREES;
    }
  };

  return (
    <svg
      viewBox="0 0 32 32"
      preserveAspectRatio="none"
      role="button"
      tabIndex={0}
      aria-label={paused ? "Globe, stopped. Press to spin; arrow keys turn it." : "Globe, spinning. Press to stop; arrow keys turn it."}
      aria-pressed={paused}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className={`cursor-grab touch-pan-y select-none fill-none stroke-current stroke-1 text-ink active:cursor-grabbing ${className}`}
    >
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
