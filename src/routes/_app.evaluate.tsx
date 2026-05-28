import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { EvaluateForm } from "@/components/evaluate/EvaluateForm";
import { Users, Clock } from "lucide-react";
import type { ParticipantWithEval, Evaluation } from "@/components/evaluate/types";

export const Route = createFileRoute("/_app/evaluate")({
  head: () => ({ meta: [{ title: "Baholash — ROBO SPEED" }] }),
  component: EvaluatePage,
});

interface FireParticipant {
  id: string;
  full_name: string;
  group_name: string;
  custom_number?: string | null;
}

interface FireEvaluation extends Evaluation {
  participant_id: string;
}

function EvaluatePage() {
  const [participants, setParticipants] = useState<FireParticipant[]>([]);
  const [evaluations, setEvaluations] = useState<FireEvaluation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "participants"), orderBy("created_at"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FireParticipant);
      setParticipants(list);
      setSelectedId((prev) => prev ?? (list[0]?.id ?? null));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "evaluations"), (snap) => {
      setEvaluations(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FireEvaluation));
    });
    return () => unsub();
  }, []);

  const rows: ParticipantWithEval[] = participants.map((p) => ({
    id: p.id,
    full_name: p.full_name,
    group_name: p.group_name,
    custom_number: p.custom_number,
    evaluation: evaluations.find((e) => e.participant_id === p.id) ?? null,
  }));

  const currentIndex = rows.findIndex((r) => r.id === selectedId);
  const selected = currentIndex >= 0 ? rows[currentIndex] : null;

  const goTo = (idx: number) => {
    if (idx >= 0 && idx < rows.length) setSelectedId(rows[idx].id);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
              <Users className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">
                Avval ro'yxatga olish sahifasidan ishtirokchi qo'shing
              </p>
            </div>
          ) : !selected ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
              <Clock className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">Ishtirokchi tanlanmagan</p>
            </div>
          ) : selected.evaluation ? (
            <EvaluateForm
              key={selected.id}
              participant={selected}
              rows={rows}
              onSaved={() => {}}
              onSelect={setSelectedId}
              currentIndex={currentIndex}
              totalCount={rows.length}
              onPrev={currentIndex > 0 ? () => goTo(currentIndex - 1) : undefined}
              onNext={currentIndex < rows.length - 1 ? () => goTo(currentIndex + 1) : undefined}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
              <Clock className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">
                Bu ishtirokchi uchun baholash yozuvi topilmadi
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
