import { fmtTime } from "@/lib/scoring";
import { RankBadge } from "./RankBadge";

export interface RatingRow {
  id: string;
  full_name: string;
  group_name: string;
  custom_number?: string | null;
  seqNum?: number;
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
  { key: "design",    label: "Dizayn",        max: 15 },
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
      <td className="px-3 py-0 text-center border-r border-border/40 text-muted-foreground/25 font-mono text-sm">
        —
      </td>
    );
  const display = value % 1 === 0 ? value : value.toFixed(1);
  return (
    <td className={`px-3 py-0 text-center border-r border-border/40 font-mono text-base font-bold ${scoreColor(value, max)}`}>
      {display}
    </td>
  );
}

function rowBg(index: number, hasResult: boolean, isTop3: boolean) {
  if (isTop3) {
    if (index === 0) return "bg-amber-500/8 hover:bg-amber-500/12";
    if (index === 1) return "bg-slate-400/8 hover:bg-slate-400/12";
    if (index === 2) return "bg-orange-600/8 hover:bg-orange-600/12";
  }
  return index % 2 !== 0 ? "bg-white/3 hover:bg-white/5" : "hover:bg-white/3";
}

export function RatingTable({ ranked }: { ranked: RatingRow[] }) {
  return (
    <div
      className="flex flex-col h-full rounded-2xl border border-border/60 overflow-hidden"
      style={{ boxShadow: "0 0 60px -20px oklch(0.78 0.18 220 / 0.25)" }}
    >
      {/* Table title */}
      <div
        className="px-8 py-4 text-center shrink-0 border-b border-border/40"
        style={{ background: "linear-gradient(135deg, oklch(0.18 0.06 250) 0%, oklch(0.15 0.04 240) 100%)" }}
      >
        <h2
          className="text-2xl font-black tracking-[0.25em] uppercase"
          style={{ color: "var(--color-primary)" }}
        >
          ROBO SPEED CHALLENGE
        </h2>
        <p className="text-xs text-muted-foreground/70 tracking-[0.2em] mt-1 uppercase">
          Baholash va Natijalar Jadvali
        </p>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
          <thead className="sticky top-0 z-10">
            <tr
              style={{ background: "oklch(0.18 0.05 250)" }}
              className="border-b-2 border-border/60"
            >
              <th className="px-4 py-3 text-center w-12 border-r border-border/40 text-muted-foreground text-xs font-bold uppercase tracking-widest">
                №
              </th>
              <th className="px-5 py-3 text-left border-r border-border/40 text-muted-foreground text-xs font-bold uppercase tracking-widest">
                Ism Familiyasi
              </th>
              <th className="px-4 py-3 text-center border-r border-border/40 text-muted-foreground text-xs font-bold uppercase tracking-widest">
                Guruh
              </th>
              <th className="px-3 py-3 text-center border-r border-border/40 text-muted-foreground text-xs font-bold uppercase tracking-widest">
                Vaqt
              </th>
              {COLS.map((c) => (
                <th
                  key={c.key}
                  className="px-3 py-3 text-center border-r border-border/40 text-xs font-bold uppercase tracking-widest"
                  style={{ color: "var(--color-muted-foreground)" }}
                >
                  <span className="block">{c.label}</span>
                  <span className="block text-muted-foreground/40 font-normal normal-case text-[11px]">/ {c.max}</span>
                </th>
              ))}
              <th
                className="px-4 py-3 text-center border-r border-border/40 text-xs font-bold uppercase tracking-widest"
                style={{ color: "var(--color-primary)" }}
              >
                <span className="block">JAMI</span>
                <span className="block text-muted-foreground/40 font-normal normal-case text-[11px]">/ 100</span>
              </th>
              <th className="px-4 py-3 text-center w-16 text-muted-foreground text-xs font-bold uppercase tracking-widest">
                O'rin
              </th>
            </tr>
          </thead>

          <tbody>
            {ranked.length === 0 && (
              <tr>
                <td colSpan={10} className="p-16 text-center text-muted-foreground text-sm">
                  Hozircha ma'lumot yo'q
                </td>
              </tr>
            )}

            {ranked.map((r, i) => {
              const e = r.e;
              const isTop3 = r.hasResult && i < 3;
              return (
                <tr
                  key={r.id}
                  className={`border-b border-border/30 transition-colors ${rowBg(i, r.hasResult, isTop3)}`}
                  style={{ height: "52px" }}
                >
                  {/* № */}
                  <td className="px-4 py-0 text-center border-r border-border/40">
                    <span className="text-muted-foreground/50 font-mono text-sm">
                      {r.custom_number || r.seqNum || i + 1}
                    </span>
                  </td>

                  {/* Ism */}
                  <td className="px-5 py-0 border-r border-border/40">
                    <div className="flex items-center gap-3">
                      {isTop3 && (
                        <span
                          className="w-1.5 h-8 rounded-full shrink-0"
                          style={{
                            background: i === 0
                              ? "var(--color-gold)"
                              : i === 1
                              ? "var(--color-silver)"
                              : "var(--color-bronze)",
                          }}
                        />
                      )}
                      <span className="font-semibold text-base truncate">{r.full_name}</span>
                    </div>
                  </td>

                  {/* Guruh */}
                  <td className="px-4 py-0 text-center border-r border-border/40">
                    <span className="text-xs font-medium text-muted-foreground bg-secondary/60 px-2 py-1 rounded-md">
                      {r.group_name}
                    </span>
                  </td>

                  {/* Vaqt */}
                  <td className="px-3 py-0 text-center border-r border-border/40 font-mono text-sm">
                    {r.hasResult ? (
                      <span className="text-accent font-semibold">{fmtTime(r.ft)}</span>
                    ) : (
                      <span className="text-muted-foreground/30">—</span>
                    )}
                  </td>

                  {/* Texnik bilim */}
                  <ScoreCell value={Number(e?.technical_score ?? 0)} max={15} hasResult={r.hasResult} />
                  {/* Aniqlik */}
                  <ScoreCell value={r.accuracy} max={20} hasResult={r.hasResult} />
                  {/* Tezlik */}
                  <ScoreCell value={r.speed} max={50} hasResult={r.hasResult} />
                  {/* Dizayn */}
                  <ScoreCell value={Number(e?.design_score ?? 0)} max={15} hasResult={r.hasResult} />

                  {/* JAMI */}
                  <td className="px-4 py-0 text-center border-r border-border/40">
                    {r.hasResult ? (
                      <span
                        className="text-xl font-black"
                        style={{ color: "var(--color-primary)" }}
                      >
                        {r.total.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/25 font-mono">—</span>
                    )}
                  </td>

                  {/* O'rin */}
                  <td className="px-4 py-0">
                    <div className="flex items-center justify-center">
                      <RankBadge rank={r.hasResult ? i + 1 : null} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border/40 px-6 py-2 flex items-center justify-between bg-secondary/10">
        <span className="text-xs text-muted-foreground/50">
          Yakuniy vaqt = Vaqt + (Bosishlar × 5s) &nbsp;·&nbsp; Tezlik = (eng_yaxshi / yakuniy) × 50 &nbsp;·&nbsp; Aniqlik = 20 − Bosishlar × 5 &nbsp;·&nbsp; Dizayn maks. 15
        </span>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-pulse" />
          Real vaqtda yangilanadi
        </div>
      </div>
    </div>
  );
}
