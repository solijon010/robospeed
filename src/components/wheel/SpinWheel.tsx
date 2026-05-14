import { useRef, useEffect, useState, useCallback } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { Shuffle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WinnerModal } from "./WinnerModal";

const COLORS = [
  "#e53935", "#1e88e5", "#43a047", "#fb8c00",
  "#8e24aa", "#00897b", "#f06292", "#3949ab",
  "#c0ca33", "#6d4c41",
];

interface Participant { num: number; name: string }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function SpinWheel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);
  const rafRef = useRef<number>(0);
  const [all, setAll] = useState<Participant[]>([]);
  const [display, setDisplay] = useState<Participant[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Load participants — sequential number = index + 1
  useEffect(() => {
    const q = query(collection(db, "participants"), orderBy("created_at"));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d, i) => ({
        num: i + 1,
        name: (d.data().full_name as string) || "?",
      }));
      setAll(list);
      setDisplay(list);
    });
  }, []);

  const drawWheel = useCallback((angle: number, items: Participant[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const r = cx - 8;
    const n = items.length;

    ctx.clearRect(0, 0, size, size);

    if (n === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.fillStyle = "#1e293b";
      ctx.fill();
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Ishtirokchilar yo'q", cx, cy);
      return;
    }

    const arc = (2 * Math.PI) / n;

    // Shadow ring
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fill();

    for (let i = 0; i < n; i++) {
      const start = angle + i * arc;
      const end = start + arc;

      // Segment fill
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Number label — large and centered in segment
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + arc / 2);

      const numSize = Math.max(14, Math.min(36, r * 0.28));
      ctx.font = `900 ${numSize}px sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 6;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${items[i].num}`, r * 0.62, 0);

      ctx.restore();
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, 2 * Math.PI);
    const g = ctx.createRadialGradient(cx - 5, cy - 5, 3, cx, cy, 26);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(1, "#cbd5e1");
    ctx.fillStyle = g;
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }, []);

  const spin = useCallback(() => {
    if (spinning || display.length < 2) return;
    setSpinning(true);
    setWinner(null);
    cancelAnimationFrame(rafRef.current);

    const totalSpin = (8 + Math.random() * 6) * 2 * Math.PI;
    const startAngle = angleRef.current;
    const endAngle = startAngle + totalSpin;
    const duration = 4000 + Math.random() * 2000;
    const startTime = performance.now();

    const animate = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      angleRef.current = startAngle + (endAngle - startAngle) * eased;
      drawWheel(angleRef.current, display);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        const n = display.length;
        const arc = (2 * Math.PI) / n;
        const norm = ((angleRef.current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const idx = Math.floor(((2 * Math.PI - norm) % (2 * Math.PI)) / arc) % n;
        const w = display[idx];
        setWinner(w);
        setShowModal(true);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  }, [spinning, display, drawWheel]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.ctrlKey && e.key === "Enter") spin(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [spin]);

  const handleShuffle = () => setDisplay((p) => shuffle(p));
  const handleSort    = () => setDisplay([...all]);
  const handleReset   = () => { setWinner(null); setShowModal(false); setDisplay(all); };

  const handleRemove = () => {
    if (!winner) return;
    const next = display.filter((p) => p.num !== winner.num);
    setDisplay(next);
    setShowModal(false);
    setWinner(null);
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState(520);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const size = Math.floor(Math.min(width - 80, height - 120));
      setCanvasSize(Math.max(size, 300));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Redraw when canvas size changes
  useEffect(() => {
    drawWheel(angleRef.current, display);
  }, [canvasSize, display, drawWheel]);

  return (
    <div
      className="flex w-full overflow-hidden"
      style={{ height: "100dvh", background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)" }}
    >
      {/* ── Winner modal ── */}
      {showModal && winner && (
        <WinnerModal
          num={winner.num}
          name={winner.name}
          onDone={handleRemove}
        />
      )}

      {/* ── Wheel ── */}
      <div ref={containerRef} className="flex-1 flex flex-col items-center justify-center gap-6 px-8">

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={canvasSize}
            height={canvasSize}
            onClick={spin}
            className="cursor-pointer drop-shadow-2xl"
            style={{ borderRadius: "50%" }}
          />

          {/* Pointer */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3">
            <div style={{
              width: 0, height: 0,
              borderTop: "14px solid transparent",
              borderBottom: "14px solid transparent",
              borderRight: "28px solid #22c55e",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
            }} />
          </div>

          {!spinning && !winner && display.length > 1 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-1">
              <p className="text-white font-extrabold text-xl drop-shadow-lg">Bosing yoki</p>
              <p className="text-white/70 text-sm drop-shadow">Ctrl+Enter</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Panel ── */}
      <div className="w-72 flex flex-col border-l border-white/10 bg-white/5 backdrop-blur">
        <div className="px-4 py-4 border-b border-white/10">
          <h3 className="text-white font-bold text-base">Ishtirokchilar</h3>
          <p className="text-white/50 text-xs mt-0.5">{display.length} ta</p>
        </div>

        <div className="flex gap-2 px-4 py-3 border-b border-white/10">
          <Button size="sm" variant="secondary" className="flex-1 gap-1.5" onClick={handleShuffle}>
            <Shuffle className="w-3.5 h-3.5" /> Aralashtir
          </Button>
          <Button size="sm" variant="secondary" className="flex-1" onClick={handleSort}>
            Tartibla
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2">
          {display.length === 0 ? (
            <p className="text-white/40 text-sm text-center mt-8">
              Ro'yxatga olish sahifasida ishtirokchilarni qo'shing
            </p>
          ) : (
            display.map((p, i) => (
              <div key={p.num} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-extrabold text-sm shrink-0"
                  style={{ background: COLORS[i % COLORS.length] }}
                >
                  {p.num}
                </div>
                <span className="text-white/80 text-sm truncate">{p.name}</span>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t border-white/10 space-y-2">
          {winner && !showModal && (
            <div className="bg-yellow-400/20 border border-yellow-400/40 rounded-xl px-3 py-2 text-center">
              <p className="text-yellow-300 text-xs font-medium">G'olib</p>
              <p className="text-yellow-200 font-bold">№{winner.num} — {winner.name}</p>
            </div>
          )}
          <Button size="sm" variant="outline"
            className="w-full gap-1.5 border-white/20 text-white/70 hover:text-white"
            onClick={handleReset}>
            <RotateCcw className="w-3.5 h-3.5" /> Qayta boshlash
          </Button>
          <Button size="lg" className="w-full font-bold text-base" onClick={spin}
            disabled={spinning || display.length < 2}
            style={{ background: spinning ? "#334155" : "var(--gradient-hero)" }}>
            {spinning ? "Aylanmoqda…" : "Aylantirish"}
          </Button>
        </div>
      </div>
    </div>
  );
}
