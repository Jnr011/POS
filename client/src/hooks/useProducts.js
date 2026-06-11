import { useState, useEffect, useCallback } from 'react';
import API from '../services/api';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get('/inventory');
      setProducts(res.data.products || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const addProduct = async (data) => {
    const res = await API.post('/inventory', data);
    await fetchProducts();
    return res.data;
  };

  const updateProduct = async (id, data) => {
    const res = await API.put(`/inventory/${id}`, data);
    await fetchProducts();
    return res.data;
  };

  const deleteProduct = async (id) => {
    await API.delete(`/inventory/${id}`);
    await fetchProducts();
  };

  const refetch = fetchProducts;

  return { products, loading, error, addProduct, updateProduct, deleteProduct, refetch };
}
