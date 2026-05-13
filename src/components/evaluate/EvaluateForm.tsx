import { useMemo, useState, useEffect } from "react";
import { collection, doc, updateDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Save, Timer, Zap } from "lucide-react";
import { toast } from "sonner";
import {
  PENALTY_PER_HIT,
  MAX_TECHNICAL,
  MAX_DESIGN,
  MAX_CONTROL,
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

export function EvaluateForm({ participant, onSaved }: Props) {
  const e = participant.evaluation!;
  const [time, setTime] = useState(String(e.time_seconds || ""));
  const [hits, setHits] = useState(e.red_line_hits || 0);
  const [tech, setTech] = useState(String(e.technical_score || ""));
  const [design, setDesign] = useState(String(e.design_score || ""));
  const [control, setControl] = useState(String(e.control_score || ""));
  const [saving, setSaving] = useState(false);
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

  const tNum = parseFloat(time) || 0;
  const ft = useMemo(() => finalTime(tNum, hits), [tNum, hits]);
  const penalty = hits * PENALTY_PER_HIT;
  const accuracy = accuracyScore(hits);
  const liveTech = clamp(parseFloat(tech) || 0, 0, MAX_TECHNICAL);
  const liveDesign = clamp(parseFloat(design) || 0, 0, MAX_DESIGN);
  const liveControl = clamp(parseFloat(control) || 0, 0, MAX_CONTROL);

  const bestFinal = useMemo(() => {
    const times = allEvals.map((ev) => finalTime(ev.time_seconds, ev.red_line_hits));
    if (ft > 0) times.push(ft);
    return times.length ? Math.min(...times) : ft || 0;
  }, [allEvals, ft]);

  const liveSpeed = tNum > 0 ? speedScore(ft, bestFinal) : 0;
  const liveTotal = liveSpeed + accuracy + liveTech + liveDesign + liveControl;

  const liveBars = [
    { label: "Tezlik", value: liveSpeed, max: MAX_SPEED },
    { label: "Aniqlik", value: accuracy, max: MAX_ACCURACY },
    { label: "Texnik", value: liveTech, max: MAX_TECHNICAL },
    { label: "Dizayn", value: liveDesign, max: MAX_DESIGN },
    { label: "Boshqaruv", value: liveControl, max: MAX_CONTROL },
  ];

  const save = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "evaluations", e.id), {
        time_seconds: tNum,
        red_line_hits: hits,
        technical_score: liveTech,
        design_score: liveDesign,
        control_score: liveControl,
        updated_at: serverTimestamp(),
      });
      toast.success("Natija saqlandi");
      onSaved();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
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
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Yakuniy vaqt</div>
              <div className="text-3xl font-mono font-bold" style={{ color: "var(--color-accent)" }}>
                {fmtTime(ft)}
              </div>
              {penalty > 0 && (
                <div className="text-xs text-destructive">+{penalty}s jarima ({hits} bosish)</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Joriy ball</div>
              <div className="text-3xl font-mono font-bold" style={{ color: "var(--color-primary)" }}>
                {liveTotal.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">/ 100</div>
            </div>
          </div>
        </div>

        {/* Score breakdown bars */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          {liveBars.map((s) => {
            const pct = s.max > 0 ? (s.value / s.max) * 100 : 0;
            const barColor =
              pct >= 80
                ? "oklch(0.7 0.18 145)"
                : pct >= 50
                  ? "oklch(0.78 0.22 60)"
                  : "oklch(0.65 0.25 25)";
            return (
              <div
                key={s.label}
                className="text-center px-2 py-3 rounded-lg"
                style={{ background: "oklch(0.22 0.03 260)" }}
              >
                <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                <div className="text-xl font-bold font-mono" style={{ color: barColor }}>
                  {s.value % 1 === 0 ? s.value : s.value.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground/60">/{s.max}</div>
                <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: barColor }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Time + hits */}
        <div className="grid md:grid-cols-2 gap-6">
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
      </Card>

      {/* Judge scores */}
      <Card className="p-6">
        <h3 className="font-semibold mb-5 flex items-center gap-2">
          Hakam tomonidan beriladigan balllar
          <Badge variant="secondary" className="text-xs font-normal">maks. 30 ball</Badge>
        </h3>
        <div className="grid md:grid-cols-3 gap-5">
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
            {
              label: "Boshqaruv aniqligi",
              max: MAX_CONTROL,
              value: control,
              set: setControl,
              desc: "Yurish davomida silliq va aniq harakatlanish — keskin to'xtash va chayqalishsiz.",
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
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} size="lg" className="min-w-36">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </div>
    </div>
  );
}
