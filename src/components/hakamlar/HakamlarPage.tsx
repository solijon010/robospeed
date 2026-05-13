import { useState } from "react";
import { UserCheck, Plus, Trash2 } from "lucide-react";
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

interface Hakam {
  id: number;
  ism: string;
  familya: string;
  lavozim: string;
}

export function HakamlarPage() {
  const [hakamlar, setHakamlar] = useState<Hakam[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [ism, setIsm] = useState("");
  const [familya, setFamilya] = useState("");
  const [lavozim, setLavozim] = useState("");

  function handleAdd() {
    if (!ism.trim() || !familya.trim() || !lavozim.trim()) return;
    setHakamlar((prev) => [
      ...prev,
      { id: Date.now(), ism: ism.trim(), familya: familya.trim(), lavozim: lavozim.trim() },
    ]);
    setIsm("");
    setFamilya("");
    setLavozim("");
    setModalOpen(false);
  }

  function handleDelete(id: number) {
    setHakamlar((prev) => prev.filter((h) => h.id !== id));
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Hakamlar</h1>
          <p className="text-muted-foreground mt-1">Musobaqa hakamlarini boshqaring.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Hakam qo'shish
        </Button>
      </div>

      {hakamlar.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground border rounded-xl">
          <UserCheck className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-sm">Hozircha hakamlar yo'q.</p>
          <p className="text-xs mt-1">Yangi hakam qo'shish uchun yuqoridagi tugmani bosing.</p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-8">#</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ism Familya</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Lavozim</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {hakamlar.map((hakam, index) => (
                <tr key={hakam.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                  <td className="px-4 py-3 font-medium">
                    {hakam.ism} {hakam.familya}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{hakam.lavozim}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(hakam.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yangi hakam qo'shish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ism">Ism</Label>
              <Input
                id="ism"
                placeholder="Masalan: Alisher"
                value={ism}
                onChange={(e) => setIsm(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="familya">Familya</Label>
              <Input
                id="familya"
                placeholder="Masalan: Karimov"
                value={familya}
                onChange={(e) => setFamilya(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lavozim">Lavozim</Label>
              <Input
                id="lavozim"
                placeholder="Masalan: Bosh hakam"
                value={lavozim}
                onChange={(e) => setLavozim(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleAdd} disabled={!ism.trim() || !familya.trim() || !lavozim.trim()}>
              Qo'shish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
