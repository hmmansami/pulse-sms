import Link from "next/link";
import { db } from "@/lib/db";

async function getUnits() {
  const workspace = await db.workspace.findFirst({ select: { id: true, name: true } });
  if (!workspace) return { workspaceId: "", workspaceName: "No workspace", units: [] };

  const units = await db.signupUnit.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
      views: true,
      submissions: true,
      updatedAt: true,
    },
  });

  return { workspaceId: workspace.id, workspaceName: workspace.name, units };
}

export default async function SignupUnitsPage() {
  const { workspaceId, workspaceName, units } = await getUnits();

  return (
    <main className="space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sign-up units</h1>
          <p className="text-sm text-gray-500">Workspace: {workspaceName}</p>
        </div>
        <Link
          className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600"
          href="/signup-units/new"
        >
          New unit
        </Link>
      </header>

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Views</th>
              <th className="px-4 py-3">Submissions</th>
              <th className="px-4 py-3">Conversion</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => {
              const conversion = unit.views > 0 ? (unit.submissions / unit.views) * 100 : 0;
              return (
                <tr className="border-t" key={unit.id}>
                  <td className="px-4 py-3 font-medium">{unit.name}</td>
                  <td className="px-4 py-3 capitalize">{unit.type}</td>
                  <td className="px-4 py-3 capitalize">{unit.status}</td>
                  <td className="px-4 py-3">{unit.views}</td>
                  <td className="px-4 py-3">{unit.submissions}</td>
                  <td className="px-4 py-3">{conversion.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(unit.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link className="text-indigo-600 hover:underline" href={`/signup-units/${unit.id}`}>
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {units.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">
            No sign-up units yet. Create your first unit for workspace {workspaceId || "-"}.
          </p>
        ) : null}
      </div>
    </main>
  );
}
