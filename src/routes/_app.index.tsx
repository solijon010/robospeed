import { createFileRoute } from "@tanstack/react-router";
import { SpinWheel } from "@/components/wheel/SpinWheel";

export const Route = createFileRoute("/_app/")({
  head: () => ({ meta: [{ title: "ROBO SPEED CHALLENGE" }] }),
  component: () => <SpinWheel />,
});
