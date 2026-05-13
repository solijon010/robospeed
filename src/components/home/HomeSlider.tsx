import { useState, useEffect } from "react";
import { ScoringTable } from "./ScoringTable";

const INTERVAL = 5000;

export function HomeSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % 2);
    }, INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-2xl w-full"
      style={{ height: "calc(100dvh - 2rem)" }}
    >
      {/* Slide 1 — Scoring table */}
      <div
        className="absolute inset-0 transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(${current === 0 ? "0%" : "-100%"})` }}
      >
        <ScoringTable />
      </div>

      {/* Slide 2 — Hashim School building */}
      <div
        className="absolute inset-0 transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(${current === 1 ? "0%" : "100%"})` }}
      >
        <img
          src="/hashim-school.jpg"
          alt="Hashim School"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/25 via-transparent to-transparent" />
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2.5 z-10">
        {[0, 1].map((i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="h-2.5 rounded-full transition-all duration-300 cursor-pointer"
            style={{
              width: i === current ? "2rem" : "0.625rem",
              background: i === current ? "#fff" : "rgba(255,255,255,0.45)",
            }}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 z-10">
        <div
          key={current}
          className="h-full bg-white/60"
          style={{ animation: `sliderProgress ${INTERVAL}ms linear` }}
        />
      </div>

      <style>{`
        @keyframes sliderProgress {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  );
}
