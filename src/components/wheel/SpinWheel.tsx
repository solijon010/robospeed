import { useRef, useEffect, useState, useCallback } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { Shuffle, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const COLORS = [
  "#e53935", "#1e88e5", "#43a047", "#fb8c00",
  "#8e24aa", "#00897b", "#f06292", "#3949ab",
  "#c0ca33", "#6d4c41",
];

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
  const [names, setNames] = useState<string[]>([]);
  const [displayNames, setDisplayNames] = useState<string[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  // Load participants from Firebase
  useEffect(() => {
    const q = query(collection(db, "participants"), orderBy("created_at"));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => (d.data().full_name as string) || "?");
      setNames(list);
      setDisplayNames(list);
    });
  }, []);

  const drawWheel = useCallback((angle: number, nameList: string[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const r = cx - 8;
    const n = nameList.length;
    if (n === 0) {
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Ishtirokchilar yo'q", cx, cy);
      return;
    }
    const arc = (2 * Math.PI) / n;
    ctx.clearRect(0, 0, size, size);

    // Outer shadow ring
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fill();

    // Segments
    for (let i = 0; i < n; i++) {
      const start = angle + i * arc;
      const end = start + arc;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + arc / 2);
      const fontSize = Math.max(10, Math.min(18, (r * 0.38) / Math.max(n / 6, 1)));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 4;
      ctx.textAlign = "right";
      ctx.fillText(nameList[i].length > 16 ? nameList[i].slice(0, 14) + "…" : nameList[i], r - 14, fontSize / 3);
      ctx.restore();
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, 2 * Math.PI);
    const grad = ctx.createRadialGradient(cx - 6, cy - 6, 4, cx, cy, 28);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(1, "#cbd5e1");
    ctx.fillStyle = grad;
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }, []);

  // Redraw when names or angle changes
  useEffect(() => {
    drawWheel(angleRef.current, displayNames);
  }, [displayNames, drawWheel]);

  const spin = useCallback(() => {
    if (spinning || displayNames.length < 2) return;
    setSpinning(true);
    setWinner(null);
    cancelAnimationFrame(rafRef.current);

    const totalSpin = (8 + Math.random() * 6) * 2 * Math.PI;
    const startAngle = angleRef.current;
    const endAngle = startAngle + totalSpin;
    const duration = 4000 + Math.random() * 2000;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      angleRef.current = startAngle + (endAngle - startAngle) * eased;
      drawWheel(angleRef.current, displayNames);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        const n = displayNames.length;
        const arc = (2 * Math.PI) / n;
        const norm = ((angleRef.current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const idx = Math.floor(((2 * Math.PI - norm) % (2 * Math.PI)) / arc) % n;
        setWinner(displayNames[idx]);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  }, [spinning, displayNames, drawWheel]);

  // Ctrl+Enter shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") spin();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [spin]);

  const handleShuffle = () => setDisplayNames((prev) => shuffle(prev));
  const handleSort = () => setDisplayNames((prev) => [...prev].sort((a, b) => a.localeCompare(b)));
  const handleReset = () => { setWinner(null); setDisplayNames(names); };

  // Responsive canvas size
  const CANVAS = 520;

  return (
    <div
      className="flex w-full overflow-hidden"
      style={{ height: "100dvh", background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)" }}
    >
      {/* ── Wheel area ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
        {winner && (
          <div className="flex items-center gap-3 bg-yellow-400 text-yellow-900 px-8 py-3 rounded-2xl font-extrabold text-2xl shadow-xl animate-bounce">
            <Trophy className="w-7 h-7" />
            {winner}
          </div>
        )}

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS}
            height={CANVAS}
            onClick={spin}
            className="cursor-pointer drop-shadow-2xl"
            style={{ borderRadius: "50%" }}
          />

          {/* Pointer arrow (right side) */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3">
            <div
              style={{
                width: 0, height: 0,
                borderTop: "14px solid transparent",
                borderBottom: "14px solid transparent",
                borderRight: "28px solid #22c55e",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
              }}
            />
          </div>

          {!spinning && !winner && displayNames.length > 1 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-1">
              <p className="text-white font-extrabold text-xl drop-shadow-lg">Click to spin</p>
              <p className="text-white/70 text-sm drop-shadow">or press Ctrl+Enter</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Names panel ── */}
      <div className="w-72 flex flex-col border-l border-white/10 bg-white/5 backdrop-blur">
        {/* Header */}
        <div className="px-4 py-4 border-b border-white/10">
          <h3 className="text-white font-bold text-base">Ishtirokchilar</h3>
          <p className="text-white/50 text-xs mt-0.5">{displayNames.length} ta</p>
        </div>

        {/* Controls */}
        <div className="flex gap-2 px-4 py-3 border-b border-white/10">
          <Button size="sm" variant="secondary" className="flex-1 gap-1.5" onClick={handleShuffle}>
            <Shuffle className="w-3.5 h-3.5" /> Aralashtir
          </Button>
          <Button size="sm" variant="secondary" className="flex-1 gap-1.5" onClick={handleSort}>
            Sort
          </Button>
        </div>

        {/* Names list */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {displayNames.length === 0 ? (
            <p className="text-white/40 text-sm text-center mt-8">
              Ro'yxatga olish sahifasida ishtirokchilarni qo'shing
            </p>
          ) : (
            displayNames.map((name, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="text-white/80 text-sm truncate">{name}</span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10 space-y-2">
          {winner && (
            <div className="bg-yellow-400/20 border border-yellow-400/40 rounded-xl px-3 py-2 text-center">
              <p className="text-yellow-300 text-xs font-medium">G'olib</p>
              <p className="text-yellow-200 font-bold truncate">{winner}</p>
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-1.5 border-white/20 text-white/70 hover:text-white"
            onClick={handleReset}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Qayta boshlash
          </Button>
          <Button
            size="lg"
            className="w-full font-bold text-base"
            onClick={spin}
            disabled={spinning || displayNames.length < 2}
            style={{ background: spinning ? "#334155" : "var(--gradient-hero)" }}
          >
            {spinning ? "Aylanmoqda…" : "Aylantirish"}
          </Button>
        </div>
      </div>
    </div>
  );
}
