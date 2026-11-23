import StaffShell from "@/components/StaffShell";

export default function ArchitectLayout({ children }: { children: React.ReactNode }) {
  return <StaffShell label="Stage 1: Architects">{children}</StaffShell>;
}
