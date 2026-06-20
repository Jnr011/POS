import { isTauri } from "../lib/tauri";
import { Sale } from "../types";

type PrinterListener = (status: TauriPrinterStatus) => void;

export interface TauriPrinterStatus {
  connected: boolean;
  deviceName: string | null;
  status: "ready" | "printing" | "error" | "no_paper" | "disconnected";
  error: string | null;
}

export interface ReceiptStoreInfo {
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  receiptHeader?: string;
  receiptFooter?: string;
}

export interface PrinterDiagnostics {
  isTauriRuntime: boolean;
  pluginLoaded: boolean;
  printers: {
    name: string;
    interface_type: string;
    identifier: string;
    status: string;
  }[];
  error: string | null;
  checkedAt: number;
}

class TauriPrinterService {
  private listeners: Set<PrinterListener> = new Set();
  private connectedPrinter: string | null = null;

  // KW-Q921: 80mm paper = 48 chars per line
  private static readonly CHARS_PER_LINE = 48;

  async isAvailable(): Promise<boolean> {
    if (!isTauri()) return false;
    try {
      const { list_thermal_printers } =
        await import("tauri-plugin-thermal-printer");
      const printers = await list_thermal_printers();
      return printers.length > 0;
    } catch {
      return false;
    }
  }

  async listPrinters(): Promise<
    {
      name: string;
      interface_type: string;
      identifier: string;
      status: string;
    }[]
  > {
    if (!isTauri()) return [];
    try {
      const { list_thermal_printers } =
        await import("tauri-plugin-thermal-printer");
      return await list_thermal_printers();
    } catch {
      return [];
    }
  }

  getStatus(): TauriPrinterStatus {
    if (!this.connectedPrinter) {
      return {
        connected: false,
        deviceName: null,
        status: "disconnected",
        error: null,
      };
    }
    return {
      connected: true,
      deviceName: this.connectedPrinter,
      status: "ready",
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

  async connect(printerName?: string): Promise<string> {
    if (!isTauri()) throw new Error("Not running in Tauri");

    const { list_thermal_printers } =
      await import("tauri-plugin-thermal-printer");
    const printers = await list_thermal_printers();
    if (printers.length === 0) throw new Error("No printers found");

    const name = printerName || printers[0].name;
    this.connectedPrinter = name;
    this.notify();
    return name;
  }

  async disconnect(): Promise<void> {
    this.connectedPrinter = null;
    this.notify();
  }

  async printReceipt(sale: Sale, storeInfo?: ReceiptStoreInfo): Promise<void> {
    if (!this.connectedPrinter) throw new Error("No printer connected");
    if (!isTauri()) throw new Error("Not running in Tauri");

    const tp = await import("tauri-plugin-thermal-printer");
    const printerName = this.connectedPrinter;
    const W = TauriPrinterService.CHARS_PER_LINE;

    const storeName = storeInfo?.storeName || "Pharmacy POS";
    const storeAddress = storeInfo?.storeAddress || "";
    const storePhone = storeInfo?.storePhone || "";
    const receiptHeader = storeInfo?.receiptHeader || "";
    const receiptFooter =
      storeInfo?.receiptFooter || "Thank you for your purchase!";

    const paymentMethod =
      sale.payment_method === "cash"
        ? "Cash"
        : sale.payment_method === "card"
          ? "Card"
          : "Mobile Money";

    // Column widths: Name(24) + Qty(6) + Total(16) = 46 + 2 gap = 48
    const COL_NAME = 24;
    const COL_QTY = 6;
    const COL_TOTAL = 16;

    const saleBody = (sale.items || []).map((item) => [
      { text: item.name.substring(0, COL_NAME) },
      { text: String(item.quantity).padStart(COL_QTY) },
      {
        text: `₵${(item.price * item.quantity).toFixed(2)}`.padStart(COL_TOTAL),
      },
    ]);

    const sections = [
      // ── Store Header ──
      tp.title(storeName),
      ...(storeAddress ? [tp.text(storeAddress, { align: "center" })] : []),
      ...(storePhone ? [tp.text(storePhone, { align: "center" })] : []),
      tp.text(""),
      tp.line("="),

      // ── Receipt Info ──
      tp.text(`Receipt #: ${sale.id}`),
      tp.text(`Date: ${new Date(sale.date).toLocaleString()}`),
      tp.text(`Cashier ID: ${sale.user_id}`),
      tp.text(""),
      tp.line("-"),

      // ── Custom header from store settings ──
      ...(receiptHeader ? [tp.text(receiptHeader, { align: "center" })] : []),

      // ── Items Table ──
      tp.table(3, saleBody, {
        column_widths: [COL_NAME, COL_QTY, COL_TOTAL],
        header: [{ text: "Item" }, { text: "Qty" }, { text: "Total" }],
        truncate: true,
      }),
      tp.line("-"),

      // ── Totals ──
      tp.text(
        `Subtotal:${"".padStart(W - 9 - sale.total_price.toFixed(2).length)}₵${sale.total_price.toFixed(2)}`,
        { align: "right" },
      ),
      tp.text(
        `Tax:${"".padStart(W - 4 - sale.tax.toFixed(2).length)}₵${sale.tax.toFixed(2)}`,
        { align: "right" },
      ),
      tp.text(""),
      tp.text(`TOTAL:  ₵${sale.grand_total.toFixed(2)}`, {
        bold: true,
        size: "double",
        align: "right",
      }),
      tp.text(""),

      // ── Payment Info ──
      tp.text(`Payment: ${paymentMethod}`, { bold: true }),
      tp.text(`Tendered: ₵${sale.amount_tendered.toFixed(2)}`),
      tp.text(`Change:   ₵${sale.change_due.toFixed(2)}`),
      tp.text(""),

      // ── Footer ──
      tp.line("="),
      tp.text(receiptFooter, { align: "center" }),
      tp.text(""),
    ];

    // Add custom footer from store settings
    if (receiptHeader && receiptFooter !== receiptHeader) {
      sections.push(tp.text(receiptHeader, { align: "center" }));
    }

    sections.push(tp.feed(3), tp.cut());

    await tp.print_thermal_printer({
      printer: printerName,
      paper_size: "Mm80",
      options: {
        code_page: 6,
        encode: tp.ENCODE.WINDOWS_1252,
        use_gbk: false,
      },
      sections,
    });
  }

  // add this method inside TauriPrinterService
  async getDiagnostics(): Promise<PrinterDiagnostics> {
    const checkedAt = Date.now();

    if (!isTauri()) {
      return {
        isTauriRuntime: false,
        pluginLoaded: false,
        printers: [],
        error: null,
        checkedAt,
      };
    }

    try {
      const { list_thermal_printers } =
        await import("tauri-plugin-thermal-printer");
      const printers = await list_thermal_printers();
      return {
        isTauriRuntime: true,
        pluginLoaded: true,
        printers,
        error: null,
        checkedAt,
      };
    } catch (err: any) {
      return {
        isTauriRuntime: true,
        pluginLoaded: false,
        printers: [],
        error: err?.message || String(err),
        checkedAt,
      };
    }
  }

  async printTestPage(): Promise<void> {
    if (!this.connectedPrinter) throw new Error("No printer connected");
    if (!isTauri()) throw new Error("Not running in Tauri");

    const tp = await import("tauri-plugin-thermal-printer");

    await tp.print_thermal_printer({
      printer: this.connectedPrinter,
      paper_size: "Mm80",
      options: {
        code_page: 6,
        encode: tp.ENCODE.WINDOWS_1252,
        use_gbk: false,
      },
      sections: [
        tp.title("PRINTER TEST"),
        tp.subtitle("KW-Q921 Thermal Receipt Printer"),
        tp.line("="),
        tp.text(""),
        tp.text("Device: Connected", { align: "center" }),
        tp.text("Paper: 80mm (79.5±0.5mm)", { align: "center" }),
        tp.text("Speed: 200mm/sec", { align: "center" }),
        tp.text("Interface: USB + LAN", { align: "center" }),
        tp.text(""),
        tp.line("-"),
        tp.text("Font: ESC/POS", { align: "center" }),
        tp.text("Characters: 48 per line", { align: "center" }),
        tp.text(""),
        tp.text("Test Successful!", { bold: true, align: "center" }),
        tp.text(""),
        tp.feed(3),
        tp.cut(),
      ],
    });
  }
}

export const tauriPrinterService = new TauriPrinterService();
