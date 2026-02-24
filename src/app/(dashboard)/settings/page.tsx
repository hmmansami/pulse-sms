import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { WorkspaceSettingsForm } from "./settings-form";

async function getWorkspace(userId: string, workspaceId?: string) {
  const membership = workspaceId
    ? await db.workspaceMember.findFirst({ where: { userId, workspaceId } })
    : await db.workspaceMember.findFirst({ where: { userId }, orderBy: { workspace: { createdAt: "asc" } } });

  if (!membership) return null;

  return db.workspace.findUnique({ where: { id: membership.workspaceId } });
}

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const workspace = await getWorkspace(session.user.id, session.user.workspaceId);

  if (!workspace) {
    return (
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Workspace settings</CardTitle>
          <CardDescription>No workspace found for this user.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Workspace settings</h2>
        <p className="text-sm text-gray-500">Manage API credentials and workspace configuration.</p>
      </div>
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Update your workspace defaults.</CardDescription>
        </CardHeader>
        <CardContent>
          <WorkspaceSettingsForm
            initialValues={{
              name: workspace.name,
              timezone: workspace.timezone,
              twilioSid: workspace.twilioSid,
              twilioToken: workspace.twilioToken,
              twilioPhone: workspace.twilioPhone,
              resendKey: workspace.resendKey,
              openaiKey: workspace.openaiKey,
            }}
          />
        </CardContent>
      </Card>
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Plan</CardTitle>
          <CardDescription>Current billing tier for this workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Current plan</Label>
            <p className="rounded-md border bg-gray-50 px-3 py-2 text-sm capitalize">{workspace.plan}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
