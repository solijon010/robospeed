import { useMemo, useState, useEffect, useRef } from "react";
import {
  collection, doc, updateDoc, serverTimestamp,
  onSnapshot, orderBy, query,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Minus, Plus, Save, Timer, Zap, ClipboardCheck,
  CheckCircle2, ChevronLeft, ChevronRight, ChevronDown,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  PENALTY_PER_HIT,
  MAX_TECHNICAL,
  MAX_DESIGN,
  MAX_ACCURACY,
  MAX_SPEED,
  finalTime,
  accuracyScore,
  speedScore,
  fmtTime,
} from "@/lib/scoring";
import type { ParticipantWithEval } from "./types";

interface Hakam {
  id: string;
  ism: string;
  familya: string;
}

interface Props {
  participant: ParticipantWithEval;
  rows: ParticipantWithEval[];
  onSaved: () => void;
  onSelect: (id: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
  currentIndex?: number;
  totalCount?: number;
}

interface EvalSnap {
  participant_id: string;
  time_seconds: number;
  red_line_hits: number;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const color =
    pct >= 80 ? "oklch(0.7 0.18 145)" : pct >= 50 ? "oklch(0.78 0.22 60)" : "oklch(0.65 0.25 25)";
  return (
    <div className="text-center px-2 py-3 rounded-xl" style={{ background: "oklch(0.18 0.04 260)" }}>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-xl font-bold font-mono" style={{ color }}>
        {value % 1 === 0 ? value : value.toFixed(1)}
      </div>
      <div className="text-xs text-muted-foreground/60">/{max}</div>
      <div className="mt-2 h-1 bg-secondary/60 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export function EvaluateForm({
  participant, rows, onSaved, onSelect,
  onPrev, onNext, currentIndex, totalCount,
}: Props) {
  const e = participant.evaluation!;

  /* Dropdown */
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClick(ev: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(ev.target as Node))
        setDropdownOpen(false);
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  /* Active hakamlar — all fetched, filtered client-side to avoid composite index */
  const [hakamlar, setHakamlar] = useState<Hakam[]>([]);
  useEffect(() => {
    const q = query(collection(db, "hakamlar"), orderBy("created_at"));
    return onSnapshot(q, (snap) => {
      setHakamlar(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Hakam & { active?: boolean })
          .filter((h) => h.active !== false),
      );
    });
  }, []);

  /* Per-hakam score state: { [hakam_id]: { tech: string, design: string } } */
  const [hakamScores, setHakamScores] = useState<Record<string, { tech: string; design: string }>>({});

  useEffect(() => {
    if (hakamlar.length === 0) return;
    setHakamScores((prev) => {
      const next: Record<string, { tech: string; design: string }> = {};
      hakamlar.forEach((h) => {
        if (prev[h.id]) {
          next[h.id] = prev[h.id];
        } else {
          const saved = (e.hakam_scores as Record<string, { technical_score: number; design_score: number }> | undefined)?.[h.id];
          next[h.id] = {
            tech: saved ? String(saved.technical_score) : "",
            design: saved ? String(saved.design_score) : "",
          };
        }
      });
      return next;
    });
  }, [hakamlar.map((h) => h.id).join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Live average scores */
  const avgTech = useMemo(() => {
    if (hakamlar.length === 0) return 0;
    const sum = hakamlar.reduce((s, h) => s + clamp(parseFloat(hakamScores[h.id]?.tech || "0") || 0, 0, MAX_TECHNICAL), 0);
    return sum / hakamlar.length;
  }, [hakamlar, hakamScores]);

  const avgDesign = useMemo(() => {
    if (hakamlar.length === 0) return 0;
    const sum = hakamlar.reduce((s, h) => s + clamp(parseFloat(hakamScores[h.id]?.design || "0") || 0, 0, MAX_DESIGN), 0);
    return sum / hakamlar.length;
  }, [hakamlar, hakamScores]);

  /* Competition fields */
  const [time, setTime] = useState(String(e.time_seconds || ""));
  const [hits, setHits] = useState(e.red_line_hits || 0);
  const [savingPre, setSavingPre] = useState(false);
  const [savingComp, setSavingComp] = useState(false);

  /* Live speed calculation */
  const [allEvals, setAllEvals] = useState<EvalSnap[]>([]);
  useEffect(() => {
    return onSnapshot(collection(db, "evaluations"), (snap) => {
      setAllEvals(
        snap.docs
          .map((d) => d.data() as EvalSnap)
          .filter((ev) => ev.time_seconds > 0 && ev.participant_id !== participant.id),
      );
    });
  }, [participant.id]);

  const tNum = parseFloat(time) || 0;
  const ft = useMemo(() => finalTime(tNum, hits), [tNum, hits]);
  const penalty = hits * PENALTY_PER_HIT;
  const accuracy = accuracyScore(hits);

  const bestFinal = useMemo(() => {
    const times = allEvals.map((ev) => finalTime(ev.time_seconds, ev.red_line_hits));
    if (ft > 0) times.push(ft);
    return times.length ? Math.min(...times) : ft || 0;
  }, [allEvals, ft]);

  const liveSpeed = tNum > 0 ? speedScore(ft, bestFinal) : 0;
  const liveTotal = liveSpeed + accuracy + avgTech + avgDesign;

  /* Status flags */
  const preCompSaved = Number(e.technical_score) > 0 || Number(e.design_score) > 0;
  const compSaved = e.time_seconds > 0;

  /* Save pre-competition */
  const savePreComp = async () => {
    if (hakamlar.length === 0) {
      toast.error("Aktiv hakamlar yo'q. Avval hakamlar bo'limida hakamlarni faollashtiring.");
      return;
    }
    setSavingPre(true);
    try {
      const hakam_scores_data: Record<string, { technical_score: number; design_score: number }> = {};
      hakamlar.forEach((h) => {
        hakam_scores_data[h.id] = {
          technical_score: clamp(parseFloat(hakamScores[h.id]?.tech || "0") || 0, 0, MAX_TECHNICAL),
          design_score: clamp(parseFloat(hakamScores[h.id]?.design || "0") || 0, 0, MAX_DESIGN),
        };
      });
      await updateDoc(doc(db, "evaluations", e.id), {
        technical_score: avgTech,
        design_score: avgDesign,
        hakam_scores: hakam_scores_data,
        updated_at: serverTimestamp(),
      });
      toast.success(`Balllar saqlandi · O'rtacha: Texnik ${avgTech.toFixed(1)}, Dizayn ${avgDesign.toFixed(1)}`);
      onSaved();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setSavingPre(false);
    }
  };

  /* Save competition */
  const saveComp = async () => {
    setSavingComp(true);
    try {
      await updateDoc(doc(db, "evaluations", e.id), {
        time_seconds: tNum,
        red_line_hits: hits,
        updated_at: serverTimestamp(),
      });
      toast.success("Vaqt va bosishlar saqlandi");
      onSaved();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setSavingComp(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Participant switcher ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={onPrev}
          disabled={!onPrev}
          className="w-10 h-10 rounded-xl flex items-center justify-center border border-border/60 bg-secondary/40 hover:bg-secondary/80 disabled:opacity-25 disabled:cursor-not-allowed transition-all shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div ref={dropdownRef} className="relative flex-1">
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-4 px-5 py-3 rounded-xl border border-border/60 hover:border-primary/40 transition-all text-left"
            style={{ background: "oklch(0.18 0.05 250)" }}
          >
            <div className="flex items-center gap-3 min-w-0">
              {participant.custom_number && (
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-black shrink-0"
                  style={{ background: "var(--color-primary)", color: "#000" }}
                >
                  {participant.custom_number}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-xl font-bold leading-tight truncate">{participant.full_name}</h2>
                <p className="text-sm text-muted-foreground">{participant.group_name}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground/60 shrink-0 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </div>
            <div className="flex gap-5 items-end shrink-0">
              {tNum > 0 && (
                <div className="text-right">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Vaqt</div>
                  <div className="text-2xl font-mono font-bold" style={{ color: "var(--color-accent)" }}>{fmtTime(ft)}</div>
                  {penalty > 0 && <div className="text-xs text-destructive">+{penalty}s ({hits}×)</div>}
                </div>
              )}
              <div className="text-right">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Ball</div>
                <div className="text-2xl font-mono font-bold" style={{ color: "var(--color-primary)" }}>{liveTotal.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">/ 100</div>
              </div>
            </div>
          </button>

          {dropdownOpen && (
            <div
              className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-border/60 overflow-hidden z-50 shadow-2xl"
              style={{ background: "oklch(0.16 0.05 255)" }}
            >
              <div className="p-1.5 max-h-72 overflow-y-auto custom-scrollbar space-y-0.5">
                {rows.map((p, i) => {
                  const ev = p.evaluation;
                  const compDone = ev && ev.time_seconds > 0;
                  const preCompDone = ev && (Number(ev.technical_score) > 0 || Number(ev.design_score) > 0);
                  const isActive = p.id === participant.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => { onSelect(p.id); setDropdownOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${isActive ? "bg-primary/20 border border-primary/30" : "hover:bg-secondary/60"}`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                        style={isActive
                          ? { background: "var(--color-primary)", color: "#000" }
                          : { background: "oklch(0.78 0.18 220 / 0.15)", color: "var(--color-primary)" }}
                      >
                        {p.custom_number || i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{p.full_name}</div>
                        <div className="text-xs text-muted-foreground">{p.group_name}</div>
                      </div>
                      <div className="shrink-0">
                        {compDone
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          : preCompDone
                            ? <ClipboardCheck className="w-4 h-4 text-amber-400" />
                            : <div className="w-4 h-4 rounded-full border border-muted-foreground/20" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              {totalCount !== undefined && currentIndex !== undefined && (
                <div className="border-t border-border/40 px-4 py-2 text-xs text-muted-foreground">
                  {currentIndex + 1} / {totalCount} ishtirokchi
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={onNext}
          disabled={!onNext}
          className="w-10 h-10 rounded-xl flex items-center justify-center border border-border/60 bg-secondary/40 hover:bg-secondary/80 disabled:opacity-25 disabled:cursor-not-allowed transition-all shrink-0"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* ── Live score bars ── */}
      <div className="grid grid-cols-4 gap-2">
        <ScoreBar label="Tezlik"       value={liveSpeed} max={MAX_SPEED} />
        <ScoreBar label="Aniqlik"      value={accuracy}  max={MAX_ACCURACY} />
        <ScoreBar label="Texnik bilim" value={avgTech}   max={MAX_TECHNICAL} />
        <ScoreBar label="Dizayn"       value={avgDesign} max={MAX_DESIGN} />
      </div>

      {/* ── Phase cards side by side ── */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* Phase 1: Pre-competition — hakam scoring */}
        <Card className="p-6 border-amber-500/20 flex flex-col" style={{ background: "oklch(0.16 0.04 60 / 0.4)" }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-amber-400" />
                1-bosqich: Oldindan baholash
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Har bir hakam mustaqil ball qo'yadi — o'rtacha hisoblanadi
              </p>
            </div>
            {preCompSaved ? (
              <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 gap-1">
                <CheckCircle2 className="w-3 h-3" /> Saqlangan
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" /> Baholanmagan
              </Badge>
            )}
          </div>

          {hakamlar.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-8 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Aktiv hakamlar yo'q</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Hakamlar bo'limida hakamlarni faollashtiring
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Hakam scores table */}
              <div className="flex-1 space-y-0 mb-4 rounded-xl overflow-hidden border border-border/30">
                {/* Header */}
                <div
                  className="grid gap-2 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  style={{ gridTemplateColumns: "1fr 100px 100px", background: "oklch(0.20 0.04 260)" }}
                >
                  <span>Hakam</span>
                  <span className="text-center">Texnik /{MAX_TECHNICAL}</span>
                  <span className="text-center">Dizayn /{MAX_DESIGN}</span>
                </div>

                {/* Per-hakam rows */}
                {hakamlar.map((h, idx) => (
                  <div
                    key={h.id}
                    className="grid gap-2 px-4 py-2.5 items-center border-t border-border/20"
                    style={{
                      gridTemplateColumns: "1fr 100px 100px",
                      background: idx % 2 === 0 ? "oklch(0.18 0.03 260 / 0.5)" : "transparent",
                    }}
                  >
                    <span className="text-sm font-medium truncate">
                      {h.familya} {h.ism}
                    </span>
                    <Input
                      type="number"
                      min="0"
                      max={MAX_TECHNICAL}
                      step="0.5"
                      placeholder="0"
                      value={hakamScores[h.id]?.tech ?? ""}
                      onChange={(ev) =>
                        setHakamScores((prev) => ({
                          ...prev,
                          [h.id]: { ...prev[h.id], tech: ev.target.value },
                        }))
                      }
                      className="font-mono text-center h-8 text-sm"
                    />
                    <Input
                      type="number"
                      min="0"
                      max={MAX_DESIGN}
                      step="0.5"
                      placeholder="0"
                      value={hakamScores[h.id]?.design ?? ""}
                      onChange={(ev) =>
                        setHakamScores((prev) => ({
                          ...prev,
                          [h.id]: { ...prev[h.id], design: ev.target.value },
                        }))
                      }
                      className="font-mono text-center h-8 text-sm"
                    />
                  </div>
                ))}

                {/* Average row */}
                <div
                  className="grid gap-2 px-4 py-2.5 items-center border-t-2 border-amber-500/30"
                  style={{ gridTemplateColumns: "1fr 100px 100px", background: "oklch(0.20 0.05 60 / 0.5)" }}
                >
                  <span className="text-sm font-bold text-amber-400">O'rtacha</span>
                  <span className="text-center font-mono font-bold text-amber-400">
                    {avgTech.toFixed(1)}
                  </span>
                  <span className="text-center font-mono font-bold text-amber-400">
                    {avgDesign.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={savePreComp}
                  disabled={savingPre}
                  className="gap-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                >
                  <Save className="w-4 h-4" />
                  {savingPre ? "Saqlanmoqda..." : preCompSaved ? "Qayta saqlash" : "Saqlash"}
                </Button>
              </div>
            </>
          )}
        </Card>

        {/* Phase 2: Competition timing */}
        <Card className="p-6 border-cyan-500/20" style={{ background: "oklch(0.16 0.05 220 / 0.4)" }}>
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Timer className="w-4 h-4 text-cyan-400" />
                2-bosqich: Musobaqa vaqtida
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pist o'tgandan keyin vaqt va qizil chiziq bosishlari kiritiladi
              </p>
            </div>
            {compSaved ? (
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Saqlangan · {fmtTime(finalTime(e.time_seconds, e.red_line_hits))}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" /> Kutilmoqda
              </Badge>
            )}
          </div>

          <div className="grid gap-5 mb-5">
            {/* Time */}
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Timer className="w-4 h-4 text-primary" />
                  Yurish vaqti (sekund)
                </span>
                <Badge variant="outline" className="text-xs font-mono">/50 ball</Badge>
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={time}
                onChange={(ev) => setTime(ev.target.value)}
                placeholder="24.50"
                className="font-mono text-lg text-center"
              />
              <p className="text-xs text-muted-foreground">
                Eng tez ishtirokchi 50 ball oladi. Boshqalar proporsional ravishda baholanadi.
              </p>
            </div>

            {/* Hits */}
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-destructive" />
                  Qizil chiziq bosishlari
                </span>
                <Badge variant="outline" className="text-xs font-mono">/20 ball</Badge>
              </Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="icon" onClick={() => setHits(Math.max(0, hits - 1))}>
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  min="0"
                  value={hits}
                  onChange={(ev) => setHits(Math.max(0, parseInt(ev.target.value) || 0))}
                  className="text-center font-mono text-xl font-bold"
                />
                <Button type="button" variant="outline" size="icon" onClick={() => setHits(hits + 1)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Har bir bosish: −{PENALTY_PER_HIT}s jarima va −5 aniqlik balli.
                Aniqlik: <span className="font-semibold text-foreground">{accuracy}/20</span>
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={saveComp}
              disabled={savingComp}
              className="gap-2"
              style={{ background: "var(--gradient-hero)" }}
            >
              <Save className="w-4 h-4" />
              {savingComp ? "Saqlanmoqda..." : compSaved ? "Qayta saqlash" : "Saqlash"}
            </Button>
          </div>
        </Card>

      </div>{/* end phase grid */}
    </div>
  );
}
