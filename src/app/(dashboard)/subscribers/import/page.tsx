import Link from "next/link";

import { ImportModal } from "@/components/subscribers/import-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SubscriberImportPage() {
  return (
    <main className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">CSV Import</h1>
          <p className="text-sm text-muted-foreground">Upload subscribers in bulk with field mapping and validation.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/subscribers">Back to Subscribers</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Import Subscribers</CardTitle>
          <CardDescription>Paste CSV data and map fields before importing.</CardDescription>
        </CardHeader>
        <CardContent>
          <ImportModal />
        </CardContent>
      </Card>
    </main>
  );
}
