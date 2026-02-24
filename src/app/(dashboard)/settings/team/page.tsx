export const dynamic = 'force-dynamic';

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

async function getTeamMembers(userId: string, workspaceId?: string) {
  const membership = workspaceId
    ? await db.workspaceMember.findFirst({ where: { userId, workspaceId } })
    : await db.workspaceMember.findFirst({ where: { userId }, orderBy: { workspace: { createdAt: "asc" } } });

  if (!membership) return [];

  return db.workspaceMember.findMany({
    where: { workspaceId: membership.workspaceId },
    include: { user: true },
    orderBy: { user: { createdAt: "asc" } },
  });
}

export default async function TeamPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const members = await getTeamMembers(session.user.id, session.user.workspaceId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Team management</h2>
        <p className="text-sm text-gray-500">Review workspace members and roles.</p>
      </div>
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>{members.length} users in this workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.user.name ?? "-"}</TableCell>
                  <TableCell>{member.user.email}</TableCell>
                  <TableCell>
                    <Badge variant={member.role === "owner" ? "default" : "secondary"}>{member.role}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
