import { Sale } from '../types';

type PrinterListener = (status: PrinterStatus) => void;

export interface PrinterStatus {
  connected: boolean;
  deviceName: string | null;
  status: 'ready' | 'printing' | 'error' | 'no_paper' | 'disconnected';
  error: string | null;
}

class PrinterService {
  private device: USBDevice | null = null;
  private listeners: Set<PrinterListener> = new Set();

  getStatus(): PrinterStatus {
    if (!this.device) {
      return { connected: false, deviceName: null, status: 'disconnected', error: null };
    }
    return {
      connected: true,
      deviceName: this.device.productName || 'Thermal Printer',
      status: 'ready',
      error: null,
    };
  }

  subscribe(listener: PrinterListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const status = this.getStatus();
    for (const listener of this.listeners) {
      listener(status);
    }
  }

  async requestDevice(): Promise<USBDevice> {
    if (!navigator.usb) {
      throw new Error('WebUSB is not supported in this browser. Use Chrome or Edge.');
    }

    const device = await navigator.usb.requestDevice({
      filters: [
        { vendorId: 0x04b8 }, // Epson
        { vendorId: 0x076b }, // Star Micronics
        { vendorId: 0x1504 }, // Bixolon
        { vendorId: 0x0416 }, // Bixolon
        { vendorId: 0x067b }, // Prolific (generic)
      ],
    });

    await device.open();
    await device.selectConfiguration(1);
    await device.claimInterface(0);

    this.device = device;
    this.notify();

    device.addEventListener('disconnect', () => {
      this.device = null;
      this.notify();
    });

    return device;
  }

  async disconnect(): Promise<void> {
    if (this.device) {
      try {
        await this.device.close();
      } catch {
        // ignore
      }
      this.device = null;
      this.notify();
    }
  }

  async printReceipt(sale: Sale, storeName?: string): Promise<void> {
    if (!this.device) throw new Error('No printer connected');

    const data = this.buildEscPosReceipt(sale, storeName || 'Pharmacy POS');
    await this.device.transferOut(1, data);
  }

  async printTestPage(): Promise<void> {
    if (!this.device) throw new Error('No printer connected');

    const ESC = 0x1B;
    const LF = 0x0A;

    const lines: Uint8Array[] = [];
    lines.push(new Uint8Array([ESC, 0x40]));

    lines.push(new Uint8Array([ESC, 0x61, 0x01]));
    lines.push(new Uint8Array([ESC, 0x21, 0x10]));
    lines.push(this.encode('PRINTER TEST'));
    lines.push(new Uint8Array([ESC, 0x21, 0x00]));

    lines.push(this.encode('─'.repeat(24)));
    lines.push(new Uint8Array([ESC, 0x61, 0x00]));
    lines.push(this.encode('Device: ' + (this.device?.productName || 'Unknown')));
    lines.push(this.encode('Status: Connected'));
    lines.push(this.encode('Font: ESC/POS'));
    lines.push(this.encode(''));
    lines.push(new Uint8Array([ESC, 0x61, 0x01]));
    lines.push(this.encode('OK'));
    lines.push(new Uint8Array([LF]));
    lines.push(new Uint8Array([0x1D, 0x56, 0x00]));

    const totalLen = lines.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLen);
    let offset = 0;
    for (const arr of lines) {
      result.set(arr, offset);
      offset += arr.length;
    }

    await this.device.transferOut(1, result);
  }

  private buildEscPosReceipt(sale: Sale, storeName: string): Uint8Array {
    const LF = 0x0A;
    const ESC = 0x1B;
    const GS = 0x1D;

    const lines: Uint8Array[] = [];

    lines.push(new Uint8Array([ESC, 0x40]));

    lines.push(new Uint8Array([ESC, 0x61, 0x01]));
    lines.push(new Uint8Array([ESC, 0x21, 0x10]));
    lines.push(this.encode(storeName));
    lines.push(new Uint8Array([ESC, 0x21, 0x00]));
    lines.push(this.encode(''));
    lines.push(new Uint8Array([ESC, 0x61, 0x00]));

    lines.push(this.encode(`Receipt #${sale.id}`));
    lines.push(this.encode(`Date: ${new Date(sale.date).toLocaleString()}`));
    lines.push(this.encode(`Cashier ID: ${sale.user_id}`));
    lines.push(this.encode(''));

    lines.push(this.encode('─'.repeat(32)));

    const header = 'Item'.padEnd(18) + 'Qty'.padStart(4) + 'Total'.padStart(10);
    lines.push(this.encode(header));
    lines.push(this.encode('─'.repeat(32)));

    for (const item of sale.items || []) {
      const name = item.name.substring(0, 18).padEnd(18);
      const qty = String(item.quantity).padStart(4);
      const total = (item.price * item.quantity).toFixed(2).padStart(10);
      lines.push(this.encode(name + qty + total));
    }

    lines.push(this.encode('─'.repeat(32)));

    lines.push(this.encode(`Subtotal:`.padEnd(22) + sale.total_price.toFixed(2).padStart(10)));
    lines.push(this.encode(`Tax:`.padEnd(22) + sale.tax.toFixed(2).padStart(10)));

    lines.push(new Uint8Array([ESC, 0x45, 0x01]));
    lines.push(this.encode(`TOTAL:`.padEnd(22) + sale.grand_total.toFixed(2).padStart(10)));
    lines.push(new Uint8Array([ESC, 0x45, 0x00]));

    lines.push(this.encode(''));
    const method = sale.payment_method === 'cash' ? 'Cash' : sale.payment_method === 'card' ? 'Card' : 'Mobile Money';
    lines.push(this.encode(`Paid (${method}):`.padEnd(22) + sale.amount_tendered.toFixed(2).padStart(10)));
    lines.push(this.encode(`Change:`.padEnd(22) + sale.change_due.toFixed(2).padStart(10)));

    lines.push(new Uint8Array([LF]));
    lines.push(new Uint8Array([ESC, 0x61, 0x01]));
    lines.push(this.encode('Thank you for your purchase!'));
    lines.push(this.encode(''));
    lines.push(new Uint8Array([GS, 0x56, 0x00]));

    const totalLen = lines.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLen);
    let offset = 0;
    for (const arr of lines) {
      result.set(arr, offset);
      offset += arr.length;
    }

    return result;
  }

  private encode(text: string): Uint8Array {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(text);
    const withNewline = new Uint8Array(encoded.length + 1);
    withNewline.set(encoded);
    withNewline[encoded.length] = 0x0A;
    return withNewline;
  }
}

export const printerService = new PrinterService();
