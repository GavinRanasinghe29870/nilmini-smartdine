import Sidebar from "../src/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#0f1012]">
      <Sidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
