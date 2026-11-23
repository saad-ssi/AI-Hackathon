import JudgeStagePage from "@/components/JudgeStagePage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stage 3 judging | Agent-A-Thon 2026", robots: { index: false } };

// Stage 3: Presentation & live product, which may be judged at a live demo. Judges who only score Stage 2 are sent to /judge.
export default function Stage3() {
  return <JudgeStagePage stage={3} />;
}
