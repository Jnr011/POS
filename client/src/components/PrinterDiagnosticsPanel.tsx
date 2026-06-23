import { useEffect } from 'react';
import { usePrinter } from '../hooks/usePrinter';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { RefreshCw, Printer, AlertTriangle } from 'lucide-react';

export function PrinterDiagnosticsPanel() {
  const { diagnostics, diagnosticsLoading, refreshDiagnostics } = usePrinter();

  useEffect(() => {
    refreshDiagnostics();
  }, [refreshDiagnostics]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Printer Diagnostics
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => refreshDiagnostics()} disabled={diagnosticsLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${diagnosticsLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!diagnostics ? (
          <p className="text-muted-foreground">Checking for printers…</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>Runtime: {diagnostics.isTauriRuntime ? 'Desktop (Tauri)' : 'Browser (WebUSB)'}</span>
              <span>•</span>
              <span>Checked: {new Date(diagnostics.checkedAt).toLocaleTimeString()}</span>
            </div>

            {diagnostics.error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{diagnostics.error}</span>
              </div>
            )}

            {diagnostics.printers.length === 0 ? (
              <div className="rounded-md border border-warning/30 bg-warning/10 p-3">
                <p className="font-medium">No printers detected by Windows.</p>
                <p className="mt-1 text-muted-foreground">
                  The printer may be connected but not installed as a Windows printer.
                  Open <strong>Settings → Printers &amp; scanners</strong> and confirm it's
                  listed there with a driver attached. If it's missing, add it manually
                  using the Generic / Text Only driver.
                </p>
              </div>
            ) : (
              <ul className="space-y-2 max-h-[400px] overflow-y-auto">
                {diagnostics.printers.map((p) => (
                  <li key={p.identifier} className="flex items-center justify-between rounded-md border p-2">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.interface_type} · {p.identifier}</p>
                    </div>
                    <Badge variant={p.status === 'ready' || p.status === 'open' ? 'default' : 'secondary'}>
                      {p.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}