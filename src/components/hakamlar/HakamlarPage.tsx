import { useEffect, useState } from "react";
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, orderBy, query, serverTimestamp, updateDoc,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { UserCheck, Plus, Trash2, Shield, Pencil } from "lucide-react";
import { Switch } from "@/components/ui/switch";
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
  active?: boolean;
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

  // Add form
  const [addOpen, setAddOpen] = useState(false);
  const [addIsm, setAddIsm] = useState("");
  const [addFamilya, setAddFamilya] = useState("");
  const [addLavozim, setAddLavozim] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit form
  const [editTarget, setEditTarget] = useState<Hakam | null>(null);
  const [editIsm, setEditIsm] = useState("");
  const [editFamilya, setEditFamilya] = useState("");
  const [editLavozim, setEditLavozim] = useState("");
  const [updating, setUpdating] = useState(false);

  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "hakamlar"), orderBy("created_at"));
    return onSnapshot(q, (snap) => {
      setHakamlar(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Hakam));
    });
  }, []);

  async function handleAdd() {
    if (!addIsm.trim() || !addFamilya.trim() || !addLavozim.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "hakamlar"), {
        ism: addIsm.trim(),
        familya: addFamilya.trim(),
        lavozim: addLavozim.trim(),
        active: true,
        created_at: serverTimestamp(),
      });
      toast.success("Hakam qo'shildi");
      setAddIsm(""); setAddFamilya(""); setAddLavozim("");
      setAddOpen(false);
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(h: Hakam) {
    setEditTarget(h);
    setEditIsm(h.ism);
    setEditFamilya(h.familya);
    setEditLavozim(h.lavozim);
  }

  async function handleUpdate() {
    if (!editTarget) return;
    if (!editIsm.trim() || !editFamilya.trim() || !editLavozim.trim()) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, "hakamlar", editTarget.id), {
        ism: editIsm.trim(),
        familya: editFamilya.trim(),
        lavozim: editLavozim.trim(),
      });
      toast.success("Ma'lumotlar yangilandi");
      setEditTarget(null);
    } catch {
      toast.error("Yangilashda xatolik");
    } finally {
      setUpdating(false);
    }
  }

  async function handleToggle(id: string, currentActive: boolean) {
    try {
      await updateDoc(doc(db, "hakamlar", id), { active: !currentActive });
    } catch {
      toast.error("Yangilashda xatolik");
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
              <span className="ml-2 text-primary font-semibold">· {hakamlar.length} ta</span>
            )}
          </p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
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
          <p className="font-medium text-muted-foreground">Hozircha hakamlar mavjud emas</p>
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
                {/* Action buttons — visible on hover */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="w-7 h-7 rounded-full flex items-center justify-center bg-primary/10 hover:bg-primary/20"
                    onClick={() => openEdit(hakam)}
                  >
                    <Pencil className="w-3.5 h-3.5 text-primary" />
                  </button>
                  <button
                    className="w-7 h-7 rounded-full flex items-center justify-center bg-destructive/10 hover:bg-destructive/20"
                    onClick={() => handleDelete(hakam.id)}
                    disabled={deleting === hakam.id}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>

                {/* Index badge */}
                <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-secondary/60 flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {index + 1}
                </div>

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

                {/* Active toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {hakam.active !== false ? (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Aktiv
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">O'chirilgan</span>
                    )}
                  </span>
                  <Switch
                    checked={hakam.active !== false}
                    onCheckedChange={() => handleToggle(hakam.id, hakam.active !== false)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={(open) => {
        setAddOpen(open);
        if (!open) { setAddIsm(""); setAddFamilya(""); setAddLavozim(""); }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yangi hakam qo'shish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Familya</Label>
                <Input placeholder="Karimov" value={addFamilya}
                  onChange={(e) => setAddFamilya(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
              </div>
              <div className="space-y-1.5">
                <Label>Ism</Label>
                <Input placeholder="Alisher" value={addIsm}
                  onChange={(e) => setAddIsm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Lavozim</Label>
              <Input placeholder="Bosh hakam" value={addLavozim}
                onChange={(e) => setAddLavozim(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleAdd}
              disabled={saving || !addIsm.trim() || !addFamilya.trim() || !addLavozim.trim()}>
              {saving ? "Saqlanmoqda..." : "Qo'shish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hakamni tahrirlash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Familya</Label>
                <Input placeholder="Karimov" value={editFamilya}
                  onChange={(e) => setEditFamilya(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUpdate()} />
              </div>
              <div className="space-y-1.5">
                <Label>Ism</Label>
                <Input placeholder="Alisher" value={editIsm}
                  onChange={(e) => setEditIsm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUpdate()} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Lavozim</Label>
              <Input placeholder="Bosh hakam" value={editLavozim}
                onChange={(e) => setEditLavozim(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUpdate()} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Bekor qilish</Button>
            <Button onClick={handleUpdate}
              disabled={updating || !editIsm.trim() || !editFamilya.trim() || !editLavozim.trim()}>
              {updating ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
