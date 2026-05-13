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
import { Trash2, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

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

  const totalPages = Math.ceil(list.length / pageSize);
  const paginatedList = list.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const startIndex = currentPage * pageSize;

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0);
  };

  return (
    <Card className="overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold">Ro'yxatdan o'tganlar</h2>
          <Badge variant="secondary" className="font-mono">
            {list.length}
          </Badge>
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
            {paginatedList.length === 0 && list.length === 0 && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-muted-foreground">
                  Hozircha ishtirokchilar yo'q
                </td>
              </tr>
            )}
            {paginatedList.map((p, i) => (
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
                    {startIndex + i + 1}
                  </span>
                </td>
                <td className="p-3 font-medium">{p.full_name}</td>
                <td className="p-3 text-muted-foreground font-mono text-xs">
                  {p.custom_number || "—"}
                </td>
                <td className="p-3 text-muted-foreground font-mono text-xs">{p.phone || "—"}</td>
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

      {/* Pagination Controls */}
      <div className="px-6 py-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-secondary/5">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Ko'rsatish:
          </span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="px-3 py-2 text-sm font-medium border border-input rounded-lg bg-background text-foreground cursor-pointer hover:bg-secondary/60 hover:border-emerald-400/30 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
          <span>
            {list.length === 0
              ? "—"
              : `${startIndex + 1}–${Math.min((currentPage + 1) * pageSize, list.length)}`}{" "}
            / {list.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs font-semibold px-4 py-2 rounded-lg bg-secondary/40 text-foreground border border-border/50">
            {currentPage + 1} / {totalPages || 1}
          </span>
          <Button
            size="icon"
            variant="outline"
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
