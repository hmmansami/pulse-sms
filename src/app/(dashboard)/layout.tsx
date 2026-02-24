import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const label = session?.user?.name ?? session?.user?.email ?? "Account";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header label={label} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
