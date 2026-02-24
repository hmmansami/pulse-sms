import Link from "next/link";

import { SubscriberTable } from "@/components/subscribers/subscriber-table";
import { Button } from "@/components/ui/button";

export default function SubscribersPage() {
  return (
    <main className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Subscriber Management</h1>
          <p className="text-sm text-muted-foreground">Search, filter, and manage your full subscriber list.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/subscribers/import">Import</Link>
          </Button>
        </div>
      </div>
      <SubscriberTable />
    </main>
  );
}
