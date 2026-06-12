import { useState } from 'react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { EmptyState } from '../ui/empty-state';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ActivityLogEntry } from '../../types/reports';
import { cn } from '../../lib/utils';

const ACTION_STYLES: Record<string, string> = {
  sale: 'bg-success/10 text-success',
  return: 'bg-destructive/10 text-destructive',
  stock_adjust: 'bg-warning/10 text-warning',
  product_add: 'bg-success/10 text-success',
  product_edit: 'bg-primary/10 text-primary',
  product_delete: 'bg-destructive/10 text-destructive',
  csv_import: 'bg-chart-2/10 text-chart-2',
  user_add: 'bg-primary/10 text-primary',
  user_deactivate: 'bg-destructive/10 text-destructive',
  login: 'bg-muted text-muted-foreground',
  logout: 'bg-muted text-muted-foreground',
};

const ACTION_OPTIONS = [
  { value: 'all', label: 'All Actions' },
  { value: 'sale', label: 'Sales' },
  { value: 'return', label: 'Returns' },
  { value: 'stock_adjust', label: 'Stock Adjustments' },
  { value: 'product_add', label: 'Product Added' },
  { value: 'product_edit', label: 'Product Edited' },
  { value: 'product_delete', label: 'Product Deleted' },
  { value: 'csv_import', label: 'CSV Import' },
  { value: 'login', label: 'Logins' },
  { value: 'logout', label: 'Logouts' },
];

interface ActivityLogProps {
  data: ActivityLogEntry[];
  className?: string;
}

function ActivityLog({ data, className }: ActivityLogProps) {
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const filtered = actionFilter === 'all'
    ? data
    : data.filter(d => d.action === actionFilter);

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatAction = (action: string): string =>
    action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const parseDetails = (details: string): Record<string, unknown> | null => {
    try {
      const parsed = JSON.parse(details);
      return typeof parsed === 'object' && parsed !== null ? parsed : null;
    } catch {
      return null;
    }
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold">Activity Log</CardTitle>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value} className="text-sm">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10"></TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState compact title="No activity found" />
                </TableCell>
              </TableRow>
            ) : (
              filtered.slice(0, 50).map(entry => {
                const entryId = entry.id ?? 0;
                const isExpanded = expandedIds.has(entryId);
                const parsedDetails = parseDetails(entry.details);
                const hasDetails = parsedDetails !== null;

                return (
                  <TableRow key={entryId}>
                    <TableCell>
                      {hasDetails && (
                        <button
                          onClick={() => toggleExpand(entryId)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {isExpanded ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {format(entry.timestamp, 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-sm">{entry.userName}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn('text-xs font-medium border-0', ACTION_STYLES[entry.action])}
                      >
                        {formatAction(entry.action)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {entry.details || '—'}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export { ActivityLog };
