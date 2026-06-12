import { useState, useEffect } from 'react';
import { StoreRepository } from '../db/repository';

export interface StoreInfo {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  taxRate: string;
  taxEnabled: string;
  receiptHeader: string;
  receiptFooter: string;
}

const DEFAULTS: StoreInfo = {
  storeName: 'Pharmacy POS',
  storeAddress: '',
  storePhone: '',
  storeEmail: '',
  taxRate: '10',
  taxEnabled: 'true',
  receiptHeader: '',
  receiptFooter: '',
};

export function useStoreInfo() {
  const [info, setInfo] = useState<StoreInfo>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    StoreRepository.getAll().then(all => {
      if (!cancelled) {
        setInfo(prev => ({ ...prev, ...all }));
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  return { ...info, loading };
}
