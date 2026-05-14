import { useEffect, useRef } from "react";

interface Props {
  num: string;
  name: string;
  onDone: () => void;
}

const CONFETTI_COLORS = [
  "#f59e0b","#10b981","#3b82f6","#ec4899",
  "#8b5cf6","#f97316","#06b6d4","#84cc16",
];

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: 8 + Math.random() * 10,
      h: 5 + Math.random() * 7,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      speed: 2 + Math.random() * 4,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.15,
      drift: (Math.random() - 0.5) * 1.5,
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => {
        ctx.save();
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
        p.y += p.speed;
        p.x += p.drift;
        p.angle += p.spin;
        if (p.y > canvas.height) {
          p.y = -p.h;
          p.x = Math.random() * canvas.width;
        }
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}

export function WinnerModal({ num, name, onDone }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onDone} />

      {/* Card */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-[480px] overflow-hidden">
        <Confetti />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center py-16 px-10 text-center">
          <div className="text-[100px] font-black text-slate-900 leading-none">
            {num}
          </div>
          <p className="text-slate-500 text-xl font-semibold mt-2">{name}</p>
          <p className="text-slate-400 text-base mt-1">Tanlandi</p>
        </div>

        {/* Button */}
        <div className="relative z-10 border-t border-slate-100">
          <button
            onClick={onDone}
            className="w-full py-4 text-base font-bold text-white transition-colors"
            style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)" }}
          >
            TAYYOR
          </button>
        </div>
      </div>
    </div>
  );
}
