import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  collection,
  query,
  orderBy,
  where,
  onSnapshot,
  doc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface Participant {
  id: string;
  full_name: string;
  phone: string;
  age: number;
  group_name: string;
  custom_number?: string | null;
}

export function ParticipantsTable() {
  const navigate = useNavigate();
  const [list, setList] = useState<Participant[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "participants"), orderBy("created_at"));
    const unsub = onSnapshot(q, (snap) => {
      setList(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Participant));
    });
    return () => unsub();
  }, []);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteDoc(doc(db, "participants", id));
      // Delete linked evaluation (Firebase has no CASCADE)
      const evalSnap = await getDocs(
        query(collection(db, "evaluations"), where("participant_id", "==", id)),
      );
      for (const evalDoc of evalSnap.docs) {
        await deleteDoc(evalDoc.ref);
      }
      toast.success("Ishtirokchi o'chirildi");
    } catch {
      toast.error("O'chirishda xatolik");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold">Ro'yxatdan o'tganlar</h2>
          <Badge variant="secondary" className="font-mono">{list.length}</Badge>
        </div>
        <Button size="sm" onClick={() => navigate({ to: "/evaluate" })}>
          Baholashga o'tish
          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-muted-foreground text-xs uppercase tracking-wider">
            <tr>
              <th className="text-center p-3 w-14">№</th>
              <th className="text-left p-3">Familiya Ism</th>
              <th className="text-left p-3">Raqam</th>
              <th className="text-left p-3">Telefon</th>
              <th className="text-left p-3">Yosh</th>
              <th className="text-left p-3">Guruh</th>
              <th className="p-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-muted-foreground">
                  Hozircha ishtirokchilar yo'q
                </td>
              </tr>
            )}
            {list.map((p, i) => (
              <tr
                key={p.id}
                className={`border-t border-border hover:bg-secondary/30 transition-colors ${
                  i % 2 !== 0 ? "bg-secondary/10" : ""
                }`}
              >
                <td className="p-3 text-center">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center mx-auto text-xs font-bold"
                    style={{
                      background: "oklch(0.78 0.18 220 / 0.15)",
                      color: "var(--color-primary)",
                    }}
                  >
                    {i + 1}
                  </span>
                </td>
                <td className="p-3 font-medium">{p.full_name}</td>
                <td className="p-3 text-muted-foreground font-mono text-xs">
                  {p.custom_number || "—"}
                </td>
                <td className="p-3 text-muted-foreground font-mono text-xs">
                  {p.phone || "—"}
                </td>
                <td className="p-3">{p.age}</td>
                <td className="p-3">
                  <Badge variant="outline" className="text-xs font-medium">
                    {p.group_name}
                  </Badge>
                </td>
                <td className="p-3">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8 hover:bg-destructive/10"
                    onClick={() => handleDelete(p.id)}
                    disabled={deleting === p.id}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
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
