import { useEffect, useState } from "react";
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { UserCheck, Plus, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Hakam {
  id: string;
  ism: string;
  familya: string;
  lavozim: string;
}

const AVATAR_COLORS = [
  "from-cyan-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-violet-500 to-purple-600",
  "from-orange-500 to-amber-600",
  "from-pink-500 to-rose-600",
  "from-indigo-500 to-blue-600",
];

export function HakamlarPage() {
  const [hakamlar, setHakamlar] = useState<Hakam[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [ism, setIsm] = useState("");
  const [familya, setFamilya] = useState("");
  const [lavozim, setLavozim] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "hakamlar"), orderBy("created_at"));
    return onSnapshot(q, (snap) => {
      setHakamlar(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Hakam));
    });
  }, []);

  const resetForm = () => { setIsm(""); setFamilya(""); setLavozim(""); };

  async function handleAdd() {
    if (!ism.trim() || !familya.trim() || !lavozim.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "hakamlar"), {
        ism: ism.trim(),
        familya: familya.trim(),
        lavozim: lavozim.trim(),
        created_at: serverTimestamp(),
      });
      toast.success("Hakam qo'shildi");
      resetForm();
      setModalOpen(false);
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await deleteDoc(doc(db, "hakamlar", id));
      toast.success("Hakam o'chirildi");
    } catch {
      toast.error("O'chirishda xatolik");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hakamlar</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Musobaqa hakamlarini boshqaring
            {hakamlar.length > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-primary font-semibold">
                · {hakamlar.length} ta
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="gap-2 rounded-full px-5"
          style={{ background: "var(--gradient-hero)" }}
        >
          <Plus className="w-4 h-4" />
          Hakam qo'shish
        </Button>
      </div>

      {/* Empty state */}
      {hakamlar.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 border border-dashed border-border rounded-2xl bg-secondary/5">
          <div className="w-16 h-16 rounded-full bg-secondary/40 flex items-center justify-center">
            <UserCheck className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <div className="text-center">
            <p className="font-medium text-muted-foreground">Hozircha hakamlar yo'q</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Yangi hakam qo'shish uchun yuqoridagi tugmani bosing</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setModalOpen(true)} className="gap-2 mt-2">
            <Plus className="w-3.5 h-3.5" /> Hakam qo'shish
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {hakamlar.map((hakam, index) => {
            const gradient = AVATAR_COLORS[index % AVATAR_COLORS.length];
            const initials = `${hakam.familya.charAt(0)}${hakam.ism.charAt(0)}`.toUpperCase();
            return (
              <div
                key={hakam.id}
                className="group relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
              >
                {/* Delete button */}
                <button
                  className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/10 hover:bg-destructive/20"
                  onClick={() => handleDelete(hakam.id)}
                  disabled={deleting === hakam.id}
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>

                {/* Avatar */}
                <div className={`w-14 h-14 rounded-2xl bg-linear-to-br ${gradient} flex items-center justify-center text-white text-xl font-black shadow-lg`}>
                  {initials}
                </div>

                {/* Info */}
                <div className="space-y-1 min-w-0">
                  <p className="font-bold text-base leading-tight truncate">
                    {hakam.familya} {hakam.ism}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-primary shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">{hakam.lavozim}</span>
                  </div>
                </div>

                {/* Index badge */}
                <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-secondary/60 flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {index + 1}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={modalOpen} onOpenChange={(open) => { setModalOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yangi hakam qo'shish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="familya">Familya</Label>
                <Input
                  id="familya"
                  placeholder="Karimov"
                  value={familya}
                  onChange={(e) => setFamilya(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ism">Ism</Label>
                <Input
                  id="ism"
                  placeholder="Alisher"
                  value={ism}
                  onChange={(e) => setIsm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lavozim">Lavozim</Label>
              <Input
                id="lavozim"
                placeholder="Bosh hakam"
                value={lavozim}
                onChange={(e) => setLavozim(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>
              Bekor qilish
            </Button>
            <Button
              onClick={handleAdd}
              disabled={saving || !ism.trim() || !familya.trim() || !lavozim.trim()}
            >
              {saving ? "Saqlanmoqda..." : "Qo'shish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
