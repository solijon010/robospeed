import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ScoreInput({
  label,
  max,
  value,
  onChange,
}: {
  label: string;
  max: number;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label} <span className="text-muted-foreground font-normal">/ {max}</span>
      </Label>
      <Input type="number" min="0" max={max} step="0.5" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
