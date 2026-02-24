import { formatCurrency, formatNumber } from "@/lib/utils";

type OverviewMetric = {
  label: string;
  value: number;
  format: "number" | "currency" | "percent";
  trend: number;
};

type OverviewCardsProps = {
  metrics: OverviewMetric[];
};

function formatValue(value: number, format: OverviewMetric["format"]) {
  if (format === "currency") return formatCurrency(value);
  if (format === "percent") return `${value.toFixed(2)}%`;
  return formatNumber(value);
}

export function OverviewCards({ metrics }: OverviewCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const isUp = metric.trend >= 0;
        return (
          <article className="rounded-lg border bg-white p-4" key={metric.label}>
            <p className="text-sm text-gray-500">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{formatValue(metric.value, metric.format)}</p>
            <p className={`mt-3 text-sm ${isUp ? "text-green-600" : "text-red-600"}`}>
              {isUp ? "▲" : "▼"} {Math.abs(metric.trend).toFixed(1)}%
            </p>
          </article>
        );
      })}
    </div>
  );
}
