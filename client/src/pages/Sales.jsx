
import React, { useState, useEffect } from 'react';
import API from '../services/api';
import '../styles/Sales.css';

function Sales() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchProducts();
  }, []);

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const handleCheckout = async () => {
    try {
      const token = localStorage.getItem('token');
      for (const item of cart) {
        await API.post(
          '/sales',
          { product_id: item.id, quantity: item.quantity },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      alert('Sale completed successfully!');
      setCart([]);
      // Refresh products
      const response = await API.get('/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error processing sale:', error);
      alert('Error processing sale');
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (loading) return <div className="sales">Loading...</div>;

  return (
    <div className="sales">
      <h1>Sales</h1>
      <div className="sales-container">
        <div className="products-list">
          <h2>Available Products</h2>
          <div className="products-grid">
            {products.map(product => (
              <div key={product.id} className="product-card">
                <h3>{product.name}</h3>
                <p>Category: {product.category}</p>
                <p>Price: ₵{product.price}</p>
                <p>Stock: {product.stock_quantity}</p>
                <button
                  onClick={() => addToCart(product)}
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
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <span>{item.name}</span>
                  <span>x{item.quantity}</span>
                  <span>₵{(item.price * item.quantity).toFixed(2)}</span>
                  <button onClick={() => removeFromCart(item.id)}>Remove</button>
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
