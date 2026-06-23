import { isTauri } from "../lib/tauri";
import { Sale } from "../types";
import { buildReceiptElements, type ReceiptElement, type ReceiptStoreInfo } from "../lib/receiptBuilder";

type PrinterListener = (status: TauriPrinterStatus) => void;

export interface TauriPrinterStatus {
  connected: boolean;
  deviceName: string | null;
  status: "ready" | "printing" | "error" | "no_paper" | "disconnected";
  error: string | null;
}

export interface PrinterInfo {
  name: string;
  interface_type: string;
  identifier: string;
  status: string;
  likelyVirtual: boolean;
}

export interface PrinterDiagnostics {
  isTauriRuntime: boolean;
  pluginLoaded: boolean;
  printers: PrinterInfo[];
  error: string | null;
  checkedAt: number;
}

const SAVED_PRINTER_KEY = "pos:selectedPrinter";

const VIRTUAL_NAME_PATTERNS = [
  /print to pdf/i, /onenote/i, /evernote/i, /foxit/i,
  /xps document writer/i, /fax/i, /send to/i,
];

const VIRTUAL_PORT_PATTERNS = [
  /^file:/i, /^nul:/i, /^portprompt:/i, /pdf/i, /evernote/i,
];

function isLikelyVirtual(name: string, identifier: string): boolean {
  return VIRTUAL_NAME_PATTERNS.some(r => r.test(name)) ||
    VIRTUAL_PORT_PATTERNS.some(r => r.test(identifier));
}

export class PrinterSelectionRequiredError extends Error {
  candidates: PrinterInfo[];
  constructor(candidates: PrinterInfo[]) {
    super("Multiple printers found — selection required");
    this.candidates = candidates;
    this.name = "PrinterSelectionRequiredError";
  }
}

class TauriPrinterService {
  private listeners: Set<PrinterListener> = new Set();
  private connectedPrinter: string | null = null;

  // KW-Q921: 80mm paper = 48 chars per line
  private static readonly CHARS_PER_LINE = 48;

  getSavedPrinterName(): string | null {
    try {
      return localStorage.getItem(SAVED_PRINTER_KEY);
    } catch {
      return null;
    }
  }

  setSavedPrinterName(name: string) {
    try {
      localStorage.setItem(SAVED_PRINTER_KEY, name);
    } catch {
      // ignore
    }
  }

  clearSavedPrinterName() {
    try {
      localStorage.removeItem(SAVED_PRINTER_KEY);
    } catch {
      // ignore
    }
  }

  private flagPrinters(printers: {
    name: string; interface_type: string; identifier: string; status: string;
  }[]): PrinterInfo[] {
    return printers.map(p => ({ ...p, likelyVirtual: isLikelyVirtual(p.name, p.identifier) }));
  }

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

    const withFlags = this.flagPrinters(printers);

    // Name explicitly provided — find and connect to it
    if (printerName) {
      const chosen = withFlags.find(p => p.name === printerName);
      if (!chosen) throw new Error(`Printer "${printerName}" not found`);
      this.connectedPrinter = chosen.name;
      this.setSavedPrinterName(chosen.name);
      this.notify();
      return chosen.name;
    }

    // No name given — auto-select only if exactly one real printer exists
    const real = withFlags.filter(p => !p.likelyVirtual);
    if (real.length === 1) {
      this.connectedPrinter = real[0].name;
      this.setSavedPrinterName(real[0].name);
      this.notify();
      return real[0].name;
    }

    // Multiple or none — show selection dialog
    throw new PrinterSelectionRequiredError(withFlags);
  }

  async disconnect(): Promise<void> {
    this.connectedPrinter = null;
    this.clearSavedPrinterName();
    this.notify();
  }

  private toPrinterSections(elements: ReceiptElement[], tp: any): any[] {
    return elements.map(el => {
      switch (el.type) {
        case 'title': return tp.title(el.text);
        case 'subtitle': return tp.subtitle(el.text);
        case 'line': return tp.line(el.char || '-');
        case 'text': {
          const opts: any = {};
          if (el.align) opts.align = el.align;
          if (el.bold) opts.bold = el.bold;
          if (el.size) opts.size = el.size;
          return tp.text(el.text || '', opts);
        }
        case 'table': {
          const colCount = el.rows.length ? el.rows[0].length : 3;
          return tp.table(colCount, el.rows, {
            header: el.header,
            column_widths: el.columnWidths,
            truncate: true,
          });
        }
        case 'feed': return tp.feed(el.lines);
        case 'cut': return tp.cut();
      }
    });
  }

  async printReceipt(sale: Sale, storeInfo?: ReceiptStoreInfo): Promise<void> {
    if (!this.connectedPrinter) throw new Error("No printer connected");
    if (!isTauri()) throw new Error("Not running in Tauri");

    const tp = await import("tauri-plugin-thermal-printer");
    const elements = buildReceiptElements(sale, storeInfo);
    const sections = this.toPrinterSections(elements, tp);

    await tp.print_thermal_printer({
      printer: this.connectedPrinter,
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
        printers: this.flagPrinters(printers),
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
