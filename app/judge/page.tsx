import JudgeStagePage from "@/components/JudgeStagePage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stage 2 judging | Agent-A-Thon 2026", robots: { index: false } };

// Stage 2: Creativity & uniqueness and Business value. Judges who only score Stage 3 are sent to /judge/stage-3.
export default function Stage2() {
  return <JudgeStagePage stage={2} />;
}
