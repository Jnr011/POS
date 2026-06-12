import { useState } from 'react';
import { Plus, Pencil, Check, X, Tag } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner';
import { CategoryRepository } from '../../db/repository';

interface CategoryManagerProps {
  categories: string[];
  onCategoriesChange: (categories: string[]) => void;
}

function CategoryManager({ categories, onCategoriesChange }: CategoryManagerProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      onCategoriesChange(await CategoryRepository.add(name));
      setNewName('');
      setShowDialog(false);
      toast.success('Category added');
    } catch (err: any) {
      toast.error(err.message || 'Error adding category');
    }
  };

  const handleRename = async (oldName: string) => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === oldName) { setEditIdx(null); return; }
    try {
      onCategoriesChange(await CategoryRepository.rename(oldName, trimmed));
      setEditIdx(null);
      toast.success('Category renamed');
    } catch (err: any) {
      toast.error(err.message || 'Error renaming category');
    }
  };

  const handleDelete = async (name: string) => {
    try {
      onCategoriesChange(await CategoryRepository.remove(name));
      toast.success('Category removed');
    } catch (err: any) {
      toast.error(err.message || 'Error deleting category');
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium text-foreground">
            <span className="flex items-center gap-2">
              <Tag className="size-4 text-muted-foreground" /> Categories
            </span>
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => setShowDialog(true)}>
              <Plus className="size-3" /> Add
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No categories yet. Add a product with a category name to create one automatically.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat, idx) => (
                <div key={cat}
                  className="group flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm">
                  {editIdx === idx ? (
                    <>
                      <Input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="h-6 w-28 text-xs"
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleRename(cat);
                          if (e.key === 'Escape') setEditIdx(null);
                        }}
                      />
                      <button className="rounded p-0.5 hover:text-foreground text-muted-foreground transition-colors"
                        onClick={() => handleRename(cat)}>
                        <Check className="size-3" />
                      </button>
                      <button className="rounded p-0.5 hover:text-foreground text-muted-foreground transition-colors"
                        onClick={() => setEditIdx(null)}>
                        <X className="size-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-foreground">{cat}</span>
                      <button
                        className="ml-1 rounded p-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all"
                        onClick={() => { setEditIdx(idx); setEditName(cat); }}>
                        <Pencil className="size-3" />
                      </button>
                      <button
                        className="rounded p-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                        onClick={() => handleDelete(cat)}>
                        <X className="size-3" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add category</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <Input
              placeholder="Category name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { handleAdd(); } }}
              autoFocus
            />
            <Button onClick={handleAdd}>Add</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { CategoryManager };
export type { CategoryManagerProps };
