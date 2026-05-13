import { Card } from "@/components/ui/card";
import { finalTime, fmtTime } from "@/lib/scoring";
import type { ParticipantWithEval } from "./types";

interface Props {
  rows: ParticipantWithEval[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ParticipantSelector({ rows, selectedId, onSelect }: Props) {
  return (
    <Card className="p-2 h-fit max-h-[70vh] overflow-y-auto">
      {rows.length === 0 && (
        <p className="p-4 text-sm text-muted-foreground">Avval ishtirokchini ro'yxatga oling.</p>
      )}
      {rows.map((p, i) => {
        const e = p.evaluation;
        const ft = e ? finalTime(e.time_seconds, e.red_line_hits) : 0;
        const active = p.id === selectedId;
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`w-full text-left p-3 rounded-md transition-colors flex items-center justify-between gap-3 ${
              active ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
            }`}
          >
            <div className="min-w-0">
              <div className="font-medium truncate">{i + 1}. {p.full_name}</div>
              <div className={`text-xs truncate ${active ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {p.group_name}
              </div>
            </div>
            {ft > 0 && (
              <div className={`text-xs font-mono ${active ? "text-primary-foreground" : "text-accent"}`}>
                {fmtTime(ft)}
              </div>
            )}
          </button>
        );
      })}
    </Card>
  );
}
