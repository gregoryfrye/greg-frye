/** One headline figure and what it counts ("17" / "SKUs to market"). */
export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="type-stat text-ink">{value}</p>
      <p className="mt-item type-label text-ink">{label}</p>
    </div>
  );
}
