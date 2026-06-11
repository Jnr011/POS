import { useState, useEffect, useCallback } from 'react';
import { ProductRepository } from '../db/repository';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ProductRepository.getAll();
      setProducts(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const addProduct = async (data) => {
    const result = await ProductRepository.add(data);
    await fetchProducts();
    return result;
  };

  const updateProduct = async (id, data) => {
    const result = await ProductRepository.update(id, data);
    await fetchProducts();
    return result;
  };

  const deleteProduct = async (id) => {
    await ProductRepository.delete(id);
    await fetchProducts();
  };

  const refetch = fetchProducts;

  return { products, loading, error, addProduct, updateProduct, deleteProduct, refetch };
}
