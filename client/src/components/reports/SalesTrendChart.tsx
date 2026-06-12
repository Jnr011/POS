import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '../ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { BarChart3 } from 'lucide-react';
import type { SalesTrendPoint } from '../../types/reports';
import { formatCurrency } from '../../lib/currency';

const chartConfig = {
  revenue: {
    label: 'Total Revenue',
    color: 'var(--chart-1)',
  },
  avgOrderValue: {
    label: 'Avg Order Value',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

interface SalesTrendChartProps {
  data: SalesTrendPoint[];
  title?: string;
  className?: string;
}

function SalesTrendChart({ data, title = 'Sales Trend', className }: SalesTrendChartProps) {
  const hasData = data.some(d => d.revenue > 0 || d.avgOrderValue > 0);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {hasData && (
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-sm" style={{ backgroundColor: 'var(--chart-1)' }} />
                <span className="text-muted-foreground">Total Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-sm" style={{ backgroundColor: 'var(--chart-2)' }} />
                <span className="text-muted-foreground">Avg Order Value</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState
            icon={<BarChart3 className="size-5 text-muted-foreground/50" />}
            title="No sales data"
            description="Data will appear here once sales are recorded"
          />
        ) : !hasData ? (
          <EmptyState
            icon={<BarChart3 className="size-5 text-muted-foreground/50" />}
            title="No sales in this period"
            description="Try selecting a different date range"
          />
        ) : (
          <ChartContainer config={chartConfig} className="min-h-[280px] w-full">
            <BarChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                className="text-xs fill-muted-foreground"
              />
              <YAxis
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value: number) => formatCurrency(value)}
                className="text-xs fill-muted-foreground"
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => label}
                    formatter={(value, name) => (
                      <div className="flex items-center gap-2">
                        <div
                          className="size-2 rounded-sm shrink-0"
                          style={{ backgroundColor: name === 'revenue' ? 'var(--chart-1)' : 'var(--chart-2)' }}
                        />
                        <span className="text-muted-foreground text-xs">
                          {name === 'revenue' ? 'Total Revenue' : 'Avg Order Value'}:
                        </span>
                        <span className="font-mono font-medium tabular-nums text-xs">
                          {formatCurrency(value as number)}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar
                dataKey="revenue"
                name="revenue"
                fill="var(--color-revenue)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="avgOrderValue"
                name="avgOrderValue"
                fill="var(--color-avgOrderValue)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

export { SalesTrendChart };
