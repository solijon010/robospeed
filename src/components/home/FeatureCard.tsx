import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Props {
  icon: LucideIcon;
  title: string;
  desc: string;
  to: "/" | "/register" | "/evaluate" | "/rating";
}

export function FeatureCard({ icon: Icon, title, desc, to }: Props) {
  return (
    <Link to={to}>
      <Card className="p-6 h-full hover:border-primary transition-colors cursor-pointer group">
        <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-semibold text-lg mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </Card>
    </Link>
  );
}
