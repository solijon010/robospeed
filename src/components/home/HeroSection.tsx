import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden rounded-3xl p-10 md:p-16 border border-border"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="relative z-10 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/20 backdrop-blur text-primary-foreground text-xs font-medium mb-6">
          <Zap className="w-3 h-3" /> Onlayn musobaqa tizimi
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-4">
          ROBO SPEED<br />CHALLENGE
        </h1>
        <p className="text-primary-foreground/80 text-lg mb-8">
          Robocarlarning tezligi va aniqligi bo'yicha musobaqa. Ishtirokchilarni ro'yxatga oling,
          baholang va reytingni real vaqtda kuzating.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" variant="secondary">
            <Link to="/register">Ishtirokchini ro'yxatga olish</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="bg-background/10 border-background/30 text-primary-foreground hover:bg-background/20"
          >
            <Link to="/rating">Reytingni ko'rish</Link>
          </Button>
        </div>
      </div>
      <div
        className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, oklch(0.95 0.15 90), transparent)" }}
      />
    </section>
  );
}
