import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Analytics</h2>
        <p className="text-sm text-gray-500">Overview metrics will be implemented in Task 6.</p>
      </div>
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Ready for data</CardTitle>
          <CardDescription>Your dashboard shell and auth layer are configured.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">Connect campaigns and events to populate this page.</p>
        </CardContent>
      </Card>
    </div>
  );
}
