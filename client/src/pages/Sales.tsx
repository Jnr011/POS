import React, { useState } from 'react';
import API from '../services/api';
import { useToast } from '../components/Toast';
import { useProducts } from '../hooks/useProducts';
import { useCartStore } from '../store/cartStore';
import { Product } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';

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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Sales</h1>
      <div className="flex gap-6">
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-4">Available Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-muted animate-pulse rounded-lg h-40" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Sales</h1>
      <div className="flex gap-6">
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-4">Available Products</h2>
          <div className="flex gap-2 items-center mb-4">
            <Input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="max-w-xs"
              autoFocus
            />
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product: Product) => (
              <div key={product.id} className="border rounded-lg p-4 bg-card shadow-sm">
                <h3 className="font-semibold text-base mb-1">{product.name}</h3>
                <p className="text-sm text-muted-foreground">Category: {product.category}</p>
                <p className="text-sm text-muted-foreground">Price: ₵{product.price}</p>
                <p className="text-sm text-muted-foreground mb-3">Stock: {product.stock_quantity}</p>
                <Button
                  onClick={() => addItem(product)}
                  disabled={product.stock_quantity === 0}
                  size="sm"
                >
                  Add to Cart
                </Button>
              </div>
            ))}
          </div>
        </div>
        <div className="w-80">
          <h2 className="text-lg font-semibold mb-4">Shopping Cart</h2>
          {cart.length === 0 ? (
            <p className="text-muted-foreground">Cart is empty</p>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {cart.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center gap-2">
                    <span className="text-sm truncate">{item.name}</span>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">x{item.quantity}</span>
                    <span className="text-sm whitespace-nowrap">₵{(item.price * item.quantity).toFixed(2)}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>Remove</Button>
                  </div>
                ))}
              </div>
              <div className="mb-4">
                <strong>Total: ₵{totalAmount.toFixed(2)}</strong>
              </div>
              <Button onClick={handleCheckout} className="w-full">
                Checkout
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Sales;
