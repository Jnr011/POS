import { Download } from 'lucide-react';
import { Button } from '../ui/button';
import { formatCurrency } from '../../lib/currency';
import { format } from 'date-fns';

interface ExportColumn<T> {
  key: keyof T | string;
  header: string;
  format?: (value: unknown, row: T) => string;
}

interface ExportButtonProps<T extends Record<string, unknown>> {
  data: T[];
  columns: ExportColumn<T>[];
  filename: string;
  className?: string;
}

function ExportButton<T extends Record<string, unknown>>({
  data,
  columns,
  filename,
  className,
}: ExportButtonProps<T>) {
  const handleExport = () => {
    const headers = columns.map(c => c.header);

    const rows = data.map(row =>
      columns.map(col => {
        const value = (row as Record<string, unknown>)[col.key as string];
        if (col.format) return col.format(value, row);
        if (typeof value === 'number') return String(value);
        return String(value ?? '');
      }),
    );

    const csv = [headers, ...rows]
      .map(row =>
        row
          .map(cell => {
            const escaped = String(cell).replace(/"/g, '""');
            return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')
              ? `"${escaped}"`
              : escaped;
          })
          .join(','),
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      className={className}
      disabled={data.length === 0}
    >
      <Download className="size-3.5 mr-1.5" />
      Export CSV
    </Button>
  );
}

export { ExportButton };
export type { ExportColumn };
