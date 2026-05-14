import { useMemo, useState, useEffect } from "react";
import { collection, doc, updateDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Save, Timer, Zap, ClipboardCheck, CheckCircle2 } from "lucide-react";
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

interface Props {
  participant: ParticipantWithEval;
  onSaved: () => void;
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
    pct >= 80
      ? "oklch(0.7 0.18 145)"
      : pct >= 50
        ? "oklch(0.78 0.22 60)"
        : "oklch(0.65 0.25 25)";
  return (
    <div
      className="text-center px-2 py-3 rounded-xl"
      style={{ background: "oklch(0.18 0.04 260)" }}
    >
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-xl font-bold font-mono" style={{ color }}>
        {value % 1 === 0 ? value : value.toFixed(1)}
      </div>
      <div className="text-xs text-muted-foreground/60">/{max}</div>
      <div className="mt-2 h-1 bg-secondary/60 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function EvaluateForm({ participant, onSaved }: Props) {
  const e = participant.evaluation!;

  /* Pre-competition fields */
  const [tech, setTech] = useState(String(e.technical_score || ""));
  const [design, setDesign] = useState(String(e.design_score || ""));
  const [savingPre, setSavingPre] = useState(false);

  /* Competition fields */
  const [time, setTime] = useState(String(e.time_seconds || ""));
  const [hits, setHits] = useState(e.red_line_hits || 0);
  const [savingComp, setSavingComp] = useState(false);

  /* Live other evaluations for speed calculation */
  const [allEvals, setAllEvals] = useState<EvalSnap[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "evaluations"), (snap) => {
      setAllEvals(
        snap.docs
          .map((d) => d.data() as EvalSnap)
          .filter((ev) => ev.time_seconds > 0 && ev.participant_id !== participant.id),
      );
    });
    return () => unsub();
  }, [participant.id]);

  /* Live calculations */
  const tNum = parseFloat(time) || 0;
  const ft = useMemo(() => finalTime(tNum, hits), [tNum, hits]);
  const penalty = hits * PENALTY_PER_HIT;
  const accuracy = accuracyScore(hits);
  const liveTech = clamp(parseFloat(tech) || 0, 0, MAX_TECHNICAL);
  const liveDesign = clamp(parseFloat(design) || 0, 0, MAX_DESIGN);

  const bestFinal = useMemo(() => {
    const times = allEvals.map((ev) => finalTime(ev.time_seconds, ev.red_line_hits));
    if (ft > 0) times.push(ft);
    return times.length ? Math.min(...times) : ft || 0;
  }, [allEvals, ft]);

  const liveSpeed = tNum > 0 ? speedScore(ft, bestFinal) : 0;
  const liveTotal = liveSpeed + accuracy + liveTech + liveDesign;

  /* Status flags */
  const preCompSaved = Number(e.technical_score) > 0 || Number(e.design_score) > 0;
  const compSaved = e.time_seconds > 0;

  /* Save pre-competition (Texnik + Dizayn) */
  const savePreComp = async () => {
    setSavingPre(true);
    try {
      await updateDoc(doc(db, "evaluations", e.id), {
        technical_score: liveTech,
        design_score: liveDesign,
        updated_at: serverTimestamp(),
      });
      toast.success("Texnik va Dizayn ballari saqlandi");
      onSaved();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setSavingPre(false);
    }
  };

  /* Save competition (Vaqt + Bosishlar) */
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
    <div className="space-y-5">
      {/* ── Participant header + live total ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">{participant.full_name}</h2>
          <p className="text-sm text-muted-foreground">
            {participant.group_name}
            {participant.custom_number && (
              <span className="ml-2 font-mono">· № {participant.custom_number}</span>
            )}
          </p>
        </div>
        <div className="flex gap-4 items-end">
          {tNum > 0 && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Yakuniy vaqt</div>
              <div className="text-3xl font-mono font-bold" style={{ color: "var(--color-accent)" }}>
                {fmtTime(ft)}
              </div>
              {penalty > 0 && (
                <div className="text-xs text-destructive">+{penalty}s jarima ({hits} bosish)</div>
              )}
            </div>
          )}
          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Joriy ball</div>
            <div className="text-3xl font-mono font-bold" style={{ color: "var(--color-primary)" }}>
              {liveTotal.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">/ 100</div>
          </div>
        </div>
      </div>

      {/* ── Live score bars ── */}
      <div className="grid grid-cols-4 gap-2">
        <ScoreBar label="Tezlik"        value={liveSpeed}   max={MAX_SPEED} />
        <ScoreBar label="Aniqlik"       value={accuracy}    max={MAX_ACCURACY} />
        <ScoreBar label="Texnik bilim"  value={liveTech}    max={MAX_TECHNICAL} />
        <ScoreBar label="Dizayn"        value={liveDesign}  max={MAX_DESIGN} />
      </div>

      {/* ── Phase 1: Pre-competition nominations ── */}
      <Card className="p-6 border-amber-500/20" style={{ background: "oklch(0.16 0.04 60 / 0.4)" }}>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-amber-400" />
              1-bosqich: Oldindan baholash
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Musobaqa boshlanishidan oldin hakam tomonidan beriladi
            </p>
          </div>
          {preCompSaved ? (
            <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Saqlangan
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
              Baholanmagan
            </Badge>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-5 mb-5">
          {[
            {
              label: "Texnik bilim",
              max: MAX_TECHNICAL,
              value: tech,
              set: setTech,
              desc: "ROBOCARning sxemasi, simlar tartibi, sifati, kod tuzilishi va qisqa intervyu natijasi.",
            },
            {
              label: "Dizayn va kreativlik",
              max: MAX_DESIGN,
              value: design,
              set: setDesign,
              desc: "Tashqi ko'rinish, korpus, originallik, LED bezatish va 3D-bosma elementlar.",
            },
          ].map((f) => (
            <div key={f.label} className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>{f.label}</span>
                <Badge variant="outline" className="text-xs font-mono">/{f.max}</Badge>
              </Label>
              <Input
                type="number"
                min="0"
                max={f.max}
                step="0.5"
                value={f.value}
                onChange={(ev) => f.set(ev.target.value)}
                className="font-mono text-center text-lg"
              />
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
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
      </Card>

      {/* ── Phase 2: Competition timing ── */}
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
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
              Kutilmoqda
            </Badge>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-5">
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
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setHits(Math.max(0, hits - 1))}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                min="0"
                value={hits}
                onChange={(ev) => setHits(Math.max(0, parseInt(ev.target.value) || 0))}
                className="text-center font-mono text-xl font-bold"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setHits(hits + 1)}
              >
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
    </div>
  );
}
