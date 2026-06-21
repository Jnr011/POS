import { useState, useEffect, useCallback, useRef } from 'react';
import { printerService, PrinterSelectionRequiredError, type PrinterStatus, type PrinterDiagnostics } from '../services/printerService';
import { toast } from 'sonner';
import type { PrinterInfo } from '../services/tauriPrinter';
import type { Sale } from '../types';
import type { ReceiptStoreInfo } from '../lib/receiptBuilder';

const SAVED_PRINTER_KEY = 'pos:selectedPrinter';

function getSavedPrinterName(): string | null {
  try {
    return localStorage.getItem(SAVED_PRINTER_KEY);
  } catch {
    return null;
  }
}

export function usePrinter() {
  const [status, setStatus] = useState<PrinterStatus>(printerService.getStatus());
  const [diagnostics, setDiagnostics] = useState<PrinterDiagnostics | null>(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [selectionCandidates, setSelectionCandidates] = useState<PrinterInfo[] | null>(null);
  const pendingPrintRef = useRef<Sale | null>(null);
  const pendingStoreInfoRef = useRef<ReceiptStoreInfo | undefined>(undefined);

  useEffect(() => {
    return printerService.subscribe(setStatus);
  }, []);

  // Auto-connect to saved printer on mount
  useEffect(() => {
    const savedName = getSavedPrinterName();
    if (savedName && !status.connected) {
      connect(savedName, false);
    }
  }, []);

  // Print a pending receipt once connected (e.g. after printer selection dialog)
  useEffect(() => {
    if (status.connected && pendingPrintRef.current) {
      const sale = pendingPrintRef.current;
      const storeInfo = pendingStoreInfoRef.current;
      pendingPrintRef.current = null;
      pendingStoreInfoRef.current = undefined;
      const tid = toast.loading('Printing receipt...');
      (async () => {
        try {
          await printerService.printReceipt(sale, storeInfo);
          toast.success('Receipt printed', { id: tid });
        } catch (err: any) {
          console.error('[PendingPrint]', err);
          toast.error(err?.message || 'Failed to print receipt', { id: tid });
        }
      })();
    }
  }, [status.connected]);

  const connect = useCallback(async (printerName?: string, showToast = true) => {
    try {
      await printerService.requestDevice(printerName);
      setSelectionCandidates(null);
      if (showToast) toast.success('Printer connected');
    } catch (err: any) {
      if (err instanceof PrinterSelectionRequiredError) {
        setSelectionCandidates(err.candidates);
        return;
      }
      if (err.name !== 'NotFoundError') {
        toast.error(err.message || 'Failed to connect printer');
      } else if (showToast) {
        toast.error('Previously connected printer not found. Please select a printer.');
      }
    }
  }, []);

  const disconnect = useCallback(async () => {
    await printerService.disconnect();
    toast.info('Printer disconnected');
  }, []);

  const printReceipt = useCallback(async (sale: Sale, storeInfo?: ReceiptStoreInfo) => {
    const tid = toast.loading('Printing receipt...');
    try {
      await printerService.printReceipt(sale, storeInfo);
      toast.success('Receipt printed', { id: tid });
    } catch (err: any) {
      console.error('[PrintReceipt]', err);
      toast.error(err?.message || 'Failed to print receipt', { id: tid });
    }
  }, []);

  const connectAndPrint = useCallback(async (sale: Sale, storeInfo?: ReceiptStoreInfo) => {
    if (status.connected) {
      return printReceipt(sale, storeInfo);
    }
    const tid = toast.loading('Connecting to printer...');
    try {
      await printerService.requestDevice();
      toast.loading('Printing receipt...', { id: tid });
      await printerService.printReceipt(sale, storeInfo);
      setSelectionCandidates(null);
      toast.success('Receipt printed', { id: tid });
    } catch (err: any) {
      if (err instanceof PrinterSelectionRequiredError) {
        toast.dismiss(tid);
        pendingPrintRef.current = sale;
        pendingStoreInfoRef.current = storeInfo;
        setSelectionCandidates(err.candidates);
        return;
      }
      if (err.name !== 'NotFoundError') {
        toast.error(err.message || 'Failed to print receipt', { id: tid });
      } else {
        toast.dismiss(tid);
      }
    }
  }, [status.connected, printReceipt]);

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
    connectAndPrint,
    printTestPage,
    diagnostics,
    diagnosticsLoading,
    refreshDiagnostics,
    selectionCandidates,
    setSelectionCandidates,
  };
}
