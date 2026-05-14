import { useEffect, useRef, useState } from "react";
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, Hash, Phone, User, Users, Tag, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const initialFormState = {
  full_name: "",
  phone: "",
  date_of_birth: "",
  group_name: "",
  custom_number: "",
};

const formatUzbekPhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  let normalized = digits;

  if (normalized.startsWith("998")) {
    normalized = normalized.slice(3);
  } else if (normalized.startsWith("0")) {
    normalized = normalized.slice(1);
  }

  normalized = normalized.slice(0, 9);

  const groups: string[] = [];
  if (normalized.length >= 2) {
    groups.push(normalized.slice(0, 2));
  } else if (normalized.length > 0) {
    groups.push(normalized);
  }
  if (normalized.length >= 5) {
    groups.push(normalized.slice(2, 5));
  } else if (normalized.length > 2) {
    groups.push(normalized.slice(2));
  }
  if (normalized.length >= 7) {
    groups.push(normalized.slice(5, 7));
  } else if (normalized.length > 5) {
    groups.push(normalized.slice(5));
  }
  if (normalized.length > 7) {
    groups.push(normalized.slice(7));
  }

  return groups.length ? `+998 ${groups.join(" ")}` : "";
};

const formatFullName = (value: string) => {
  const lettersOnly = value.replace(/[^a-zA-Zа-яА-ЯёЁ\s]/g, "");
  const capitalized = lettersOnly
    .split(" ")
    .map((word) => {
      if (word.length === 0) return "";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
  return capitalized;
};

export function ParticipantForm() {
  const [count, setCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialFormState);
  const [formOpen, setFormOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const successTimer = useRef<number | null>(null);

  useEffect(() => {
    const q = query(collection(db, "participants"), orderBy("created_at"));
    const unsub = onSnapshot(q, (snap) => setCount(snap.size));
    return () => unsub();
  }, []);

  useEffect(() => {
    return () => {
      if (successTimer.current) {
        window.clearTimeout(successTimer.current);
      }
    };
  }, []);

  const nextNum = count + 1;

  const resetForm = () => setForm(initialFormState);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.full_name.trim() || !form.group_name.trim() || !form.date_of_birth) {
      toast.error("Familiya ism, tug'ilgan sana va guruh majburiy to'ldirilishi kerak");
      return;
    }

    const birthDate = new Date(form.date_of_birth);
    if (Number.isNaN(birthDate.getTime())) {
      toast.error("Iltimos, tug'ilgan sanani to'g'ri kiriting");
      return;
    }

    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();
    const dayDiff = now.getDate() - birthDate.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age -= 1;
    }

    if (age <= 0 || age > 120) {
      toast.error("Iltimos, haqiqiy tug'ilgan sanani kiriting");
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
      resetForm();
      setFormOpen(false);
      setSuccessOpen(true);
      successTimer.current = window.setTimeout(() => {
        setSuccessOpen(false);
        setFormOpen(true);
      }, 2500);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden border border-border bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_40%),linear-gradient(135deg,rgba(22,163,74,0.12),rgba(15,23,42,0.9))] shadow-[0_30px_90px_-50px_rgba(34,197,94,0.6)]">
        <div className="px-8 py-6 md:flex md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight">Ishtirokchi qo'shish</h2>
          </div>
          <Button
            size="lg"
            className="rounded-full bg-linear-to-r from-cyan-400 to-emerald-400 text-black shadow-[0_24px_80px_-40px_rgba(16,185,129,0.8)] hover:scale-[1.01] transition-transform"
            onClick={() => setFormOpen(true)}
          >
            <UserPlus className="w-4 h-4" />
            Ishtirokchi qo'shish
          </Button>
        </div>
      </Card>

      <Dialog open={formOpen} onOpenChange={(open) => setFormOpen(open)}>
        <DialogContent className="max-w-3xl rounded-[1.25rem] border border-emerald-400/15 bg-[#071212] p-6 shadow-[0_40px_120px_-60px_rgba(34,197,94,0.7)]">
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <div className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200 shadow-sm shadow-emerald-400/10 self-center sm:self-start">
              <Hash className="w-3.5 h-3.5" />
              Avtomatik raqam
            </div>
            <DialogTitle className="text-2xl font-semibold">Yangi ishtirokchini qo'shing</DialogTitle>
            <DialogDescription className="text-sm leading-6 text-muted-foreground">
              Foydalanuvchi ma'lumotlarini to'ldiring va &quot;Saqlash&quot; tugmasini bosing. Modal yopilgandan keyin tasdiq animatsiyasi ko'rsatiladi.
            </DialogDescription>
          </div>

          <form className="mt-6 grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                Familiya Ism
                <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-stretch border border-input rounded-2xl overflow-hidden transition-shadow focus-within:shadow-[0_0_0_3px_rgba(34,197,94,0.24)]">
                <div className="flex items-center px-4 text-sm font-semibold border-r border-border/50 select-none whitespace-nowrap bg-linear-to-r from-cyan-500 to-emerald-500 text-black">
                  № {nextNum}
                </div>
                <input
                  className="flex-1 px-4 py-3 bg-transparent text-sm text-white outline-none placeholder:text-muted-foreground"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: formatFullName(e.target.value) })}
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
                onChange={(e) => setForm({ ...form, phone: formatUzbekPhone(e.target.value) })}
                placeholder="+998 91 661 27 05"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                Tug'ilgan sana <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                className="text-white"
              />
              <p className="text-xs text-muted-foreground">Yil / oy / kun ko'rinishida kiriting</p>
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

            <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" size="lg" onClick={() => setFormOpen(false)}>
                Bekor qilish
              </Button>
              <Button type="submit" size="lg" disabled={saving} className="gap-2">
                <UserPlus className="w-4 h-4" />
                {saving ? "Saqlanmoqda..." : "Qo'shish"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={successOpen} onOpenChange={(open) => setSuccessOpen(open)}>
        <DialogContent className="max-w-sm rounded-4xl border border-emerald-400/20 bg-[#081815] p-6 text-center shadow-[0_32px_120px_-56px_rgba(52,211,153,0.9)] transition-all duration-300 ease-out">
          <div className="mx-auto mt-3.75 mb-2 inline-flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-emerald-400/20 to-cyan-500/10 shadow-[0_0_0_20px_rgba(16,185,129,0.12)] checkmark-animation">
            <svg viewBox="0 0 100 100" className="h-16 w-16 text-emerald-300">
              <circle cx="50" cy="50" r="43" fill="none" stroke="rgba(52,211,153,0.24)" strokeWidth="8" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="251" strokeDashoffset="251" className="checkmark-circle" />
              <path d="M30 52 L44 66 L70 38" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="70" strokeDashoffset="70" className="checkmark-path" />
            </svg>
          </div>
          <DialogTitle className="mt-4 text-2xl font-semibold">Ishtirokchi muvaffaqiyatli qo'shildi</DialogTitle>
        </DialogContent>
      </Dialog>
    </>
  );
}
