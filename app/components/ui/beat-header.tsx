/**
 * The rule-and-label row that opens every beat and chapter: a marker (a
 * letter for a story beat, a number for a chapter) and a functional label.
 * Figma 01_Client_1280: 1px rule, 21px serif label, marker column 54px.
 */
export function BeatHeader({ marker, label }: { marker?: string; label: string }) {
  return (
    <p className="rule flex pt-item type-label text-ink">
      {marker && <span className="w-marker shrink-0">{marker}</span>}
      <span>{label}</span>
    </p>
  );
}
