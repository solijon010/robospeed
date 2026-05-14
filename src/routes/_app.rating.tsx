import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { finalTime, accuracyScore, speedScore } from "@/lib/scoring";
import { RatingTable, type RatingRow } from "@/components/rating/RatingTable";

export const Route = createFileRoute("/_app/rating")({
  head: () => ({ meta: [{ title: "Reyting — ROBO SPEED" }] }),
  component: RatingPage,
});

interface FireParticipant {
  id: string;
  full_name: string;
  group_name: string;
  custom_number?: string | null;
}

interface FireEval {
  id: string;
  participant_id: string;
  time_seconds: number;
  red_line_hits: number;
  technical_score: number;
  design_score: number;
}

function RatingPage() {
  const [participants, setParticipants] = useState<FireParticipant[]>([]);
  const [evaluations, setEvaluations] = useState<FireEval[]>([]);

  useEffect(() => {
    const q = query(collection(db, "participants"), orderBy("created_at"));
    const unsub = onSnapshot(q, (snap) => {
      setParticipants(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FireParticipant));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "evaluations"), (snap) => {
      setEvaluations(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FireEval));
    });
    return () => unsub();
  }, []);

  const rows = useMemo<RatingRow[]>(() => {
    const finished = participants.filter((p) => {
      const ev = evaluations.find((e) => e.participant_id === p.id);
      return ev && ev.time_seconds > 0;
    });

    const bestFinal = finished.length
      ? Math.min(
          ...finished.map((p) => {
            const ev = evaluations.find((e) => e.participant_id === p.id)!;
            return finalTime(ev.time_seconds, ev.red_line_hits);
          }),
        )
      : 0;

    return participants.map((p, i) => {
      const ev = evaluations.find((e) => e.participant_id === p.id) ?? null;
      if (!ev || !ev.time_seconds) {
        return { ...p, seqNum: i + 1, e: null, ft: 0, speed: 0, accuracy: 0, total: 0, hasResult: false };
      }
      const ft = finalTime(ev.time_seconds, ev.red_line_hits);
      const speed = speedScore(ft, bestFinal);
      const accuracy = accuracyScore(ev.red_line_hits);
      const total =
        speed + accuracy + Number(ev.technical_score) + Number(ev.design_score);
      return {
        ...p,
        seqNum: i + 1,
        e: {
          time_seconds: ev.time_seconds,
          red_line_hits: ev.red_line_hits,
          technical_score: ev.technical_score,
          design_score: ev.design_score,
          control_score: ev.control_score,
        },
        ft,
        speed,
        accuracy,
        total,
        hasResult: true,
      };
    });
  }, [participants, evaluations]);

  const ranked = useMemo(
    () =>
      [...rows].sort((a, b) => {
        if (a.hasResult !== b.hasResult) return a.hasResult ? -1 : 1;
        return b.total - a.total;
      }),
    [rows],
  );

  const evaluatedCount = ranked.filter((r) => r.hasResult).length;

  return (
    <div
      className="flex flex-col"
      style={{ height: "100dvh", background: "linear-gradient(160deg,#0a0f1e 0%,#0d1a2e 50%,#0a0f1e 100%)" }}
    >
      {/* Compact header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Onlayn musobaqa reytingi</h1>
            <p className="text-xs text-muted-foreground">
              Jami: <span className="text-foreground font-medium">{participants.length}</span> ishtirokchi
              &nbsp;·&nbsp;
              Yakunlangan: <span className="text-emerald-400 font-medium">{evaluatedCount}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Jonli yangilanish
        </div>
      </div>

      {/* Table fills remaining height */}
      <div className="flex-1 overflow-hidden px-4 py-4">
        <RatingTable ranked={ranked} />
      </div>
    </div>
  );
}
