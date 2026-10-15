import { CRITERIA } from "@/lib/config";

// The evaluation criteria, listed without weights (all count equally)
export default function Rubric() {
  return (
    <ol className="criteria">
      {CRITERIA.map((c) => <li key={c.key}>{c.label}</li>)}
    </ol>
  );
}
