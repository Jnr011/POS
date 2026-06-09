import React, { useState, useEffect } from 'react';
import API from '../services/api';
import '../styles/Inventory.css';

function Inventory() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stock_quantity: '',
    expiry_date: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [csvFile, setCsvFile] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState('');
  const [csvSuccess, setCsvSuccess] = useState('');
  const [csvPreview, setCsvPreview] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.get('/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (editingId) {
        await API.put(`/inventory/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEditingId(null);
      } else {
        await API.post('/inventory', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setFormData({ name: '', category: '', price: '', stock_quantity: '', expiry_date: '' });
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product');
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price,
      stock_quantity: product.stock_quantity,
      expiry_date: product.expiry_date
    });
    setEditingId(product.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const token = localStorage.getItem('token');
        await API.delete(`/inventory/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product');
      }
    }
  };

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV file must have a header row and at least one data row');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredFields = ['name', 'category', 'price', 'stock_quantity'];
    const missingFields = requiredFields.filter(field => !headers.includes(field));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;
      
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
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

  const handleCsvFileChange = async (e) => {
    const file = e.target.files[0];
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
    } catch (error) {
      setCsvError(error.message);
      setCsvPreview([]);
      setShowPreview(false);
    }
  };

  const handleCsvDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleCsvDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleCsvDrop = async (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const file = e.dataTransfer.files[0];
    if (file) {
      const input = document.getElementById('csv-file-input');
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
      } catch (error) {
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
      const token = localStorage.getItem('token');
      
      const response = await API.post('/inventory/batch-import', 
        { products: csvPreview },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCsvSuccess(`✅ Successfully imported ${response.data.importedCount} products!`);
      setCsvFile(null);
      setCsvPreview([]);
      setShowPreview(false);
      document.getElementById('csv-file-input').value = '';
      fetchProducts();
      
      setTimeout(() => setCsvSuccess(''), 5000);
    } catch (error) {
      setCsvError(error.response?.data?.message || 'Error importing products. Please try again.');
    } finally {
      setCsvLoading(false);
    }
  };

  if (loading) return <div className="inventory">Loading...</div>;

  return (
    <div className="inventory">
      <h1>Inventory Management</h1>
      <div className="inventory-container">
        <div className="form-section">
          <h2>{editingId ? 'Edit Product' : 'Add New Product'}</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Product Name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              name="category"
              placeholder="Category"
              value={formData.category}
              onChange={handleInputChange}
              required
            />
            <input
              type="number"
              name="price"
              placeholder="Price"
              value={formData.price}
              onChange={handleInputChange}
              step="0.01"
              required
            />
            <input
              type="number"
              name="stock_quantity"
              placeholder="Stock Quantity"
              value={formData.stock_quantity}
              onChange={handleInputChange}
              required
            />
            <input
              type="date"
              name="expiry_date"
              value={formData.expiry_date}
              onChange={handleInputChange}
              required
            />
            <button type="submit">{editingId ? 'Update' : 'Add'} Product</button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: '', category: '', price: '', stock_quantity: '', expiry_date: '' });
                }}
              >
                Cancel
              </button>
            )}
          </form>
        </div>
        <div className="csv-section">
          <h2>📤 Batch Import Products</h2>
          <div
            className="csv-upload-area"
            onDragOver={handleCsvDragOver}
            onDragLeave={handleCsvDragLeave}
            onDrop={handleCsvDrop}
          >
            <div className="csv-upload-content">
              <p className="csv-upload-icon">📁</p>
              <p className="csv-upload-text">Drag and drop CSV file here or click to select</p>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                onChange={handleCsvFileChange}
                className="csv-file-input"
              />
            </div>
          </div>

          {csvError && <div className="csv-error">❌ {csvError}</div>}
          {csvSuccess && <div className="csv-success">{csvSuccess}</div>}

          {showPreview && csvPreview.length > 0 && (
            <div className="csv-preview">
              <h3>Preview ({csvPreview.length} products)</h3>
              <div className="csv-preview-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.slice(0, 5).map((product, idx) => (
                      <tr key={idx}>
                        <td>{product.name}</td>
                        <td>{product.category}</td>
                        <td>₵{product.price.toFixed(2)}</td>
                        <td>{product.stock_quantity}</td>
                        <td>{product.expiry_date || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {csvPreview.length > 5 && (
                  <p className="csv-preview-more">... and {csvPreview.length - 5} more products</p>
                )}
              </div>
              <button 
                className="csv-import-btn"
                onClick={handleCsvUpload}
                disabled={csvLoading}
              >
                {csvLoading ? '⏳ Importing...' : `✅ Import ${csvPreview.length} Products`}
              </button>
            </div>
          )}

          <div className="csv-format-info">
            <details>
              <summary>📋 CSV Format Guide</summary>
              <p><strong>Required columns:</strong></p>
              <ul>
                <li><code>name</code> - Product name</li>
                <li><code>category</code> - Product category</li>
                <li><code>price</code> - Product price (numbers only)</li>
                <li><code>stock_quantity</code> - Quantity in stock (whole numbers only)</li>
              </ul>
              <p><strong>Optional columns:</strong></p>
              <ul>
                <li><code>expiry_date</code> - Expiry date (YYYY-MM-DD format)</li>
              </ul>
              <p><strong>Example CSV:</strong></p>
              <pre>name,category,price,stock_quantity,expiry_date
Paracetamol 500mg,Pain Relief,5.99,100,2025-12-31
Aspirin 100mg,Pain Relief,3.50,50,2025-11-15
Vitamin C 1000mg,Supplements,8.99,75,
Antibiotic Cream,Topical,2.99,30,2026-06-30</pre>
            </details>
          </div>
        </div>
        <div className="products-section">
          <h2>Products List</h2>
          <table className="products-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Expiry Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>₵{product.price}</td>
                  <td className={product.stock_quantity < 10 ? 'low-stock' : ''}>
                    {product.stock_quantity}
                  </td>
                  <td>{new Date(product.expiry_date).toLocaleDateString()}</td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEdit(product)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete(product.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Inventory;
