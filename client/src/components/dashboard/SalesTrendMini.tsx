import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '../ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { BarChart3 } from 'lucide-react';
import type { SalesTrendPoint } from '../../types/reports';
import { formatCurrency } from '../../lib/currency';

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

interface SalesTrendMiniProps {
  data: SalesTrendPoint[];
  className?: string;
}

function SalesTrendMini({ data, className }: SalesTrendMiniProps) {
  const hasData = data.some(d => d.revenue > 0);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Sales Trend (7 days)</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState
            compact
            icon={<BarChart3 className="size-4 text-muted-foreground/50" />}
            title="No sales this week"
            description="Data will appear once sales are recorded"
          />
        ) : (
          <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <BarChart accessibilityLayer data={data}>
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={8}
                axisLine={false}
                className="text-xs fill-muted-foreground"
              />
              <YAxis
                tickLine={false}
                tickMargin={8}
                axisLine={false}
                tickFormatter={(value: number) => formatCurrency(value)}
                className="text-xs fill-muted-foreground"
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => label}
                    formatter={(value) => (
                      <span className="font-mono font-medium tabular-nums text-xs">
                        {formatCurrency(value as number)}
                      </span>
                    )}
                  />
                }
              />
              <Bar
                dataKey="revenue"
                fill="var(--color-revenue)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

export { SalesTrendMini };
