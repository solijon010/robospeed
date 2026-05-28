import { useEffect } from "react";
import confetti from "canvas-confetti";

interface Props {
  num: string;
  name: string;
  onDone: () => void;
}

function fireConfetti() {
  const count = 300;
  const defaults = { origin: { y: 0.6 }, zIndex: 9999 };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
  }

  fire(0.25, { spread: 26, startVelocity: 55, scalar: 1.2 });
  fire(0.2,  { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1,  { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1,  { spread: 120, startVelocity: 45 });

  // ikkinchi salvo chapdan va o'ngdan
  setTimeout(() => {
    confetti({ particleCount: 80, angle: 60,  spread: 55, origin: { x: 0, y: 0.7 }, zIndex: 9999 });
    confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, zIndex: 9999 });
  }, 250);
}

export function WinnerModal({ num, name, onDone }: Props) {
  useEffect(() => {
    fireConfetti();
  }, []);

  return (
    <div className="fixed inset-0 z-9998 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onDone}
      />

      {/* Card */}
      <div className="relative z-9999 bg-white rounded-3xl shadow-2xl w-110 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Top accent */}
        <div className="h-2 w-full" style={{ background: "linear-gradient(90deg,#f59e0b,#f97316,#ec4899,#8b5cf6)" }} />

        {/* Content */}
        <div className="flex flex-col items-center justify-center pt-12 pb-8 px-10 text-center gap-3">
          <div
            className="w-32 h-32 rounded-full flex items-center justify-center text-white font-black text-6xl shadow-xl mb-2"
            style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)" }}
          >
            {num}
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 leading-tight">{name}</h2>
          <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Tanlandi</span>
        </div>

        {/* Button */}
        <div className="px-8 pb-8">
          <button
            onClick={onDone}
            className="w-full py-4 rounded-2xl text-base font-bold text-white shadow-lg hover:opacity-90 active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)" }}
          >
            TAYYOR
          </button>
        </div>
      </div>
    </div>
  );
}
