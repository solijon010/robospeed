import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Save, Timer } from "lucide-react";
import { toast } from "sonner";
import {
  PENALTY_PER_HIT,
  MAX_TECHNICAL,
  MAX_DESIGN,
  MAX_CONTROL,
  finalTime,
  accuracyScore,
  fmtTime,
} from "@/lib/scoring";
import { ScoreInput } from "./ScoreInput";
import type { ParticipantWithEval } from "./types";

interface Props {
  participant: ParticipantWithEval;
  onSaved: () => void;
}

export function EvaluateForm({ participant, onSaved }: Props) {
  const e = participant.evaluation!;
  const [time, setTime] = useState(String(e.time_seconds || ""));
  const [hits, setHits] = useState(e.red_line_hits || 0);
  const [tech, setTech] = useState(String(e.technical_score || ""));
  const [design, setDesign] = useState(String(e.design_score || ""));
  const [control, setControl] = useState(String(e.control_score || ""));
  const [saving, setSaving] = useState(false);

  const tNum = parseFloat(time) || 0;
  const ft = useMemo(() => finalTime(tNum, hits), [tNum, hits]);
  const penalty = hits * PENALTY_PER_HIT;
  const accuracy = accuracyScore(hits);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("evaluations")
      .update({
        time_seconds: tNum,
        red_line_hits: hits,
        technical_score: clamp(parseFloat(tech) || 0, 0, MAX_TECHNICAL),
        design_score: clamp(parseFloat(design) || 0, 0, MAX_DESIGN),
        control_score: clamp(parseFloat(control) || 0, 0, MAX_CONTROL),
        updated_at: new Date().toISOString(),
      })
      .eq("id", e.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Saqlandi");
      onSaved();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold">{participant.full_name}</h2>
            <p className="text-sm text-muted-foreground">{participant.group_name}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase">Yakuniy vaqt</div>
            <div className="text-3xl font-mono font-bold text-accent">{fmtTime(ft)}</div>
            {penalty > 0 && <div className="text-xs text-destructive">+{penalty}s jarima</div>}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Timer className="w-4 h-4" /> Yurish vaqti (sekund)
            </Label>
            <Input type="number" step="0.01" min="0" value={time} onChange={(ev) => setTime(ev.target.value)} placeholder="24.50" />
            <p className="text-xs text-muted-foreground">Robocar startdan finishgacha bo'lgan toza vaqt.</p>
          </div>

          <div className="space-y-2">
            <Label>Qizil chiziq bosishlari</Label>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="icon" onClick={() => setHits(Math.max(0, hits - 1))}>
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                min="0"
                value={hits}
                onChange={(ev) => setHits(Math.max(0, parseInt(ev.target.value) || 0))}
                className="text-center font-mono text-lg"
              />
              <Button type="button" variant="outline" size="icon" onClick={() => setHits(hits + 1)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Har biri uchun +{PENALTY_PER_HIT}s · Aniqlik balli:{" "}
              <span className="text-foreground font-semibold">{accuracy}/20</span>
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Mezon ballari (hakam tomonidan)</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <ScoreInput label="Texnik bilim" max={MAX_TECHNICAL} value={tech} onChange={setTech} />
          <ScoreInput label="Dizayn" max={MAX_DESIGN} value={design} onChange={setDesign} />
          <ScoreInput label="Boshqaruv" max={MAX_CONTROL} value={control} onChange={setControl} />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </div>
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
