import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function RuleCard({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc: string }) {
  return (
    <Card className="p-6">
      <Icon className="w-5 h-5 text-accent mb-3" />
      <h4 className="font-semibold mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </Card>
  );
}
