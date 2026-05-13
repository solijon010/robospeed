import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EvaluateForm } from "@/components/evaluate/EvaluateForm";
import { Users, X, CheckCircle2, Clock } from "lucide-react";
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
  const [drawerOpen, setDrawerOpen] = useState(false);

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
  const evaluatedCount = rows.filter(
    (r) => r.evaluation && r.evaluation.time_seconds > 0,
  ).length;

  return (
    <div className="p-4 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Baholash</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Ishtirokchini tanlang, vaqt va qizil chiziq bosishlarini kiriting.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => setDrawerOpen((o) => !o)}
          className={`flex items-center gap-2 h-10 px-4 transition-all duration-200 ${
            drawerOpen
              ? "border-primary text-primary bg-primary/5"
              : "hover:border-primary/50"
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="font-medium">Ishtirokchilar</span>
          <div className="flex items-center gap-1 ml-1">
            <Badge
              variant={drawerOpen ? "default" : "secondary"}
              className="text-xs h-5 px-1.5 font-mono"
            >
              {rows.length}
            </Badge>
            {evaluatedCount > 0 && (
              <Badge className="text-xs h-5 px-1.5 bg-emerald-500/20 text-emerald-400 border-0">
                ✓ {evaluatedCount}
              </Badge>
            )}
          </div>
        </Button>
      </div>

      {/* Main area — flex row, drawer pushes form left */}
      <div className="flex gap-5 items-start">
        {/* Evaluate form — compresses when drawer opens */}
        <div className="flex-1 min-w-0">
          {selected && selected.evaluation ? (
            <EvaluateForm key={selected.id} participant={selected} onSaved={() => {}} />
          ) : (
            <Card className="p-16 text-center">
              {participants.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-muted-foreground">Avval ishtirokchini ro'yxatga oling</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Users className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                  <p className="text-muted-foreground">
                    Baholash uchun ishtirokchini tanlang
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDrawerOpen(true)}
                    className="mx-auto"
                  >
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    Ishtirokchilar ro'yxati
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Animated drawer — NOT absolute, pushes main content */}
        <div
          style={{
            width: drawerOpen ? "340px" : "0px",
            flexShrink: 0,
            overflow: "hidden",
            transition: "width 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div style={{ width: "340px" }}>
            <Card className="overflow-hidden border border-border">
              {/* Drawer header */}
              <div
                className="flex items-center justify-between px-4 py-3 border-b border-border"
                style={{ background: "oklch(0.20 0.04 250)" }}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm">Ishtirokchilar</span>
                  <Badge variant="secondary" className="text-xs font-mono h-5 px-1.5">
                    {rows.length}
                  </Badge>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-7 h-7 hover:bg-secondary/60"
                  onClick={() => setDrawerOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Participant list */}
              <div
                className="overflow-y-auto"
                style={{ maxHeight: "calc(100vh - 220px)" }}
              >
                {rows.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground text-center">
                    Avval ishtirokchini ro'yxatga oling
                  </p>
                ) : (
                  <div className="p-2 space-y-0.5">
                    {rows.map((p, i) => {
                      const ev = p.evaluation;
                      const ft =
                        ev && ev.time_seconds > 0
                          ? finalTime(ev.time_seconds, ev.red_line_hits)
                          : 0;
                      const hasResult = ft > 0;
                      const active = p.id === selectedId;

                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedId(p.id);
                            setDrawerOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 flex items-center gap-3 group ${
                            active
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-secondary/60"
                          }`}
                        >
                          {/* Sequential number badge */}
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                            style={
                              active
                                ? { background: "rgba(255,255,255,0.2)", color: "inherit" }
                                : {
                                    background: "oklch(0.78 0.18 220 / 0.15)",
                                    color: "var(--color-primary)",
                                  }
                            }
                          >
                            {i + 1}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-sm leading-tight">
                              {p.full_name}
                            </div>
                            <div
                              className={`text-xs mt-0.5 ${
                                active ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}
                            >
                              {p.group_name}
                              {p.custom_number && (
                                <span className="ml-1.5 font-mono">#{p.custom_number}</span>
                              )}
                            </div>
                          </div>

                          {/* Status / time */}
                          <div className="shrink-0 flex flex-col items-end gap-0.5">
                            {hasResult ? (
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
                            ) : (
                              <Clock
                                className={`w-3.5 h-3.5 ${
                                  active ? "text-primary-foreground/50" : "text-muted-foreground/40"
                                }`}
                              />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Drawer footer */}
              <div className="border-t border-border px-4 py-2.5 bg-secondary/10 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Baholandi:{" "}
                  <span className="text-emerald-400 font-semibold">{evaluatedCount}</span>
                  {" "}/ {rows.length}
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-muted-foreground">Jonli</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
