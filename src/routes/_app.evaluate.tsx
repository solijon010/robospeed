import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { EvaluateForm } from "@/components/evaluate/EvaluateForm";
import { Users, CheckCircle2, Clock, ClipboardCheck } from "lucide-react";
import { finalTime, fmtTime } from "@/lib/scoring";
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

  const selected = rows.find((r) => r.id === selectedId) ?? null;
  const evaluatedCount = rows.filter((r) => r.evaluation && r.evaluation.time_seconds > 0).length;
  const preCompCount = rows.filter(
    (r) =>
      r.evaluation &&
      (Number(r.evaluation.technical_score) > 0 || Number(r.evaluation.design_score) > 0),
  ).length;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Left: Participant list ── */}
      <div
        className="w-72 shrink-0 flex flex-col border-r border-border/60"
        style={{ background: "oklch(0.14 0.04 255)" }}
      >
        {/* List header */}
        <div className="px-4 py-3.5 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Ishtirokchilar</span>
            <span className="ml-auto text-xs font-mono bg-secondary/60 px-2 py-0.5 rounded-full text-muted-foreground">
              {rows.length}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400/70" />
              Oldindan: {preCompCount}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400/70" />
              Yakuniy: {evaluatedCount}
            </span>
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-0.5">
          {rows.length === 0 ? (
            <p className="p-4 text-xs text-muted-foreground text-center">
              Avval ishtirokchini ro'yxatga oling
            </p>
          ) : (
            rows.map((p, i) => {
              const ev = p.evaluation;
              const ft = ev && ev.time_seconds > 0 ? finalTime(ev.time_seconds, ev.red_line_hits) : 0;
              const compDone = ft > 0;
              const preCompDone =
                ev && (Number(ev.technical_score) > 0 || Number(ev.design_score) > 0);
              const active = p.id === selectedId;

              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 flex items-center gap-2.5 group ${
                    active ? "bg-primary text-primary-foreground" : "hover:bg-secondary/60"
                  }`}
                >
                  {/* Number */}
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={
                      active
                        ? { background: "rgba(255,255,255,0.2)" }
                        : { background: "oklch(0.78 0.18 220 / 0.15)", color: "var(--color-primary)" }
                    }
                  >
                    {p.custom_number || i + 1}
                  </div>

                  {/* Name + group */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate leading-tight">{p.full_name}</div>
                    <div
                      className={`text-xs mt-0.5 truncate ${
                        active ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {p.group_name}
                    </div>
                  </div>

                  {/* Status icon */}
                  <div className="shrink-0 flex flex-col items-end gap-0.5">
                    {compDone ? (
                      <>
                        <span
                          className={`text-xs font-mono font-semibold ${
                            active ? "text-primary-foreground" : "text-accent"
                          }`}
                        >
                          {fmtTime(ft)}
                        </span>
                        <CheckCircle2
                          className={`w-3 h-3 ${
                            active ? "text-primary-foreground/70" : "text-emerald-400"
                          }`}
                        />
                      </>
                    ) : preCompDone ? (
                      <ClipboardCheck
                        className={`w-3.5 h-3.5 ${
                          active ? "text-primary-foreground/70" : "text-amber-400"
                        }`}
                      />
                    ) : (
                      <Clock
                        className={`w-3.5 h-3.5 ${
                          active ? "text-primary-foreground/40" : "text-muted-foreground/30"
                        }`}
                      />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* List footer */}
        <div className="shrink-0 border-t border-border/60 px-4 py-2.5 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-muted-foreground">Jonli yangilanish</span>
        </div>
      </div>

      {/* ── Right: Evaluation form ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6 max-w-3xl mx-auto">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
              <Users className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">Ishtirokchini chap paneldan tanlang</p>
            </div>
          ) : selected.evaluation ? (
            <EvaluateForm key={selected.id} participant={selected} onSaved={() => {}} />
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
