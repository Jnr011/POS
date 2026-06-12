import { useState, useEffect, useCallback } from 'react';
import { printerService, type PrinterStatus } from '../services/printerService';
import { toast } from 'sonner';

export function usePrinter() {
  const [status, setStatus] = useState<PrinterStatus>(printerService.getStatus());

  useEffect(() => {
    return printerService.subscribe(setStatus);
  }, []);

  const connect = useCallback(async () => {
    try {
      await printerService.requestDevice();
      toast.success('Printer connected');
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        toast.error(err.message || 'Failed to connect printer');
      }
    }
  }, []);

  const disconnect = useCallback(async () => {
    await printerService.disconnect();
    toast.info('Printer disconnected');
  }, []);

  const printReceipt = useCallback(async (sale: Parameters<typeof printerService.printReceipt>[0]) => {
    try {
      await printerService.printReceipt(sale);
      toast.success('Receipt printed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to print receipt');
    }
  }, []);

  const printTestPage = useCallback(async () => {
    try {
      await printerService.printTestPage();
      toast.success('Test page printed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to print test page');
    }
  }, []);

  return {
    status,
    connect,
    disconnect,
    printReceipt,
    printTestPage,
  };
}
