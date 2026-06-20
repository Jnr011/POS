import { useState, useEffect, useCallback } from 'react';
import { printerService, type PrinterStatus, type PrinterDiagnostics } from '../services/printerService';
import { toast } from 'sonner';

export function usePrinter() {
  const [status, setStatus] = useState<PrinterStatus>(printerService.getStatus());
  const [diagnostics, setDiagnostics] = useState<PrinterDiagnostics | null>(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);

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

  const refreshDiagnostics = useCallback(async () => {
    setDiagnosticsLoading(true);
    try {
      const result = await printerService.getDiagnostics();
      setDiagnostics(result);
      return result;
    } finally {
      setDiagnosticsLoading(false);
    }
  }, []);

  return {
    status,
    connect,
    disconnect,
    printReceipt,
    printTestPage,
    diagnostics,
    diagnosticsLoading,
    refreshDiagnostics,
  };
}
