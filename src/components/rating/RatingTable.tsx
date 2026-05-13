import { Card } from "@/components/ui/card";
import { fmtTime } from "@/lib/scoring";
import { RankBadge } from "./RankBadge";

export interface RatingRow {
  id: string;
  full_name: string;
  group_name: string;
  e: {
    time_seconds: number;
    red_line_hits: number;
    technical_score: number;
    design_score: number;
    control_score: number;
  } | null;
  ft: number;
  speed: number;
  accuracy: number;
  total: number;
  hasResult: boolean;
}

export function RatingTable({ ranked }: { ranked: RatingRow[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase">
            <tr>
              <th className="text-left p-3 w-14">O'rin</th>
              <th className="text-left p-3">Ism Familiya</th>
              <th className="text-left p-3">Guruh</th>
              <th className="text-right p-3">Vaqt</th>
              <th className="text-right p-3">Jarima</th>
              <th className="text-right p-3">Yakuniy</th>
              <th className="text-right p-3">Tezlik /50</th>
              <th className="text-right p-3">Aniqlik /20</th>
              <th className="text-right p-3">Texnik /15</th>
              <th className="text-right p-3">Dizayn /10</th>
              <th className="text-right p-3">Boshq. /5</th>
              <th className="text-right p-3 font-bold">JAMI</th>
            </tr>
          </thead>
          <tbody>
            {ranked.length === 0 && (
              <tr><td colSpan={12} className="p-8 text-center text-muted-foreground">Hozircha ma'lumot yo'q</td></tr>
            )}
            {ranked.map((r, i) => {
              const e = r.e;
              const penalty = e ? e.red_line_hits * 5 : 0;
              return (
                <tr key={r.id} className="border-t border-border hover:bg-secondary/30">
                  <td className="p-3"><RankBadge rank={r.hasResult ? i + 1 : null} /></td>
                  <td className="p-3 font-medium">{r.full_name}</td>
                  <td className="p-3 text-muted-foreground">{r.group_name}</td>
                  <td className="p-3 text-right font-mono">{e?.time_seconds ? fmtTime(e.time_seconds) : "—"}</td>
                  <td className="p-3 text-right font-mono text-destructive">{penalty ? `+${penalty}s` : "—"}</td>
                  <td className="p-3 text-right font-mono font-semibold text-accent">{r.ft ? fmtTime(r.ft) : "—"}</td>
                  <td className="p-3 text-right font-mono">{r.hasResult ? r.speed.toFixed(1) : "—"}</td>
                  <td className="p-3 text-right font-mono">{r.hasResult ? r.accuracy : "—"}</td>
                  <td className="p-3 text-right font-mono">{e ? Number(e.technical_score) : "—"}</td>
                  <td className="p-3 text-right font-mono">{e ? Number(e.design_score) : "—"}</td>
                  <td className="p-3 text-right font-mono">{e ? Number(e.control_score) : "—"}</td>
                  <td className="p-3 text-right font-mono font-bold text-lg text-primary">
                    {r.hasResult ? r.total.toFixed(1) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
