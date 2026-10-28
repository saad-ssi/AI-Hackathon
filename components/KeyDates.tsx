import { formatDate, getDates, winnersText } from "@/lib/config";

export default function KeyDates() {
  const d = getDates();
  const items = [
    { label: "Registration opens", value: d.registrationOpens },
    { label: "Registration closes", value: d.registrationCloses },
    { label: "Kickoff", value: d.kickoff },
    { label: "Submissions close", value: d.submissionsClose },
    { label: "Winners announced", value: winnersText() },
  ];
  return (
    <div className="dates">
      {items.map((i) => (
        <div key={i.label}>
          <div className="label">{i.label}</div>
          <div className="value">{typeof i.value === "string" ? i.value : formatDate(i.value)}</div>
        </div>
      ))}
    </div>
  );
}
