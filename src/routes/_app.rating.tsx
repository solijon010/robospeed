import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { finalTime, accuracyScore, speedScore } from "@/lib/scoring";
import { FastestCard } from "@/components/rating/FastestCard";
import { RatingTable, type RatingRow } from "@/components/rating/RatingTable";

export const Route = createFileRoute("/_app/rating")({
  head: () => ({ meta: [{ title: "Reyting — ROBO SPEED" }] }),
  component: RatingPage,
});

interface Row {
  id: string;
  full_name: string;
  group_name: string;
  e: RatingRow["e"];
}

function RatingPage() {
  const qc = useQueryClient();

  const { data: rows = [] } = useQuery({
    queryKey: ["rating"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participants")
        .select("id, full_name, group_name, evaluations(time_seconds, red_line_hits, technical_score, design_score, control_score)");
      if (error) throw error;
      return (data ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        group_name: p.group_name,
        e: Array.isArray(p.evaluations) ? p.evaluations[0] ?? null : p.evaluations,
      })) as Row[];
    },
    refetchInterval: 5000,
  });

  useEffect(() => {
    const ch = supabase
      .channel("rating-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "evaluations" }, () => {
        qc.invalidateQueries({ queryKey: ["rating"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "participants" }, () => {
        qc.invalidateQueries({ queryKey: ["rating"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const finished = rows.filter((r) => r.e && r.e.time_seconds > 0);
  const bestFinal = finished.length
    ? Math.min(...finished.map((r) => finalTime(r.e!.time_seconds, r.e!.red_line_hits)))
    : 0;

  const computed: RatingRow[] = rows.map((r) => {
    const e = r.e;
    if (!e || !e.time_seconds) {
      return { ...r, ft: 0, speed: 0, accuracy: 0, total: 0, hasResult: false };
    }
    const ft = finalTime(e.time_seconds, e.red_line_hits);
    const speed = speedScore(ft, bestFinal);
    const accuracy = accuracyScore(e.red_line_hits);
    const total = speed + accuracy + Number(e.technical_score) + Number(e.design_score) + Number(e.control_score);
    return { ...r, ft, speed, accuracy, total, hasResult: true };
  });

  const ranked = [...computed].sort((a, b) => {
    if (a.hasResult !== b.hasResult) return a.hasResult ? -1 : 1;
    return b.total - a.total;
  });

  const fastest = finished.length
    ? finished.reduce(
        (best, r) => {
          const ft = finalTime(r.e!.time_seconds, r.e!.red_line_hits);
          return !best || ft < best.ft ? { name: r.full_name, ft } : best;
        },
        null as null | { name: string; ft: number },
      )
    : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Onlayn musobaqa reytingi</h1>
          <p className="text-muted-foreground mt-1">
            Jami: {rows.length} ishtirokchi · Yakunlangan: {finished.length}
          </p>
        </div>
        {fastest && <FastestCard name={fastest.name} ft={fastest.ft} />}
      </div>
      <RatingTable ranked={ranked} />
      <p className="text-xs text-muted-foreground">
        Hisoblash: Yakuniy vaqt = Vaqt + (Bosishlar × 5s). Tezlik = (eng_yaxshi / yakuniy) × 50. Aniqlik = 20 − Bosishlar × 5.
      </p>
    </div>
  );
}
