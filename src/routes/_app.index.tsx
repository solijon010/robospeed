import { createFileRoute } from "@tanstack/react-router";
import { HomeSlider } from "@/components/home/HomeSlider";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [{ title: "ROBO SPEED CHALLENGE" }],
  }),
  component: Home,
});

function Home() {
  return <HomeSlider />;
}
