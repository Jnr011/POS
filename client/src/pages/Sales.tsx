import React, { useState } from 'react';
import API from '../services/api';
import { useToast } from '../components/Toast';
import { useProducts } from '../hooks/useProducts';
import { useCartStore } from '../store/cartStore';
import { Product } from '../types';
import '../styles/Sales.css';

function Sales() {
  const { addToast } = useToast();
  const { products, loading, refetch } = useProducts();
  const { items: cart, addItem, removeItem, clearCart } = useCartStore();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const handleCheckout = async () => {
    try {
      for (const item of cart) {
        await API.post('/sales', { product_id: item.id, quantity: item.quantity });
      }
      addToast('Sale completed successfully!', 'success');
      clearCart();
      refetch();
    } catch (error: any) {
      console.error('Error processing sale:', error);
      addToast(error.response?.data?.message || 'Error processing sale', 'error');
    }
  };

  const categories = [...new Set(products.map((p: Product) => p.category))];
  const filteredProducts = products.filter((p: Product) =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (!categoryFilter || p.category === categoryFilter)
  );
  const totalAmount = cart.reduce((sum: number, item: any) => sum + (parseFloat(item.price) * item.quantity), 0);

  if (loading) return (
    <div className="sales">
      <h1>Sales</h1>
      <div className="sales-container">
        <div className="products-list">
          <h2>Available Products</h2>
          <div className="products-grid">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="skeleton-card">
                <div className="skeleton skeleton-text long" />
                <div className="skeleton skeleton-text short" />
                <div className="skeleton skeleton-text short" />
                <div className="skeleton skeleton-text" />
                <div className="skeleton skeleton-button" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="sales">
      <h1>Sales</h1>
      <div className="sales-container">
        <div className="products-list">
          <h2>Available Products</h2>
          <div className="sales-filters">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="search-input"
              autoFocus
            />
            <select
              value={categoryFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryFilter(e.target.value)}
              className="category-filter"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="products-grid">
            {filteredProducts.map((product: Product) => (
              <div key={product.id} className="product-card">
                <h3>{product.name}</h3>
                <p>Category: {product.category}</p>
                <p>Price: ₵{product.price}</p>
                <p>Stock: {product.stock_quantity}</p>
                <button
                  onClick={() => addItem(product)}
                  disabled={product.stock_quantity === 0}
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="cart-section">
          <h2>Shopping Cart</h2>
          {cart.length === 0 ? (
            <p>Cart is empty</p>
          ) : (
            <>
              {cart.map((item: any) => (
                <div key={item.id} className="cart-item">
                  <span>{item.name}</span>
                  <span>x{item.quantity}</span>
                  <span>₵{(item.price * item.quantity).toFixed(2)}</span>
                  <button onClick={() => removeItem(item.id)}>Remove</button>
                </div>
              ))}
              <div className="cart-total">
                <strong>Total: ₵{totalAmount.toFixed(2)}</strong>
              </div>
              <button className="checkout-btn" onClick={handleCheckout}>
                Checkout
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Sales;
