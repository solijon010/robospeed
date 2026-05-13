import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden rounded-2xl px-6 py-5 border border-border flex items-center justify-between gap-4"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="relative z-10 flex items-center gap-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/20 backdrop-blur text-primary-foreground text-xs font-medium shrink-0">
          <Zap className="w-3 h-3" /> Onlayn musobaqa tizimi
        </div>
        <h1 className="text-xl font-extrabold text-primary-foreground tracking-tight whitespace-nowrap">
          ROBO SPEED CHALLENGE
        </h1>
      </div>
      <div className="relative z-10 flex gap-2 shrink-0">
        <Button asChild size="sm" variant="secondary">
          <Link to="/register">Ro'yxatga olish</Link>
        </Button>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="bg-background/10 border-background/30 text-primary-foreground hover:bg-background/20"
        >
          <Link to="/rating">Reyting</Link>
        </Button>
      </div>
    </section>
  );
}
