import { getPortfolio } from "@/lib/actions/portfolio";
import { PortfolioView } from "@/components/portfolio/PortfolioView";

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const data = await getPortfolio();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Portafolio</h1>
        <p className="text-sm text-muted">
          Equity y posiciones de tu cuenta de TradeStation (solo lectura).
        </p>
      </div>

      <PortfolioView data={data} error={error} />
    </div>
  );
}
