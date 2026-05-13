import { createFileRoute } from "@tanstack/react-router";
import { ParticipantForm } from "@/components/register/ParticipantForm";
import { ParticipantsTable } from "@/components/register/ParticipantsTable";

export const Route = createFileRoute("/_app/register")({
  head: () => ({ meta: [{ title: "Ro'yxatga olish — ROBO SPEED" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <div className="p-4 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Ishtirokchilarni ro'yxatga olish</h1>
        <p className="text-muted-foreground mt-1">Yangi ishtirokchini qo'shing va ro'yxatni boshqaring.</p>
      </div>
      <ParticipantForm />
      <ParticipantsTable />
    </div>
  );
}
