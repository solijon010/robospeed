import { Trophy, Medal, Award } from "lucide-react";

export function RankBadge({ rank }: { rank: number | null }) {
  if (rank === null) return <span className="text-muted-foreground">—</span>;
  if (rank === 1)
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-background" style={{ background: "var(--color-gold)" }}>
        <Trophy className="w-4 h-4" />
      </div>
    );
  if (rank === 2)
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-background" style={{ background: "var(--color-silver)" }}>
        <Medal className="w-4 h-4" />
      </div>
    );
  if (rank === 3)
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-background" style={{ background: "var(--color-bronze)" }}>
        <Award className="w-4 h-4" />
      </div>
    );
  return <span className="font-mono text-muted-foreground">#{rank}</span>;
}
