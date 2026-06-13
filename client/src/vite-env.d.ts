/// <reference types="vite/client" />

declare module '*.css' {}

// WebUSB types for thermal printer support
interface USBDevice {
  vendorId: number;
  productId: number;
  productName: string;
  serialNumber: string;
  opened: boolean;
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface(interfaceNumber: number): Promise<void>;
  transferOut(endpointNumber: number, data: BufferSource | Uint8Array): Promise<USBOutTransferResult>;
  transferIn(endpointNumber: number, length: number): Promise<USBInTransferResult>;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

interface USBOutTransferResult {
  status: string;
  bytesWritten: number;
}

interface USBInTransferResult {
  status: string;
  data?: DataView;
}

interface USB {
  requestDevice(options: { filters: USBDeviceFilter[] }): Promise<USBDevice>;
}

interface USBDeviceFilter {
  vendorId?: number;
  productId?: number;
  classCode?: number;
  subclassCode?: number;
  protocolCode?: number;
  serialNumber?: string;
  manufacturerName?: string;
  productName?: string;
}

interface Navigator {
  usb?: USB;
}
