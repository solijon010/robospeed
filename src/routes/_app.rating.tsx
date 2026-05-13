import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { finalTime, accuracyScore, speedScore } from "@/lib/scoring";
import { FastestCard } from "@/components/rating/FastestCard";
import { RatingTable, type RatingRow } from "@/components/rating/RatingTable";

export const Route = createFileRoute("/_app/rating")({
  head: () => ({ meta: [{ title: "Reyting — ROBO SPEED" }] }),
  component: RatingPage,
});

interface FireParticipant {
  id: string;
  full_name: string;
  group_name: string;
}

interface FireEval {
  id: string;
  participant_id: string;
  time_seconds: number;
  red_line_hits: number;
  technical_score: number;
  design_score: number;
  control_score: number;
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

    return participants.map((p) => {
      const ev = evaluations.find((e) => e.participant_id === p.id) ?? null;
      if (!ev || !ev.time_seconds) {
        return { ...p, e: null, ft: 0, speed: 0, accuracy: 0, total: 0, hasResult: false };
      }
      const ft = finalTime(ev.time_seconds, ev.red_line_hits);
      const speed = speedScore(ft, bestFinal);
      const accuracy = accuracyScore(ev.red_line_hits);
      const total =
        speed +
        accuracy +
        Number(ev.technical_score) +
        Number(ev.design_score) +
        Number(ev.control_score);
      return {
        ...p,
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

  const fastest = useMemo(() => {
    const finished = ranked.filter((r) => r.hasResult);
    if (!finished.length) return null;
    return finished.reduce(
      (best, r) => (!best || r.ft < best.ft ? { name: r.full_name, ft: r.ft } : best),
      null as null | { name: string; ft: number },
    );
  }, [ranked]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Onlayn musobaqa reytingi</h1>
          <p className="text-muted-foreground mt-1">
            Jami: {participants.length} ishtirokchi · Yakunlangan:{" "}
            {ranked.filter((r) => r.hasResult).length}
            <span className="ml-2 text-xs text-emerald-400">● Jonli yangilanish</span>
          </p>
        </div>
        {fastest && <FastestCard name={fastest.name} ft={fastest.ft} />}
      </div>

      <RatingTable ranked={ranked} />

      <p className="text-xs text-muted-foreground">
        Hisoblash: Yakuniy vaqt = Vaqt + (Bosishlar × 5s). Tezlik = (eng_yaxshi / yakuniy) × 50.
        Aniqlik = 20 − Bosishlar × 5.
      </p>
    </div>
  );
}
