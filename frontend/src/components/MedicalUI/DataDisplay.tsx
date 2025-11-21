interface DataDisplayProps {
  label: string;
  value: string | number;
  unit?: string;
}

export default function DataDisplay({ label, value, unit }: DataDisplayProps) {
  return (
    <div>
      <div className="data-label">{label}</div>
      <div className="data-value">
        {value}
        {unit && <span className="text-sm ml-1 text-[var(--text-secondary)]">{unit}</span>}
      </div>
    </div>
  );
}
