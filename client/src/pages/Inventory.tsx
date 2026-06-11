import React, { useState } from 'react';
import API from '../services/api';
import { useToast } from '../components/Toast';
import { useProducts } from '../hooks/useProducts';
import { Product } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';

interface CsvProduct {
  name: string;
  category: string;
  price: number;
  stock_quantity: number;
  expiry_date: string | null;
}

function Inventory() {
  const { addToast } = useToast();
  const { products, loading, addProduct, updateProduct, deleteProduct, refetch } = useProducts();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stock_quantity: '',
    expiry_date: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState('');
  const [csvSuccess, setCsvSuccess] = useState('');
  const [csvPreview, setCsvPreview] = useState<CsvProduct[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const productData: Omit<Product, 'id'> = {
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      stock_quantity: parseInt(formData.stock_quantity, 10),
      expiry_date: formData.expiry_date || null
    };
    try {
      if (editingId) {
        await updateProduct(editingId, productData);
        setEditingId(null);
      } else {
        await addProduct(productData);
      }
      setFormData({ name: '', category: '', price: '', stock_quantity: '', expiry_date: '' });
    } catch (error: any) {
      console.error('Error saving product:', error);
      addToast('Error saving product', 'error');
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      category: product.category,
      price: String(product.price),
      stock_quantity: String(product.stock_quantity),
      expiry_date: product.expiry_date || ''
    });
    setEditingId(product.id);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
      } catch (error: any) {
        console.error('Error deleting product:', error);
        addToast('Error deleting product', 'error');
      }
    }
  };

  const parseCSV = (text: string): CsvProduct[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV file must have a header row and at least one data row');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredFields = ['name', 'category', 'price', 'stock_quantity'];
    const missingFields = requiredFields.filter(field => !headers.includes(field));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const data: CsvProduct[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;
      
      const values = lines[i].split(',').map(v => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx];
      });

      if (!row.name || !row.category || !row.price || !row.stock_quantity) {
        throw new Error(`Row ${i + 1} is missing required fields`);
      }

      if (isNaN(parseFloat(row.price)) || parseFloat(row.price) < 0) {
        throw new Error(`Row ${i + 1}: Price must be a valid positive number`);
      }

      if (isNaN(parseInt(row.stock_quantity)) || parseInt(row.stock_quantity) < 0) {
        throw new Error(`Row ${i + 1}: Stock quantity must be a valid positive integer`);
      }

      data.push({
        name: row.name,
        category: row.category,
        price: parseFloat(row.price),
        stock_quantity: parseInt(row.stock_quantity),
        expiry_date: row.expiry_date || null
      });
    }

    return data;
  };

  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setCsvError('Please select a .csv file');
      setCsvFile(null);
      return;
    }

    setCsvFile(file);
    setCsvError('');
    setCsvSuccess('');

    try {
      const text = await file.text();
      const data = parseCSV(text);
      setCsvPreview(data);
      setShowPreview(true);
    } catch (error: any) {
      setCsvError(error.message);
      setCsvPreview([]);
      setShowPreview(false);
    }
  };

  const handleCsvDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleCsvDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleCsvDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const input = document.getElementById('csv-file-input') as HTMLInputElement;
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;

      if (!file.name.endsWith('.csv')) {
        setCsvError('Please select a .csv file');
        setCsvFile(null);
        return;
      }

      setCsvFile(file);
      setCsvError('');
      setCsvSuccess('');

      try {
        const text = await file.text();
        const data = parseCSV(text);
        setCsvPreview(data);
        setShowPreview(true);
      } catch (error: any) {
        setCsvError(error.message);
        setCsvPreview([]);
        setShowPreview(false);
      }
    }
  };

  const handleCsvUpload = async () => {
    if (csvPreview.length === 0) {
      setCsvError('No valid data to upload');
      return;
    }

    try {
      setCsvLoading(true);
      setCsvError('');

      const response = await API.post('/inventory/batch-import', { products: csvPreview });

      addToast(`Successfully imported ${response.data.importedCount} products!`, 'success');
      setCsvFile(null);
      setCsvPreview([]);
      setShowPreview(false);
      (document.getElementById('csv-file-input') as HTMLInputElement).value = '';
      refetch();
    } catch (error: any) {
      setCsvError(error.response?.data?.message || 'Error importing products. Please try again.');
    } finally {
      setCsvLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Inventory Management</h1>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Product' : 'Add New Product'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input
                  type="text"
                  name="name"
                  placeholder="Product Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  type="text"
                  name="category"
                  placeholder="Category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  type="number"
                  name="price"
                  placeholder="Price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  required
                />
                <Input
                  type="number"
                  name="stock_quantity"
                  placeholder="Stock Quantity"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  type="date"
                  name="expiry_date"
                  value={formData.expiry_date}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingId ? 'Update' : 'Add'} Product</Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ name: '', category: '', price: '', stock_quantity: '', expiry_date: '' });
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Batch Import Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onDragOver={handleCsvDragOver}
              onDragLeave={handleCsvDragLeave}
              onDrop={handleCsvDrop}
              onClick={() => document.getElementById('csv-file-input')?.click()}
            >
              <div className="flex flex-col items-center gap-2">
                <p className="text-3xl">📁</p>
                <p className="text-muted-foreground">Drag and drop CSV file here or click to select</p>
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {csvError && <div className="mt-4 text-red-600">❌ {csvError}</div>}
            {csvSuccess && <div className="mt-4 text-green-600">{csvSuccess}</div>}

            {showPreview && csvPreview.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Preview ({csvPreview.length} products)</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Expiry Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvPreview.slice(0, 5).map((product, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>₵{product.price.toFixed(2)}</TableCell>
                        <TableCell>{product.stock_quantity}</TableCell>
                        <TableCell>{product.expiry_date || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {csvPreview.length > 5 && (
                  <p className="text-sm text-muted-foreground mt-2">... and {csvPreview.length - 5} more products</p>
                )}
                <Button
                  className="mt-4"
                  onClick={handleCsvUpload}
                  disabled={csvLoading}
                >
                  {csvLoading ? '⏳ Importing...' : `✅ Import ${csvPreview.length} Products`}
                </Button>
              </div>
            )}

            <div className="mt-6">
              <details>
                <summary className="cursor-pointer font-medium">📋 CSV Format Guide</summary>
                <div className="mt-2 space-y-2 text-sm">
                  <p><strong>Required columns:</strong></p>
                  <ul className="list-disc list-inside">
                    <li><code>name</code> - Product name</li>
                    <li><code>category</code> - Product category</li>
                    <li><code>price</code> - Product price (numbers only)</li>
                    <li><code>stock_quantity</code> - Quantity in stock (whole numbers only)</li>
                  </ul>
                  <p><strong>Optional columns:</strong></p>
                  <ul className="list-disc list-inside">
                    <li><code>expiry_date</code> - Expiry date (YYYY-MM-DD format)</li>
                  </ul>
                  <p><strong>Example CSV:</strong></p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">name,category,price,stock_quantity,expiry_date
Paracetamol 500mg,Pain Relief,5.99,100,2025-12-31
Aspirin 100mg,Pain Relief,3.50,50,2025-11-15
Vitamin C 1000mg,Supplements,8.99,75,
Antibiotic Cream,Topical,2.99,30,2026-06-30</pre>
                </div>
              </details>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-lg font-semibold mb-4">Products List</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(products as Product[]).map(product => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>₵{product.price}</TableCell>
                  <TableCell className={product.stock_quantity < 10 ? 'text-red-600 font-semibold' : ''}>
                    {product.stock_quantity}
                  </TableCell>
                  <TableCell>{new Date(product.expiry_date as string).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(product.id)}>Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default Inventory;
