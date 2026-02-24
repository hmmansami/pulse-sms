import Link from "next/link";

import { SegmentBuilder } from "@/components/segments/segment-builder";
import { Button } from "@/components/ui/button";

export default function NewSegmentPage() {
  return (
    <main className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Create Segment</h1>
          <p className="text-sm text-muted-foreground">Define reusable audience logic for campaigns and journeys.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/segments">Back to Segments</Link>
        </Button>
      </div>
      <SegmentBuilder />
    </main>
  );
}
