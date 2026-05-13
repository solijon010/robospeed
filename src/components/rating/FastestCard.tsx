import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { fmtTime } from "@/lib/scoring";

export function FastestCard({ name, ft }: { name: string; ft: number }) {
  return (
    <Card className="p-4 flex items-center gap-3" style={{ background: "var(--gradient-hero)" }}>
      <Trophy className="w-6 h-6 text-primary-foreground" />
      <div>
        <div className="text-xs text-primary-foreground/80 uppercase">Eng tez</div>
        <div className="font-bold text-primary-foreground">
          {name} · {fmtTime(ft)}
        </div>
      </div>
    </Card>
  );
}
