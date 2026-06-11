import { useState, useEffect, useCallback } from 'react';
import { SaleRepository } from '../db/repository';

export function useSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const data = await SaleRepository.getAll();
      setSales(data);
    } catch (err) {
      console.error('Error fetching sales:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const createSale = async (productId, quantity) => {
    const result = await SaleRepository.add({ product_id: productId, quantity });
    await fetchSales();
    return result;
  };

  const refetch = fetchSales;

  return { sales, loading, createSale, refetch };
}
