import { useEffect, useState } from "react";
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { UserPlus, Hash, Phone, User, Users, Tag } from "lucide-react";
import { toast } from "sonner";

export function ParticipantForm() {
  const [count, setCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    age: "",
    group_name: "",
    custom_number: "",
  });

  useEffect(() => {
    const q = query(collection(db, "participants"), orderBy("created_at"));
    const unsub = onSnapshot(q, (snap) => setCount(snap.size));
    return () => unsub();
  }, []);

  const nextNum = count + 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const age = parseInt(form.age, 10);
    if (!form.full_name.trim() || !form.group_name.trim() || !age) {
      toast.error("Familiya ism, yosh va guruh majburiy to'ldirilishi kerak");
      return;
    }
    setSaving(true);
    try {
      const ref = await addDoc(collection(db, "participants"), {
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || "",
        age,
        group_name: form.group_name.trim(),
        custom_number: form.custom_number.trim() || null,
        created_at: serverTimestamp(),
      });
      await addDoc(collection(db, "evaluations"), {
        participant_id: ref.id,
        time_seconds: 0,
        red_line_hits: 0,
        technical_score: 0,
        design_score: 0,
        control_score: 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      toast.success("Ishtirokchi muvaffaqiyatli qo'shildi!");
      setForm({ full_name: "", phone: "", age: "", group_name: "", custom_number: "" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      {/* Card header — auto sequential number */}
      <div
        className="px-6 py-4 border-b border-border flex items-center gap-4"
        style={{ background: "oklch(0.20 0.03 260)" }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shrink-0 shadow-lg"
          style={{ background: "var(--gradient-hero)", color: "oklch(0.15 0.03 260)" }}
        >
          {nextNum}
        </div>
        <div>
          <p className="font-semibold">Navbatdagi ishtirokchi</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Hash className="w-3 h-3" />
            Tartib raqami avtomatik tayinlanadi va o'zgartirilmaydi
          </p>
        </div>
      </div>

      <form className="p-6 grid md:grid-cols-2 gap-5" onSubmit={handleSubmit}>

        {/* Row 1: Familiya Ism (with inline #badge) | Telefon */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            Familiya Ism
            <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-stretch border border-input rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all">
            <div
              className="flex items-center px-3 text-sm font-bold border-r border-border/50 select-none whitespace-nowrap shrink-0"
              style={{ background: "var(--gradient-hero)", color: "oklch(0.15 0.03 260)" }}
            >
              № {nextNum}
            </div>
            <input
              className="flex-1 px-3 py-2.5 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Aliyev Ali"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
            Telefon raqami
            <span className="text-muted-foreground text-xs font-normal">(ixtiyoriy)</span>
          </Label>
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+998 90 123 45 67"
          />
        </div>

        {/* Row 2: Yoshi | Guruhi */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Yoshi <span className="text-destructive">*</span>
          </Label>
          <Input
            type="number"
            min={1}
            max={100}
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
            placeholder="14"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            Guruhi <span className="text-destructive">*</span>
          </Label>
          <Input
            value={form.group_name}
            onChange={(e) => setForm({ ...form, group_name: e.target.value })}
            placeholder="ROBO-1"
          />
        </div>

        {/* Row 3: Ishtirokchi raqami (ixtiyoriy) | empty */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            Ishtirokchi raqami
            <span className="text-muted-foreground text-xs font-normal">(ixtiyoriy)</span>
          </Label>
          <Input
            value={form.custom_number}
            onChange={(e) => setForm({ ...form, custom_number: e.target.value })}
            placeholder="Musobaqa raqami..."
          />
          <p className="text-xs text-muted-foreground">
            Musobaqa bib-raqami yoki o'z tartib raqamingiz
          </p>
        </div>

        {/* empty second col on row 3 (md+) */}
        <div className="hidden md:block" />

        {/* Button row */}
        <div className="md:col-span-2">
          <Button type="submit" disabled={saving} size="lg" className="gap-2">
            <UserPlus className="w-4 h-4" />
            {saving ? "Qo'shilmoqda..." : "Ro'yxatga olish"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
