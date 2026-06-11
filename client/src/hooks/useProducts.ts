import { useState, useEffect, useCallback } from 'react';
import { ProductRepository } from '../db/repository';
import { Product } from '../types';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ProductRepository.getAll();
      setProducts(data);
      setError(null);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const addProduct = async (data: Omit<Product, 'id'>) => {
    const result = await ProductRepository.add(data);
    await fetchProducts();
    return result;
  };

  const updateProduct = async (id: number, data: Partial<Product>) => {
    const result = await ProductRepository.update(id, data);
    await fetchProducts();
    return result;
  };

  const deleteProduct = async (id: number) => {
    await ProductRepository.delete(id);
    await fetchProducts();
  };

  const refetch = fetchProducts;

  return { products, loading, error, addProduct, updateProduct, deleteProduct, refetch };
}
