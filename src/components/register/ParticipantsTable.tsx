import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export function ParticipantsTable() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: list = [] } = useQuery({
    queryKey: ["participants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participants")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("participants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("O'chirildi");
      qc.invalidateQueries({ queryKey: ["participants"] });
      qc.invalidateQueries({ queryKey: ["rating"] });
    },
  });

  return (
    <Card className="overflow-hidden">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold">Ro'yxatdan o'tganlar ({list.length})</h2>
        <Button variant="outline" size="sm" onClick={() => navigate({ to: "/evaluate" })}>
          Baholashga o'tish
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-muted-foreground">
            <tr>
              <th className="text-left p-3 w-10">№</th>
              <th className="text-left p-3">Ism Familiya</th>
              <th className="text-left p-3">Telefon</th>
              <th className="text-left p-3">Yosh</th>
              <th className="text-left p-3">Guruh</th>
              <th className="p-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Hozircha ishtirokchilar yo'q</td></tr>
            )}
            {list.map((p, i) => (
              <tr key={p.id} className="border-t border-border hover:bg-secondary/30">
                <td className="p-3 text-muted-foreground">{i + 1}</td>
                <td className="p-3 font-medium">{p.full_name}</td>
                <td className="p-3">{p.phone}</td>
                <td className="p-3">{p.age}</td>
                <td className="p-3">{p.group_name}</td>
                <td className="p-3">
                  <Button size="icon" variant="ghost" onClick={() => delMut.mutate(p.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
