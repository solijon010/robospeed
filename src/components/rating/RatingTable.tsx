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

const COLS = [
  { key: "technical", label: "Texnik bilim", max: 15 },
  { key: "accuracy",  label: "Aniqlik",      max: 20 },
  { key: "speed",     label: "Tezlik",        max: 50 },
  { key: "design",    label: "Dizayn",        max: 10 },
  { key: "control",   label: "Boshqaruv",    max: 5  },
] as const;

function scoreColor(value: number, max: number) {
  const pct = value / max;
  if (pct >= 0.8) return "text-emerald-400";
  if (pct >= 0.5) return "text-amber-400";
  return "text-rose-400";
}

function ScoreCell({ value, max, hasResult }: { value: number; max: number; hasResult: boolean }) {
  if (!hasResult)
    return (
      <td className="px-3 py-2.5 text-center border-r border-border/60 text-muted-foreground/30 font-mono text-sm">
        —
      </td>
    );
  const display = value % 1 === 0 ? value : value.toFixed(1);
  return (
    <td className={`px-3 py-2.5 text-center border-r border-border/60 font-mono text-sm font-semibold ${scoreColor(value, max)}`}>
      {display}
    </td>
  );
}

export function RatingTable({ ranked }: { ranked: RatingRow[] }) {
  const EMPTY_ROWS = Math.max(0, 5 - ranked.length);

  return (
    <div
      className="overflow-hidden rounded-xl border border-border"
      style={{ boxShadow: "var(--shadow-glow)" }}
    >
      {/* Table title header */}
      <div
        className="px-6 py-5 border-b border-border text-center"
        style={{ background: "linear-gradient(135deg, oklch(0.20 0.05 250) 0%, oklch(0.18 0.04 240) 100%)" }}
      >
        <h2
          className="text-lg font-bold tracking-[0.2em] uppercase"
          style={{ color: "var(--color-primary)" }}
        >
          ROBO SPEED CHALLENGE
        </h2>
        <p className="text-xs text-muted-foreground tracking-widest mt-1 uppercase">
          Baholash va Natijalar Jadvali
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="border-b border-border"
              style={{ background: "oklch(0.20 0.04 250)" }}
            >
              <th className="px-3 py-3 text-center w-10 border-r border-border/60 text-muted-foreground text-xs font-semibold uppercase">
                №
              </th>
              <th className="px-4 py-3 text-left border-r border-border/60 text-muted-foreground text-xs font-semibold uppercase">
                Ism Familiyasi
              </th>
              <th className="px-3 py-3 text-center border-r border-border/60 text-muted-foreground text-xs font-semibold uppercase">
                Guruhi
              </th>
              {COLS.map((c) => (
                <th
                  key={c.key}
                  className="px-3 py-3 text-center border-r border-border/60 text-xs font-semibold uppercase"
                  style={{ color: "var(--color-muted-foreground)" }}
                >
                  <span className="block">{c.label}</span>
                  <span className="block text-muted-foreground/50 font-normal normal-case">/ {c.max}</span>
                </th>
              ))}
              <th
                className="px-3 py-3 text-center border-r border-border/60 text-xs font-bold uppercase"
                style={{ color: "var(--color-primary)" }}
              >
                <span className="block">JAMI</span>
                <span className="block text-muted-foreground/50 font-normal normal-case">/ 100</span>
              </th>
              <th className="px-3 py-3 text-center w-16 text-muted-foreground text-xs font-semibold uppercase">
                O'rin
              </th>
            </tr>
          </thead>

          <tbody>
            {ranked.map((r, i) => {
              const e = r.e;
              const isTop3 = r.hasResult && i < 3;
              return (
                <tr
                  key={r.id}
                  className={`border-b border-border/60 transition-colors hover:bg-primary/5 ${
                    i % 2 !== 0 ? "bg-secondary/15" : ""
                  } ${isTop3 ? "ring-inset" : ""}`}
                >
                  <td className="px-3 py-2.5 text-center border-r border-border/60 text-muted-foreground/50 font-mono text-xs">
                    {i + 1}
                  </td>
                  <td className="px-4 py-2.5 border-r border-border/60">
                    <span className="font-medium">{r.full_name}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center border-r border-border/60 text-xs text-muted-foreground">
                    {r.group_name}
                  </td>

                  {/* Texnik bilim */}
                  <ScoreCell value={Number(e?.technical_score ?? 0)} max={15} hasResult={r.hasResult} />
                  {/* Aniqlik */}
                  <ScoreCell value={r.accuracy} max={20} hasResult={r.hasResult} />
                  {/* Tezlik */}
                  <ScoreCell value={r.speed} max={50} hasResult={r.hasResult} />
                  {/* Dizayn */}
                  <ScoreCell value={Number(e?.design_score ?? 0)} max={10} hasResult={r.hasResult} />
                  {/* Boshqaruv */}
                  <ScoreCell value={Number(e?.control_score ?? 0)} max={5} hasResult={r.hasResult} />

                  {/* JAMI */}
                  <td
                    className={`px-3 py-2.5 text-center border-r border-border/60 font-bold text-base ${
                      r.hasResult ? "text-primary" : "text-muted-foreground/30"
                    }`}
                  >
                    {r.hasResult ? r.total.toFixed(1) : "—"}
                  </td>

                  {/* O'rin */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center">
                      <RankBadge rank={r.hasResult ? i + 1 : null} />
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Empty placeholder rows when list is short */}
            {Array.from({ length: EMPTY_ROWS }).map((_, i) => (
              <tr
                key={`empty-${i}`}
                className={`border-b border-border/60 ${
                  (ranked.length + i) % 2 !== 0 ? "bg-secondary/15" : ""
                }`}
              >
                <td className="px-3 py-2.5 text-center border-r border-border/60 text-muted-foreground/25 font-mono text-xs">
                  {ranked.length + i + 1}
                </td>
                <td className="px-4 py-2.5 border-r border-border/60 h-10" />
                <td className="px-3 py-2.5 border-r border-border/60" />
                {COLS.map((c) => (
                  <td key={c.key} className="px-3 py-2.5 border-r border-border/60" />
                ))}
                <td className="px-3 py-2.5 border-r border-border/60" />
                <td className="px-3 py-2.5" />
              </tr>
            ))}

            {ranked.length === 0 && EMPTY_ROWS === 0 && (
              <tr>
                <td colSpan={10} className="p-10 text-center text-muted-foreground">
                  Hozircha ma'lumot yo'q
                </td>
              </tr>
            )}
          </tbody>

          {/* Footer with time info */}
          {ranked.filter((r) => r.hasResult).length > 0 && (
            <tfoot>
              <tr className="border-t border-border bg-secondary/20">
                <td colSpan={3} className="px-4 py-2 text-xs text-muted-foreground">
                  Yakuniy vaqtlar
                </td>
                {COLS.map((c) => (
                  <td key={c.key} className="px-3 py-2 border-r border-border/60" />
                ))}
                <td colSpan={2} className="px-4 py-2 text-xs text-muted-foreground text-right">
                  Natijalar real vaqtda yangilanadi
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Time breakdown for evaluated participants */}
      {ranked.some((r) => r.hasResult) && (
        <div className="border-t border-border px-6 py-3 bg-secondary/10 overflow-x-auto">
          <table className="w-full text-xs text-muted-foreground">
            <thead>
              <tr>
                <th className="text-left py-1 w-10">№</th>
                <th className="text-left py-1">Ism</th>
                <th className="text-right py-1">Toza vaqt</th>
                <th className="text-right py-1">Jarima</th>
                <th className="text-right py-1 font-semibold text-foreground">Yakuniy vaqt</th>
              </tr>
            </thead>
            <tbody>
              {ranked
                .filter((r) => r.hasResult)
                .map((r, i) => (
                  <tr key={r.id} className="border-t border-border/30">
                    <td className="py-1">{i + 1}</td>
                    <td className="py-1">{r.full_name}</td>
                    <td className="py-1 text-right font-mono">
                      {r.e ? fmtTime(r.e.time_seconds) : "—"}
                    </td>
                    <td className="py-1 text-right font-mono text-destructive">
                      {r.e && r.e.red_line_hits > 0 ? `+${r.e.red_line_hits * 5}s` : "—"}
                    </td>
                    <td className="py-1 text-right font-mono font-semibold text-accent">
                      {fmtTime(r.ft)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
