"use client";

import { useEffect, useState } from "react";

/**
 * One frame from Greg's 35mm roll (public/images/film), picked at random on each load.
 * Chosen after mount so server and client render the same empty 3:2 box first (no hydration
 * mismatch, no layout shift); the frame fills it once picked.
 */
const FRAMES: { file: string; alt: string }[] = [
  { file: "000154570001", alt: "Flat olive-green film frame" },
  { file: "000154570026", alt: "Wet sand flecked with shell" },
  { file: "29510015", alt: "Siena rooftops running out to the hills" },
  { file: "29510010", alt: "Olive trees from above, long shadows on dirt" },
  { file: "29510025", alt: "Marble blocks stacked in a stone yard" },
  { file: "29510020", alt: "Paper flowers in front of an old headstone" },
  { file: "000405230005", alt: "Golf ball short of the cup" },
  { file: "000405230006", alt: "Flagstick in the cup, its shadow across the green" },
  { file: "000405230023", alt: "Granite with lichen and fine cracks" },
  { file: "000405230024", alt: "Feet in clogs on fallen leaves" },
  { file: "000622630031", alt: "Neon sneakers on moss" },
  { file: "000622640004", alt: "Stones and a burr on a river bed" },
  { file: "000835470015", alt: "Flat sage-green film frame" },
  { file: "000835470016", alt: "Light-leaked yellow film frame" },
  { file: "000622600015", alt: "Two horses face to face in a field" },
  { file: "000622630001", alt: "Two horses grazing by a white wall" },
  { file: "000622630002", alt: "Hen and chicks in the weeds by a wall" },
  { file: "000622630019", alt: "Two people sitting on a rolling green" },
  { file: "000622630022", alt: "Iguana on a lawn" },
];

export function FilmFrame({ className = "" }: { className?: string }) {
  const [frame, setFrame] = useState<(typeof FRAMES)[number] | null>(null);
  useEffect(() => setFrame(FRAMES[Math.floor(Math.random() * FRAMES.length)]), []);

  return (
    <div className={`aspect-[3/2] w-full ${className}`}>
      {frame && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/images/film/${frame.file}.jpg`} alt={frame.alt} className="h-full w-full object-cover" />
      )}
    </div>
  );
}
