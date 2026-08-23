import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

interface SummaryCardsProps {
  totalDebit: number;
  totalCredit: number;
  currency: string;
  payeeCount: number;
  transactionCount: number;
}

export function SummaryCards({
  totalDebit,
  totalCredit,
  currency,
  payeeCount,
  transactionCount,
}: SummaryCardsProps) {
  const net = totalCredit - totalDebit;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardDescription>Money out</CardDescription>
          <CardTitle className="font-mono text-2xl tabular-nums text-destructive">
            {formatCurrency(totalDebit, currency)}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Money in</CardDescription>
          <CardTitle className="font-mono text-2xl tabular-nums text-emerald-700 dark:text-emerald-400">
            {formatCurrency(totalCredit, currency)}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Net</CardDescription>
          <CardTitle className="font-mono text-2xl tabular-nums">
            {formatCurrency(net, currency)}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Payees</CardDescription>
          <CardTitle className="text-2xl">
            <span className="font-mono tabular-nums">{payeeCount}</span>
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              across <span className="font-mono tabular-nums">{transactionCount}</span> txns
            </span>
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
