import { useState, useEffect, useCallback } from 'react';
import { SaleRepository } from '../db/repository';
import { Sale, CartItem } from '../types';

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
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

  const createSale = async (cart: CartItem[], userId: number, paymentMethod: 'cash' | 'card' | 'mobile_money', amountTendered: number) => {
    const result = await SaleRepository.processSale(cart, userId, paymentMethod, amountTendered);
    await fetchSales();
    return result;
  };

  const refetch = fetchSales;

  return { sales, loading, createSale, refetch };
}
