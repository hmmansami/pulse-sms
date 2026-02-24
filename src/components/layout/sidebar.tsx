import Link from "next/link";
import { MessageSquare } from "lucide-react";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Separator } from "@/components/ui/separator";

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-64 flex-col border-r border-gray-800 bg-gray-900 text-white md:flex">
      <div className="flex h-16 items-center px-6">
        <Link href="/analytics" className="flex items-center gap-2 text-lg font-semibold">
          <MessageSquare className="h-5 w-5 text-indigo-400" />
          <span>Pulse SMS</span>
        </Link>
      </div>
      <Separator className="bg-gray-800" />
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarNav />
      </div>
    </aside>
  );
}
