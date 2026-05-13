import { createFileRoute } from "@tanstack/react-router";
import { ParticipantForm } from "@/components/register/ParticipantForm";
import { ParticipantsTable } from "@/components/register/ParticipantsTable";

export const Route = createFileRoute("/_app/register")({
  head: () => ({ meta: [{ title: "Ro'yxatga olish — ROBO SPEED" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <div className="space-y-8">
      <ParticipantForm />
      <ParticipantsTable />
    </div>
  );
}
