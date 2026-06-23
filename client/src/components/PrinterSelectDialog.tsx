import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import type { PrinterInfo } from '../services/tauriPrinter';

export function PrinterSelectDialog({ candidates, onSelect, onClose }: {
  candidates: PrinterInfo[];
  onSelect: (name: string) => void;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Which printer is your receipt printer?</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {candidates.map(c => (
            <button
              key={c.name}
              onClick={() => onSelect(c.name)}
              className="w-full flex items-center justify-between rounded-md border p-3 text-left hover:bg-muted/50"
            >
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.identifier}</p>
              </div>
              {c.likelyVirtual && <Badge variant="secondary">Virtual / not a receipt printer</Badge>}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
