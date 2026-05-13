import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ParticipantSelector } from "@/components/evaluate/ParticipantSelector";
import { EvaluateForm } from "@/components/evaluate/EvaluateForm";
import type { ParticipantWithEval } from "@/components/evaluate/types";

export const Route = createFileRoute("/_app/evaluate")({
  head: () => ({ meta: [{ title: "Baholash — ROBO SPEED" }] }),
  component: EvaluatePage,
});

function EvaluatePage() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: rows = [] } = useQuery({
    queryKey: ["participants-with-eval"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participants")
        .select("id, full_name, group_name, evaluations(id, time_seconds, red_line_hits, technical_score, design_score, control_score)")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        group_name: p.group_name,
        evaluation: Array.isArray(p.evaluations) ? p.evaluations[0] ?? null : p.evaluations,
      })) as ParticipantWithEval[];
    },
  });

  useEffect(() => {
    if (!selectedId && rows.length) setSelectedId(rows[0].id);
  }, [rows, selectedId]);

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Baholash</h1>
        <p className="text-muted-foreground mt-1">
          Ishtirokchini tanlang, vaqt va qizil chiziq bosishlarini kiriting. Jarima avtomatik hisoblanadi.
        </p>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <ParticipantSelector rows={rows} selectedId={selectedId} onSelect={setSelectedId} />
        {selected && selected.evaluation ? (
          <EvaluateForm
            key={selected.id}
            participant={selected}
            onSaved={() => {
              qc.invalidateQueries({ queryKey: ["participants-with-eval"] });
              qc.invalidateQueries({ queryKey: ["rating"] });
            }}
          />
        ) : (
          <Card className="p-12 text-center text-muted-foreground">Ishtirokchini tanlang</Card>
        )}
      </div>
    </div>
  );
}
