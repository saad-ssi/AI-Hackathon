import { RUBRIC } from "@/lib/config";

export default function Rubric() {
  const max = Math.max(...RUBRIC.map((r) => r.weight));
  return (
    <div className="rubric">
      {RUBRIC.map((r) => (
        <div className="rubric-row" key={r.criterion}>
          <span>{r.criterion}</span>
          <div className="bar" aria-hidden="true">
            <span style={{ width: `${(r.weight / max) * 100}%` }} />
          </div>
          <b>{r.weight}%</b>
        </div>
      ))}
    </div>
  );
}
