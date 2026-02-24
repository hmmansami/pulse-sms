import { formatCurrency, formatNumber } from "@/lib/utils";

type CampaignRow = {
  id: string;
  name: string;
  sent: number;
  delivered: number;
  clicked: number;
  revenue: number;
};

type CampaignTableProps = {
  rows: CampaignRow[];
};

export function CampaignTable({ rows }: CampaignTableProps) {
  return (
    <section className="rounded-lg border bg-white p-4">
      <h3 className="mb-4 text-sm font-semibold">Campaign performance</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Sent</th>
              <th className="px-3 py-2">Delivered</th>
              <th className="px-3 py-2">Clicked</th>
              <th className="px-3 py-2">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-t" key={row.id}>
                <td className="px-3 py-2 font-medium">{row.name}</td>
                <td className="px-3 py-2">{formatNumber(row.sent)}</td>
                <td className="px-3 py-2">{formatNumber(row.delivered)}</td>
                <td className="px-3 py-2">{formatNumber(row.clicked)}</td>
                <td className="px-3 py-2">{formatCurrency(row.revenue)}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                  No campaign data for selected range.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
