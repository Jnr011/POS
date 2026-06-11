import { useState, useEffect, useCallback } from 'react';
import API from '../services/api';

export function useSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get('/sales');
      setSales(res.data.sales || []);
    } catch (err) {
      console.error('Error fetching sales:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const createSale = async (productId, quantity) => {
    const res = await API.post('/sales', { product_id: productId, quantity });
    await fetchSales();
    return res.data;
  };

  const refetch = fetchSales;

  return { sales, loading, createSale, refetch };
}
