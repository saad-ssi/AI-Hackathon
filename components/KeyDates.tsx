import { formatDate, getDates } from "@/lib/config";

export default function KeyDates() {
  const d = getDates();
  const items = [
    { label: "Registration closes", value: d.registrationCloses },
    { label: "Kickoff", value: d.kickoff },
    { label: "Submissions close", value: d.submissionsClose },
    { label: "Winners announced", value: d.winnersAnnounced },
  ];
  return (
    <div className="dates">
      {items.map((i) => (
        <div key={i.label}>
          <div className="label">{i.label}</div>
          <div className="value">{formatDate(i.value)}</div>
        </div>
      ))}
    </div>
  );
}
