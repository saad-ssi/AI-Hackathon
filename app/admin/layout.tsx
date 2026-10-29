import StaffShell from "@/components/StaffShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <StaffShell label="Admin">{children}</StaffShell>;
}
