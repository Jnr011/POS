const THIRTY_DAYS = 30 * 86_400_000;

interface ExpiryCellProps {
  date: string | null | undefined;
}

function ExpiryCell({ date }: ExpiryCellProps) {
  if (!date) return <span className="text-muted-foreground">&mdash;</span>;

  const ts = new Date(date).getTime();
  const now = Date.now();
  const expired = ts < now;
  const soon = !expired && ts - now <= THIRTY_DAYS;

  return (
    <span className={[
      expired ? 'text-destructive line-through' :
      soon ? 'text-amber-600 dark:text-amber-400' : '',
    ].join(' ')}>
      {new Date(date).toLocaleDateString()}
    </span>
  );
}

export { ExpiryCell, THIRTY_DAYS };
export type { ExpiryCellProps };
