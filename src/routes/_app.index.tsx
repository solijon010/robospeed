import { createFileRoute } from "@tanstack/react-router";
import { Trophy, Users, ClipboardCheck, Timer, Target } from "lucide-react";
import { HeroSection } from "@/components/home/HeroSection";
import { FeatureCard } from "@/components/home/FeatureCard";
import { RuleCard } from "@/components/home/RuleCard";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "ROBO SPEED CHALLENGE" },
      { name: "description", content: "Robotlar tezligi musobaqasi — ro'yxatga olish, baholash va onlayn reyting." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="space-y-12 max-w-7xl mx-auto">
      <HeroSection />
      <section className="grid md:grid-cols-3 gap-4">
        <FeatureCard icon={Users} title="Ro'yxatga olish" desc="Ishtirokchilarni tez va oson ro'yxatga oling." to="/register" />
        <FeatureCard icon={ClipboardCheck} title="Baholash" desc="Vaqt, qizil chiziq jarimalari va mezonlar bo'yicha." to="/evaluate" />
        <FeatureCard icon={Trophy} title="Reyting" desc="Onlayn jadval — avtomatik hisoblanadi." to="/rating" />
      </section>
      <section className="grid md:grid-cols-3 gap-4">
        <RuleCard icon={Timer} title="Tezlik (50 ball)" desc="Eng kam yakuniy vaqt — 50 ball. Boshqalar proporsional." />
        <RuleCard icon={Target} title="Qizil chiziq jarimasi" desc="Har bir bosish uchun +5 sekund jarima va 5 balldan ayriladi." />
        <RuleCard icon={Trophy} title="Jami 100 ball" desc="Tezlik 50 + Aniqlik 20 + Texnik 15 + Dizayn 10 + Boshqaruv 5." />
      </section>
    </div>
  );
}
