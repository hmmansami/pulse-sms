import { formatCurrency, formatPercentage } from "@/lib/utils";

type CampaignResultsProps = {
  sent: number;
  delivered: number;
  clicked: number;
  revenue: number;
};

export function CampaignResults({ sent, delivered, clicked, revenue }: CampaignResultsProps) {
  const deliveryRate = sent > 0 ? delivered / sent : 0;
  const clickRate = sent > 0 ? clicked / sent : 0;

  const cards = [
    { label: "Sent", value: sent.toLocaleString() },
    { label: "Delivered", value: delivered.toLocaleString(), sub: formatPercentage(deliveryRate) },
    { label: "Clicked", value: clicked.toLocaleString(), sub: formatPercentage(clickRate) },
    { label: "Revenue", value: formatCurrency(revenue) },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-gray-500">{card.label}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{card.value}</p>
          {card.sub ? <p className="mt-1 text-xs text-gray-500">{card.sub}</p> : null}
        </div>
      ))}
    </div>
  );
}
