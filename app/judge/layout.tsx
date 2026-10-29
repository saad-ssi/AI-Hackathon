import StaffShell from "@/components/StaffShell";

export default function JudgeLayout({ children }: { children: React.ReactNode }) {
  return <StaffShell label="Judging">{children}</StaffShell>;
}
