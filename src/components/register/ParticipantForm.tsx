import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

export function ParticipantForm() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ full_name: "", phone: "", age: "", group_name: "" });

  const mut = useMutation({
    mutationFn: async () => {
      const age = parseInt(form.age, 10);
      if (!form.full_name || !form.phone || !form.group_name || !age) {
        throw new Error("Barcha maydonlarni to'ldiring");
      }
      const { data, error } = await supabase
        .from("participants")
        .insert({ full_name: form.full_name, phone: form.phone, age, group_name: form.group_name })
        .select()
        .single();
      if (error) throw error;
      await supabase.from("evaluations").insert({ participant_id: data.id });
    },
    onSuccess: () => {
      toast.success("Ishtirokchi qo'shildi");
      setForm({ full_name: "", phone: "", age: "", group_name: "" });
      qc.invalidateQueries({ queryKey: ["participants"] });
      qc.invalidateQueries({ queryKey: ["rating"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="p-6">
      <form
        className="grid md:grid-cols-2 gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate();
        }}
      >
        <Field label="Ism Familiya">
          <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Aliyev Ali" />
        </Field>
        <Field label="Telefon raqami">
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+998 90 123 45 67" />
        </Field>
        <Field label="Yoshi">
          <Input type="number" min={1} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="14" />
        </Field>
        <Field label="Guruhi">
          <Input value={form.group_name} onChange={(e) => setForm({ ...form, group_name: e.target.value })} placeholder="ROBO-1" />
        </Field>
        <div className="md:col-span-2">
          <Button type="submit" disabled={mut.isPending} size="lg">
            <UserPlus className="w-4 h-4 mr-2" />
            {mut.isPending ? "Qo'shilmoqda..." : "Ro'yxatga olish"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
