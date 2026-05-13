import { Timer, ShieldCheck, Settings, Palette, Trophy, Award } from "lucide-react";

const criteria = [
  {
    num: 1,
    icon: Timer,
    title: "Tezlik (vakuniv vaqt)",
    ball: 50,
    numBg:    "linear-gradient(135deg,#3b82f6,#1d4ed8)",
    ballColor:"#1d4ed8",
    ballBg:   "#dbeafe",
    iconBg:   "#eff6ff",
    iconColor:"#3b82f6",
    desc: "Eng kam vakuniv vaqt ko'rsatgan ishtirokchi 50 ballni to'liq oladi. Boshqalarga proporsional kamayuvchi tartibda ball beriladi.",
  },
  {
    num: 2,
    icon: ShieldCheck,
    title: "Aniqlik va barqarorlik",
    ball: 20,
    numBg:    "linear-gradient(135deg,#10b981,#047857)",
    ballColor:"#047857",
    ballBg:   "#d1fae5",
    iconBg:   "#ecfdf5",
    iconColor:"#10b981",
    desc: "Qizil chiziqni umuman bosmagan ishtirokchi 20 ballni to'liq oladi. Har bir bosish uchun bu mezondan 5 ball ayriladi.",
  },
  {
    num: 3,
    icon: Settings,
    title: "Texnik bilim va yig'ish sifati",
    ball: 15,
    numBg:    "linear-gradient(135deg,#8b5cf6,#6d28d9)",
    ballColor:"#6d28d9",
    ballBg:   "#ede9fe",
    iconBg:   "#f5f3ff",
    iconColor:"#8b5cf6",
    desc: "ROBOCARning sxemasi, simlar tartibi, sifati, kod tuzilishi va ishtirokchining o'z ROBOCARni ganchalik yaxshi tushunishi (qisqa intervyu) baholanadi.",
  },
  {
    num: 4,
    icon: Palette,
    title: "Dizayn va kreativlik",
    ball: 15,
    numBg:    "linear-gradient(135deg,#f43f5e,#be123c)",
    ballColor:"#be123c",
    ballBg:   "#ffe4e6",
    iconBg:   "#fff1f2",
    iconColor:"#f43f5e",
    desc: "ROBOCARning tashqi ko'rinishi, korpus ishlanishi, originallik va estetik yondashuv, 3D-bosma korpus, LED bezatish, asl dizayn rag'batlantiriladi.",
  },
];

const TABLE_H = "calc(100dvh - 2rem)";

export function ScoringTable() {
  return (
    <div
      className="flex flex-col w-full rounded-2xl overflow-hidden shadow-2xl"
      style={{ height: TABLE_H }}
    >
      {/* ══ HEADER ══ */}
      <div
        className="shrink-0 relative flex items-center justify-between px-10 py-5 overflow-hidden"
        style={{ background: "linear-gradient(135deg,#0b1547 0%,#1a1f6e 45%,#3b1fa8 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold text-white tracking-wide">
            ILOVA — BAHOLASH MEZONI TARKIBI
          </h2>
          <p className="text-blue-200 text-base mt-1">
            Maksimal mumkin bo'lgan ball:{" "}
            <span className="text-cyan-300 font-bold text-xl">100</span>
          </p>
        </div>
        <div className="relative z-10 w-16 h-16 rounded-full border-2 border-blue-400/40 bg-blue-900/40 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-cyan-300" />
        </div>
      </div>

      {/* ══ COLUMN HEADERS ══ */}
      <div
        className="shrink-0 flex text-sm font-bold text-white"
        style={{ background: "#0f1b55" }}
      >
        <div className="w-24 text-center py-3 shrink-0">№</div>
        <div className="flex-1 py-3 px-4">Mezon</div>
        <div className="w-32 text-center py-3 shrink-0">Ball</div>
        <div className="flex-[1.6] py-3 px-5">Tushuntirish</div>
      </div>

      {/* ══ DATA ROWS ══ */}
      <div className="flex-1 min-h-0 flex flex-col bg-white">
        {criteria.map((c, idx) => (
          <div
            key={c.num}
            className="flex-1 flex items-center min-h-0"
            style={{ borderBottom: idx < 3 ? "1px solid #e5e7eb" : "none" }}
          >
            {/* № */}
            <div className="w-24 flex justify-center shrink-0">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-lg"
                style={{ background: c.numBg }}
              >
                {c.num}
              </div>
            </div>

            {/* Icon + Title */}
            <div className="flex-1 flex items-center gap-5 px-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 shadow"
                style={{ background: c.iconBg }}
              >
                <c.icon className="w-8 h-8" style={{ color: c.iconColor }} />
              </div>
              <span className="font-extrabold text-slate-800 text-xl leading-snug">
                {c.title}
              </span>
            </div>

            {/* Ball */}
            <div className="w-32 flex justify-center shrink-0">
              <div
                className="rounded-2xl px-5 py-3 text-center min-w-20 shadow"
                style={{ background: c.ballBg }}
              >
                <div className="text-5xl font-extrabold leading-none" style={{ color: c.ballColor }}>
                  {c.ball}
                </div>
                <div className="text-sm font-bold mt-1" style={{ color: c.ballColor }}>
                  ball
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="flex-[1.6] px-5">
              <p className="text-slate-600 text-base leading-relaxed">{c.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ══ FOOTER ══ */}
      <div className="shrink-0 flex">
        {/* JAMI */}
        <div
          className="flex-1 flex items-center gap-4 px-8 py-4"
          style={{ background: "linear-gradient(135deg,#312e81,#4f46e5)" }}
        >
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <span className="text-white font-extrabold text-2xl tracking-widest">JAMI</span>
        </div>

        {/* 100 ball */}
        <div
          className="w-32 flex flex-col items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg,#ea580c,#f97316)" }}
        >
          <span className="text-white font-extrabold text-4xl leading-none">100</span>
          <span className="text-white/80 text-sm font-bold mt-0.5">ball</span>
        </div>

        {/* HASHIM SCHOOL */}
        <div
          className="flex-[1.1] flex items-center gap-4 px-7 py-4"
          style={{ background: "linear-gradient(135deg,#0b1547,#1a237e)" }}
        >
          <div className="w-12 h-12 rounded-full bg-teal-400/20 border-2 border-teal-400/50 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-teal-300" />
          </div>
          <div>
            <div className="text-white font-extrabold text-xl leading-tight tracking-wide">
              HASHIM SCHOOL<span className="text-teal-300">®</span>
            </div>
            <div className="text-blue-300 text-sm font-medium tracking-widest mt-0.5">
              "YORQIN KELAJAK SARI"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
