import { useState } from 'react';
import { Upload, FileSpreadsheet, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Input } from '../ui/input';
import { FormField } from './FormField';
import { parseCSV, type CsvProduct } from '../../lib/inventory-utils';
import { formatCurrency } from '../../lib/currency';
import { ProductRepository, CategoryRepository } from '../../db/repository';

// ─── CSV Template Builder ─────────────────────────────────────────────────────

const CSV_HEADERS = ['name', 'category', 'price', 'stock_quantity', 'min_stock', 'supplier', 'expiry_date'] as const;

const CSV_HEADER_LABELS: Record<string, string> = {
  name: 'Product Name',
  category: 'Category',
  price: 'Price',
  stock_quantity: 'Stock Quantity',
  min_stock: 'Min Stock',
  supplier: 'Supplier',
  expiry_date: 'Expiry Date (YYYY-MM-DD)',
};

const CSV_HEADER_REQUIRED = new Set(['name', 'category', 'price', 'stock_quantity']);

const SEED_PRODUCTS = [
  'Paracetamol 500mg,Pain Relief,5.99,100,20,PharmaDist Co.,2026-12-31',
  'Aspirin 100mg,Pain Relief,3.50,8,20,PharmaDist Co.,2026-11-15',
  'Ibuprofen 400mg,Pain Relief,4.99,75,15,MedSupply Ltd.,2026-10-01',
  'Amoxicillin 500mg,Antibiotics,12.00,50,10,MedSupply Ltd.,2026-09-15',
  'Ciprofloxacin 500mg,Antibiotics,15.00,0,10,MedSupply Ltd.,2027-01-01',
  'Vitamin C 1000mg,Supplements,8.99,60,15,HealthVita Inc.,2027-06-30',
  'Vitamin D3 2000IU,Supplements,7.49,45,15,HealthVita Inc.,2027-05-15',
  'Omega-3 Fish Oil,Supplements,14.99,30,10,HealthVita Inc.,2026-08-20',
  'Antibiotic Cream,Topical,2.99,25,10,TopiCare Labs,2026-06-30',
  'Hydrocortisone Cream,Topical,4.50,20,10,TopiCare Labs,2026-12-01',
  'Cough Syrup DM,Cough & Cold,6.99,40,10,Relief Pharma,2026-09-01',
  'Antihistamine 10mg,Allergies,5.49,55,15,Relief Pharma,2027-03-01',
  'Bandages Assorted,First Aid,3.99,10,20,SafeCare Inc.,',
  'Digital Thermometer,Medical Devices,12.99,15,5,MedEquip Corp.,',
  'Blood Pressure Monitor,Medical Devices,45.00,7,3,MedEquip Corp.,',
];

function buildTemplateCSV(headers: readonly string[]): string {
  const headerLine = headers.join(',');
  const rows = SEED_PRODUCTS.join('\n');
  return `${headerLine}\n${rows}\n`;
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
  categories: string[];
}

function CsvImportDialog({ open, onOpenChange, onImportComplete, categories }: CsvImportDialogProps) {
  const [selectedHeaders, setSelectedHeaders] = useState<string[]>([...CSV_HEADERS]);
  const [preview, setPreview] = useState<CsvProduct[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleHeader = (h: string) => {
    setSelectedHeaders(prev =>
      prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]
    );
  };

  const handleDownloadTemplate = () => {
    const csv = buildTemplateCSV(selectedHeaders as readonly string[]);
    downloadCSV(csv, 'product-import-template.csv');
    toast.success('Template downloaded');
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      setError('Please select a .csv file.');
      return;
    }
    setError('');
    try {
      setPreview(parseCSV(await file.text()));
      setShowPreview(true);
    } catch (err: any) {
      setError(err.message);
      setShowPreview(false);
    }
  };

  const handleUpload = async () => {
    if (!preview.length) return;
    setLoading(true);
    try {
      const count = await ProductRepository.batchImport(preview);
      toast.success(`Imported ${count} products`);
      setPreview([]);
      setShowPreview(false);
      onOpenChange(false);
      onImportComplete();
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPreview([]);
    setShowPreview(false);
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-4 text-primary" /> Import products from CSV
          </DialogTitle>
          <DialogDescription>
            Download a template, fill it in, then upload to add products in bulk.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Template builder */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Template builder</p>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadTemplate}>
                <Download className="size-3.5" /> Download template
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Select which columns to include in the template:</p>
            <div className="flex flex-wrap gap-2">
              {CSV_HEADERS.map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => !CSV_HEADER_REQUIRED.has(h) && toggleHeader(h)}
                  disabled={CSV_HEADER_REQUIRED.has(h)}
                  className={[
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    selectedHeaders.includes(h)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                    CSV_HEADER_REQUIRED.has(h) && 'opacity-70 cursor-not-allowed',
                  ].join(' ')}
                >
                  {CSV_HEADER_LABELS[h] || h}
                  {CSV_HEADER_REQUIRED.has(h) && <span className="text-[10px] opacity-70">*</span>}
                </button>
              ))}
            </div>
          </div>

          {/* File upload */}
          <div
            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border py-8 transition-colors hover:border-primary/50 hover:bg-primary/[0.02]"
            onClick={() => document.getElementById('csv-file-input')?.click()}
          >
            <FileSpreadsheet className="size-7 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">Click to select a CSV file</p>
            <input id="csv-file-input" type="file" accept=".csv" onChange={handleFile} className="hidden" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Preview table */}
          {showPreview && preview.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                Preview
                <span className="ml-1 font-normal text-muted-foreground">({preview.length} rows)</span>
              </p>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Expiry</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.slice(0, 8).map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{p.name}</TableCell>
                        <TableCell className="text-sm">{p.category}</TableCell>
                        <TableCell className="text-sm tabular-nums">{formatCurrency(p.price)}</TableCell>
                        <TableCell className="text-sm tabular-nums">{p.stock_quantity}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.expiry_date || '\u2014'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {preview.length > 8 && (
                <p className="text-xs text-muted-foreground">...and {preview.length - 8} more rows</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!showPreview || loading} className="gap-1.5">
            {loading
              ? <><span className="size-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Importing...</>
              : <><Upload className="size-3.5" /> Import {preview.length || 0} products</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { CsvImportDialog };
export type { CsvImportDialogProps };
