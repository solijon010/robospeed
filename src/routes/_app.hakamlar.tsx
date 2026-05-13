import { createFileRoute } from "@tanstack/react-router";
import { HakamlarPage } from "@/components/hakamlar/HakamlarPage";

export const Route = createFileRoute("/_app/hakamlar")({
  head: () => ({ meta: [{ title: "Hakamlar — ROBO SPEED" }] }),
  component: HakamlarPage,
});
