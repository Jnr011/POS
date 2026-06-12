import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { FormField } from './FormField';
import type { Product } from '../../types';

interface ProductFormData {
  name: string;
  category: string;
  price: string;
  stock_quantity: string;
  min_stock: string;
  supplier: string;
  expiry_date: string;
}

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId: number | null;
  formData: ProductFormData;
  onFormChange: (data: ProductFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
  categories: string[];
}

function ProductFormDialog({
  open, onOpenChange, editingId, formData, onFormChange, onSubmit, onReset, categories,
}: ProductFormDialogProps) {
  const field = (key: keyof ProductFormData) => ({
    value: formData[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      onFormChange({ ...formData, [key]: e.target.value }),
  });

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onReset(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingId ? 'Edit product' : 'Add product'}</DialogTitle>
          <DialogDescription>
            {editingId ? 'Update the product details below.' : 'Fill in the details to add a new product.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <FormField label="Name">
            <Input placeholder="Product name" required {...field('name')} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category">
              <Select value={formData.category} onValueChange={v => onFormChange({ ...formData, category: v })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Price (C)">
              <Input type="number" step="0.01" min="0" placeholder="0.00" required {...field('price')} />
            </FormField>
            <FormField label="Stock quantity">
              <Input type="number" min="0" placeholder="0" required {...field('stock_quantity')} />
            </FormField>
            <FormField label="Min stock">
              <Input type="number" min="0" placeholder="10" {...field('min_stock')} />
            </FormField>
            <FormField label="Supplier">
              <Input placeholder="Optional" {...field('supplier')} />
            </FormField>
            <FormField label="Expiry date">
              <Input type="date" {...field('expiry_date')} />
            </FormField>
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onReset}>Cancel</Button>
            <Button type="submit">{editingId ? 'Save changes' : 'Add product'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { ProductFormDialog };
export type { ProductFormDialogProps, ProductFormData };
